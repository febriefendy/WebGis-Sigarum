const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);

function generateOrderNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${dateStr}-${rand}`;
}

function generateSubOrderNumber(orderNum, index) {
  return `${orderNum}-S${index}`;
}

/**
 * POST /api/orders
 * Create new multi-vendor order from cart or direct purchase
 */
const handleCreateOrder = async (req, res) => {
  try {
    const userId = req.user.id_user;
    const { id_alamat, metode_pembayaran, catatan_pembeli, kode_kupon } = req.body;

    // 1. Get user cart items
    const cart = await query.get('SELECT id_cart FROM carts WHERE id_user = ?', [userId]);
    if (!cart) {
      return res.status(400).json({ success: false, error: 'Keranjang belanja Anda kosong.' });
    }

    const items = await query.all(`
      SELECT ci.id_cart_item, ci.id_produk, ci.kuantitas,
             p.nama_produk, p.harga, p.berat, p.foto, p.stok, p.status as status_produk,
             u.id_umkm, u.nama_umkm, u.kecamatan as kecamatan_toko
      FROM cart_items ci
      JOIN produk p ON ci.id_produk = p.id_produk
      JOIN umkm u ON p.id_umkm = u.id_umkm
      WHERE ci.id_cart = ?
    `, [cart.id_cart]);

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Keranjang belanja Anda kosong.' });
    }

    // 2. Validate stock for every item before transaction
    for (const item of items) {
      const stock = item.stok !== undefined ? item.stok : 50;
      if (item.kuantitas > stock) {
        return res.status(400).json({
          success: false,
          error: `Stok produk "${item.nama_produk}" tidak mencukupi (Tersedia: ${stock}, diminta: ${item.kuantitas}).`
        });
      }
    }

    // 3. Group by store (UMKM) to create multi-vendor sub-orders
    const storeMap = {};
    let totalBelanja = 0;
    const shippingPerStore = 12000; // Flat local shipping per store in Madura

    items.forEach(item => {
      const storeId = item.id_umkm;
      if (!storeMap[storeId]) {
        storeMap[storeId] = {
          id_umkm: item.id_umkm,
          nama_umkm: item.nama_umkm,
          items: [],
          subtotal: 0
        };
      }
      const itemSubtotal = item.harga * item.kuantitas;
      storeMap[storeId].items.push(item);
      storeMap[storeId].subtotal += itemSubtotal;
      totalBelanja += itemSubtotal;
    });

    const storeIds = Object.keys(storeMap);
    const totalOngkir = storeIds.length * shippingPerStore;
    const biayaLayanan = 1000;

    // 4. Validate coupon discount if provided
    let diskon = 0;
    if (kode_kupon) {
      const coupon = await query.get('SELECT * FROM coupons WHERE kode_kupon = ? AND is_aktif = 1', [kode_kupon.toUpperCase().trim()]);
      if (coupon) {
        if (totalBelanja >= coupon.min_belanja) {
          if (coupon.tipe_diskon === 'persen') {
            diskon = (totalBelanja * coupon.nilai_diskon) / 100;
            if (coupon.maks_diskon && diskon > coupon.maks_diskon) {
              diskon = coupon.maks_diskon;
            }
          } else {
            diskon = coupon.nilai_diskon;
          }
        }
      }
    }

    const totalTagihan = Math.max(0, totalBelanja + totalOngkir + biayaLayanan - diskon);
    const orderNumber = generateOrderNumber();

    // 5. Create Master Order
    const masterOrderRes = await query.run(`
      INSERT INTO orders (nomor_order, id_pembeli, id_alamat, total_belanja, total_ongkir, biaya_layanan, diskon, total_tagihan, metode_pembayaran, status_pembayaran, status_pesanan, catatan_pembeli)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Menunggu_Pembayaran', 'Menunggu_Pembayaran', ?)
    `, [orderNumber, userId, id_alamat || null, totalBelanja, totalOngkir, biayaLayanan, diskon, totalTagihan, metode_pembayaran || 'QRIS', catatan_pembeli || null]);

    const masterOrderId = masterOrderRes.lastID;

    // 6. Platform commission rate (from settings or 2.5%)
    const settingComm = await query.get("SELECT value_text FROM platform_settings WHERE key_name = 'komisi_persen'");
    const commRate = settingComm ? parseFloat(settingComm.value_text) / 100 : 0.025;

    // 7. Create Sub-Orders for each store and snapshot order items
    let storeIndex = 1;
    const createdSubOrders = [];
    for (const storeId of storeIds) {
      const storeData = storeMap[storeId];
      const subOrderNumber = generateSubOrderNumber(orderNumber, storeIndex++);
      const subtotalStore = storeData.subtotal;
      const komisi = subtotalStore * commRate;
      const pendapatanBersih = subtotalStore - komisi;

      const subOrderRes = await query.run(`
        INSERT INTO sub_orders (id_order, id_umkm, nomor_sub_order, subtotal_produk, ongkir, komisi_platform, pendapatan_bersih, status_pesanan, kurir)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Diproses', 'J&T Express')
      `, [masterOrderId, storeId, subOrderNumber, subtotalStore, shippingPerStore, komisi, pendapatanBersih]);

      const subOrderId = subOrderRes.lastID;
      createdSubOrders.push({
        id_sub_order: subOrderId,
        id_umkm: storeId,
        nomor_sub_order: subOrderNumber
      });

      // Save snapshots for each item and decrement stock
      for (const it of storeData.items) {
        const itemSubtotal = it.harga * it.kuantitas;
        await query.run(`
          INSERT INTO order_items (id_sub_order, id_produk, nama_produk_snapshot, harga_snapshot, berat_snapshot, foto_snapshot, kuantitas, subtotal)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [subOrderId, it.id_produk, it.nama_produk, it.harga, it.berat || '250 gr', it.foto, it.kuantitas, itemSubtotal]);

        // Decrement product inventory
        await query.run('UPDATE produk SET stok = MAX(0, stok - ?), terjual = terjual + ? WHERE id_produk = ?', [it.kuantitas, it.kuantitas, it.id_produk]);
      }
    }

    // 8. Create Payment Record
    const refCode = `PAY-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    await query.run(`
      INSERT INTO payments (id_order, nomor_referensi, metode, jumlah_bayar, status)
      VALUES (?, ?, ?, ?, 'Menunggu_Verifikasi')
    `, [masterOrderId, refCode, metode_pembayaran || 'QRIS', totalTagihan]);

    // 9. Clear buyer cart
    await query.run('DELETE FROM cart_items WHERE id_cart = ?', [cart.id_cart]);

    res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat. Silakan lakukan pembayaran.',
      data: {
        id_order: masterOrderId,
        nomor_order: orderNumber,
        total_tagihan: totalTagihan,
        metode_pembayaran: metode_pembayaran || 'QRIS',
        nomor_referensi: refCode,
        total_toko: storeIds.length,
        sub_orders: createdSubOrders
      }
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ success: false, error: 'Gagal memproses pesanan: ' + err.message });
  }
};

router.post('/', handleCreateOrder);
router.post('/checkout', handleCreateOrder);

/**
 * GET /api/orders
 * List orders contextualized by Role (Buyer, Seller, Admin)
 */
router.get('/', async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.id_user;

    if (role === 'admin') {
      // Admin sees all marketplace orders
      const orders = await query.all(`
        SELECT o.*, u.nama as nama_pembeli, u.email as email_pembeli, u.nomor_telepon as telp_pembeli,
               (SELECT COUNT(*) FROM sub_orders WHERE id_order = o.id_order) as jumlah_sub_order
        FROM orders o
        JOIN users u ON o.id_pembeli = u.id_user
        ORDER BY o.id_order DESC
      `);
      return res.json({ success: true, count: orders.length, data: orders });
    }

    if (role === 'penjual' || role === 'umkm') {
      // Seller sees sub-orders for their store
      let sellerStoreId = req.user.id_umkm;
      if (!sellerStoreId) {
        const store = await query.get('SELECT id_umkm FROM umkm WHERE id_user = ?', [userId]);
        if (store) sellerStoreId = store.id_umkm;
      }

      if (!sellerStoreId) {
        return res.json({ success: true, count: 0, data: [] });
      }

      const subOrders = await query.all(`
        SELECT so.*, o.nomor_order, o.status_pembayaran, o.created_at as tanggal_pesan,
               u.nama as nama_pembeli, u.nomor_telepon as telp_pembeli,
               ba.nama_penerima, ba.nomor_telepon as telp_penerima, ba.alamat_lengkap, ba.kecamatan,
               (SELECT COUNT(*) FROM order_items WHERE id_sub_order = so.id_sub_order) as total_item
        FROM sub_orders so
        JOIN orders o ON so.id_order = o.id_order
        JOIN users u ON o.id_pembeli = u.id_user
        LEFT JOIN buyer_addresses ba ON o.id_alamat = ba.id_alamat
        WHERE so.id_umkm = ?
        ORDER BY so.id_sub_order DESC
      `, [sellerStoreId]);

      return res.json({ success: true, count: subOrders.length, data: subOrders });
    }

    // Role is 'pelanggan' (Buyer)
    const myOrders = await query.all(`
      SELECT o.*,
             (SELECT COUNT(*) FROM sub_orders WHERE id_order = o.id_order) as total_toko
      FROM orders o
      WHERE o.id_pembeli = ?
      ORDER BY o.id_order DESC
    `, [userId]);

    res.json({ success: true, count: myOrders.length, data: myOrders });
  } catch (err) {
    console.error('List orders error:', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil riwayat pesanan.' });
  }
});

/**
 * GET /api/orders/:id
 * Get single order details with security ownership verification
 */
router.get('/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    const role = req.user.role;
    const userId = req.user.id_user;

    const order = await query.get(`
      SELECT o.*, u.nama as nama_pembeli, u.email as email_pembeli, u.nomor_telepon as telp_pembeli,
             ba.label_alamat, ba.nama_penerima, ba.nomor_telepon as telp_penerima, ba.alamat_lengkap, ba.kecamatan as kecamatan_kirim, ba.kabupaten, ba.kode_pos
      FROM orders o
      JOIN users u ON o.id_pembeli = u.id_user
      LEFT JOIN buyer_addresses ba ON o.id_alamat = ba.id_alamat
      WHERE o.id_order = ?
    `, [orderId]);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan.' });
    }

    // IDOR Protection: Buyer can only see their own order
    if (role === 'pelanggan' && order.id_pembeli !== userId) {
      return res.status(403).json({ success: false, error: 'Akses ditolak. Anda tidak berhak melihat pesanan ini.' });
    }

    // Fetch Sub-Orders
    const subOrders = await query.all(`
      SELECT so.*, u.nama_umkm, u.kontak as kontak_toko, u.kecamatan as kecamatan_toko
      FROM sub_orders so
      JOIN umkm u ON so.id_umkm = u.id_umkm
      WHERE so.id_order = ?
    `, [orderId]);

    // For each sub-order, fetch snapshot order items
    for (const sub of subOrders) {
      sub.items = await query.all(`
        SELECT oi.*, r.rating, r.komentar as komentar_ulasan
        FROM order_items oi
        LEFT JOIN reviews r ON oi.id_order_item = r.id_order_item
        WHERE oi.id_sub_order = ?
      `, [sub.id_sub_order]);
    }

    // Payment info
    const payment = await query.get('SELECT * FROM payments WHERE id_order = ? ORDER BY id_payment DESC LIMIT 1', [orderId]);

    res.json({
      success: true,
      data: {
        ...order,
        order,
        sub_orders: subOrders,
        payment
      }
    });
  } catch (err) {
    console.error('Order detail error:', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil rincian pesanan.' });
  }
});

/**
 * PUT /api/orders/sub-orders/:id/status
 * Seller updates their sub-order status (e.g. input resi, marking as shipped)
 */
const handleUpdateSubOrderStatus = async (req, res) => {
  try {
    const subOrderId = req.params.id;
    const { kurir, nomor_resi, catatan_penjual } = req.body;
    const status_pesanan = req.body.status_pesanan || req.body.status;
    const role = req.user.role;
    const userId = req.user.id_user;

    const subOrder = await query.get(`
      SELECT so.*, o.status_pembayaran
      FROM sub_orders so
      JOIN orders o ON so.id_order = o.id_order
      WHERE so.id_sub_order = ?
    `, [subOrderId]);

    if (!subOrder) {
      return res.status(404).json({ success: false, error: 'Sub-pesanan tidak ditemukan.' });
    }

    // Ownership check: If seller, verify store ownership
    if (role === 'penjual' || role === 'umkm') {
      const store = await query.get('SELECT id_umkm FROM umkm WHERE id_user = ?', [userId]);
      if (!store || store.id_umkm !== subOrder.id_umkm) {
        return res.status(403).json({ success: false, error: 'Akses ditolak. Anda hanya berhak mengelola pesanan milik toko Anda.' });
      }
    } else if (role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Akses ditolak.' });
    }

    const allowedStatuses = ['Diproses', 'Siap_Dikirim', 'Dalam_Pengiriman', 'Terkirim', 'Selesai', 'Dibatalkan'];
    if (!allowedStatuses.includes(status_pesanan)) {
      return res.status(400).json({ success: false, error: 'Status pesanan tidak valid.' });
    }

    await query.run(`
      UPDATE sub_orders
      SET status_pesanan = ?,
          kurir = COALESCE(?, kurir),
          nomor_resi = COALESCE(?, nomor_resi),
          catatan_penjual = COALESCE(?, catatan_penjual),
          updated_at = CURRENT_TIMESTAMP
      WHERE id_sub_order = ?
    `, [status_pesanan, kurir || null, nomor_resi || null, catatan_penjual || null, subOrderId]);

    // Update parent order status if all sub-orders are shipped or completed
    const allSubs = await query.all('SELECT status_pesanan FROM sub_orders WHERE id_order = ?', [subOrder.id_order]);
    const allShipped = allSubs.every(s => s.status_pesanan === 'Dalam_Pengiriman' || s.status_pesanan === 'Selesai');
    const allDone = allSubs.every(s => s.status_pesanan === 'Selesai');

    if (allDone) {
      await query.run('UPDATE orders SET status_pesanan = "Selesai", updated_at = CURRENT_TIMESTAMP WHERE id_order = ?', [subOrder.id_order]);
    } else if (allShipped) {
      await query.run('UPDATE orders SET status_pesanan = "Dalam_Pengiriman", updated_at = CURRENT_TIMESTAMP WHERE id_order = ?', [subOrder.id_order]);
    }

    res.json({
      success: true,
      message: `Status pesanan berhasil diubah menjadi ${status_pesanan}.`,
      data: {
        id_sub_order: subOrderId,
        status_pesanan: status_pesanan,
        nomor_resi: nomor_resi || subOrder.nomor_resi
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal memperbarui status pengiriman pesanan.' });
  }
};

const handleConfirmReceived = async (req, res) => {
  try {
    const subOrderId = req.params.id;
    const userId = req.user.id_user;

    const subOrder = await query.get(`
      SELECT so.*, o.id_pembeli, o.id_order
      FROM sub_orders so
      JOIN orders o ON so.id_order = o.id_order
      WHERE so.id_sub_order = ?
    `, [subOrderId]);

    if (!subOrder) {
      return res.status(404).json({ success: false, error: 'Sub-pesanan tidak ditemukan.' });
    }

    if (subOrder.id_pembeli !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Akses ditolak.' });
    }

    // Update status to Selesai
    await query.run('UPDATE sub_orders SET status_pesanan = "Selesai", updated_at = CURRENT_TIMESTAMP WHERE id_sub_order = ?', [subOrderId]);

    // Credit seller store available balance
    await query.run(`
      UPDATE umkm
      SET saldo_tersedia = saldo_tersedia + ?
      WHERE id_umkm = ?
    `, [subOrder.pendapatan_bersih, subOrder.id_umkm]);

    // Check if entire master order is now completed
    const remaining = await query.all('SELECT id_sub_order FROM sub_orders WHERE id_order = ? AND status_pesanan != "Selesai"', [subOrder.id_order]);
    if (remaining.length === 0) {
      await query.run('UPDATE orders SET status_pesanan = "Selesai", updated_at = CURRENT_TIMESTAMP WHERE id_order = ?', [subOrder.id_order]);
    }

    res.json({
      success: true,
      message: 'Pesanan telah dikonfirmasi selesai. Terima kasih telah berbelanja!'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal mengonfirmasi pesanan.' });
  }
};

router.put('/sub-orders/:id/status', handleUpdateSubOrderStatus);
router.put('/sub-order/:id/status', handleUpdateSubOrderStatus);
router.post('/sub-orders/:id/confirm-received', handleConfirmReceived);
router.post('/sub-order/:id/confirm-received', handleConfirmReceived);

module.exports = router;
