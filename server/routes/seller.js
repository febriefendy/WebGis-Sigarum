const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All seller endpoints require authenticated seller or admin
router.use(authenticateToken);

// Helper to get authenticated seller's store ID with strict ownership validation
async function getSellerStore(req) {
  if (req.user.role === 'admin' && req.query.id_umkm) {
    return await query.get('SELECT * FROM umkm WHERE id_umkm = ?', [req.query.id_umkm]);
  }
  return await query.get('SELECT * FROM umkm WHERE id_user = ? LIMIT 1', [req.user.id_user]);
}

/**
 * GET /api/seller/dashboard
 * Seller Overview Metrics & Statistics
 */
router.get('/dashboard', async (req, res) => {
  try {
    const store = await getSellerStore(req);
    if (!store) {
      return res.status(404).json({ success: false, error: 'Profil toko Anda belum terdaftar.' });
    }

    const storeId = store.id_umkm;

    // 1. Total Produk & Stok
    const prodStats = await query.get(`
      SELECT COUNT(*) as total_produk, COALESCE(SUM(stok), 0) as total_stok
      FROM produk WHERE id_umkm = ?
    `, [storeId]);

    // 2. Orders breakdown
    const orderCounts = await query.get(`
      SELECT 
        COUNT(CASE WHEN status_pesanan = 'Diproses' THEN 1 END) as pesanan_perlu_diproses,
        COUNT(CASE WHEN status_pesanan = 'Siap_Dikirim' THEN 1 END) as pesanan_siap_kirim,
        COUNT(CASE WHEN status_pesanan = 'Dalam_Pengiriman' THEN 1 END) as pesanan_dalam_pengiriman,
        COUNT(CASE WHEN status_pesanan = 'Selesai' THEN 1 END) as pesanan_selesai,
        COUNT(CASE WHEN status_pesanan = 'Dibatalkan' THEN 1 END) as pesanan_dibatalkan,
        COUNT(*) as total_pesanan
      FROM sub_orders WHERE id_umkm = ?
    `, [storeId]);

    // 3. Financial calculations
    const finances = await query.get(`
      SELECT 
        COALESCE(SUM(subtotal_produk), 0) as total_penjualan_kotor,
        COALESCE(SUM(komisi_platform), 0) as total_komisi,
        COALESCE(SUM(pendapatan_bersih), 0) as total_pendapatan_bersih
      FROM sub_orders 
      WHERE id_umkm = ? AND status_pesanan IN ('Dalam_Pengiriman', 'Terkirim', 'Selesai')
    `, [storeId]);

    // 4. Recent incoming orders (5 items)
    const recentOrders = await query.all(`
      SELECT so.*, o.nomor_order, o.created_at as tanggal_pesan, u.nama as nama_pembeli
      FROM sub_orders so
      JOIN orders o ON so.id_order = o.id_order
      JOIN users u ON o.id_pembeli = u.id_user
      WHERE so.id_umkm = ?
      ORDER BY so.id_sub_order DESC LIMIT 5
    `, [storeId]);

    res.json({
      success: true,
      data: {
        toko: store,
        produk: {
          total_produk: prodStats.total_produk || 0,
          total_stok: prodStats.total_stok || 0
        },
        pesanan: orderCounts,
        keuangan: {
          penjualan_kotor: finances.total_penjualan_kotor || 0,
          komisi_platform: finances.total_komisi || 0,
          pendapatan_bersih: finances.total_pendapatan_bersih || 0,
          saldo_tersedia: store.saldo_tersedia || 0,
          saldo_tertahan: store.saldo_tertahan || 0
        },
        pesanan_terbaru: recentOrders
      }
    });
  } catch (err) {
    console.error('Seller dashboard error:', err);
    res.status(500).json({ success: false, error: 'Gagal memuat dashboard penjual.' });
  }
});

/**
 * GET /api/seller/store
 * Fetch store settings
 */
router.get('/store', async (req, res) => {
  try {
    const store = await getSellerStore(req);
    if (!store) {
      return res.status(404).json({ success: false, error: 'Toko belum ditemukan.' });
    }
    res.json({ success: true, data: store });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal memuat profil toko.' });
  }
});

/**
 * PUT /api/seller/store
 * Update store details
 */
router.put('/store', async (req, res) => {
  try {
    const store = await getSellerStore(req);
    if (!store) {
      return res.status(404).json({ success: false, error: 'Toko belum ditemukan.' });
    }

    const { nama_umkm, deskripsi, alamat, kontak, banner, foto, desa, kecamatan } = req.body;

    await query.run(`
      UPDATE umkm
      SET nama_umkm = COALESCE(?, nama_umkm),
          deskripsi = COALESCE(?, deskripsi),
          alamat = COALESCE(?, alamat),
          kontak = COALESCE(?, kontak),
          banner = COALESCE(?, banner),
          foto = COALESCE(?, foto),
          desa = COALESCE(?, desa),
          kecamatan = COALESCE(?, kecamatan),
          updated_at = CURRENT_TIMESTAMP
      WHERE id_umkm = ?
    `, [nama_umkm, deskripsi, alamat, kontak, banner, foto, desa, kecamatan, store.id_umkm]);

    const updated = await query.get('SELECT * FROM umkm WHERE id_umkm = ?', [store.id_umkm]);

    res.json({ success: true, message: 'Informasi toko berhasil disimpan.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal memperbarui informasi toko.' });
  }
});

/**
 * GET /api/seller/reports
 * Sales report with date range filters
 */
router.get('/reports', async (req, res) => {
  try {
    const store = await getSellerStore(req);
    if (!store) {
      return res.status(404).json({ success: false, error: 'Toko belum ditemukan.' });
    }

    const { start_date, end_date } = req.query;
    let sql = `
      SELECT so.id_sub_order, so.nomor_sub_order, so.subtotal_produk, so.ongkir, so.komisi_platform, so.pendapatan_bersih, so.status_pesanan, so.created_at,
             o.nomor_order, u.nama as nama_pembeli
      FROM sub_orders so
      JOIN orders o ON so.id_order = o.id_order
      JOIN users u ON o.id_pembeli = u.id_user
      WHERE so.id_umkm = ?
    `;
    const params = [store.id_umkm];

    if (start_date) {
      sql += ' AND so.created_at >= ?';
      params.push(`${start_date} 00:00:00`);
    }
    if (end_date) {
      sql += ' AND so.created_at <= ?';
      params.push(`${end_date} 23:59:59`);
    }

    sql += ' ORDER BY so.id_sub_order DESC';

    const records = await query.all(sql, params);

    const summary = records.reduce((acc, row) => {
      acc.total_kotor += row.subtotal_produk;
      acc.total_komisi += row.komisi_platform;
      acc.total_bersih += row.pendapatan_bersih;
      return acc;
    }, { total_kotor: 0, total_komisi: 0, total_bersih: 0 });

    res.json({
      success: true,
      summary,
      count: records.length,
      data: records
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal memuat laporan penjualan.' });
  }
});

module.exports = router;
