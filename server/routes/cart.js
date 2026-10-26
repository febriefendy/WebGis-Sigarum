const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// All cart endpoints require authenticated user
router.use(authenticateToken);

// Helper to get or create cart for user
async function getOrCreateCart(userId) {
  let cart = await query.get('SELECT id_cart FROM carts WHERE id_user = ?', [userId]);
  if (!cart) {
    const res = await query.run('INSERT INTO carts (id_user) VALUES (?)', [userId]);
    return res.lastID;
  }
  return cart.id_cart;
}

/**
 * GET /api/cart
 * Fetch active user's cart with live store & product details
 */
router.get('/', async (req, res) => {
  try {
    const cartId = await getOrCreateCart(req.user.id_user);

    const items = await query.all(`
      SELECT ci.id_cart_item, ci.id_cart, ci.id_produk, ci.kuantitas, ci.updated_at,
             p.nama_produk, p.harga, p.berat, p.foto, p.stok, p.stok_status,
             u.id_umkm, u.nama_umkm, u.kecamatan as kecamatan_toko
      FROM cart_items ci
      JOIN produk p ON ci.id_produk = p.id_produk
      JOIN umkm u ON p.id_umkm = u.id_umkm
      WHERE ci.id_cart = ?
      ORDER BY u.id_umkm ASC, ci.id_cart_item DESC
    `, [cartId]);

    // Group items by store (UMKM) for multi-vendor checkout clarity
    const storeMap = {};
    let grandSubtotal = 0;
    let totalItems = 0;

    items.forEach(item => {
      const storeId = item.id_umkm;
      if (!storeMap[storeId]) {
        storeMap[storeId] = {
          id_umkm: item.id_umkm,
          nama_umkm: item.nama_umkm,
          kecamatan_toko: item.kecamatan_toko,
          items: [],
          subtotal_toko: 0
        };
      }
      const itemSubtotal = item.harga * item.kuantitas;
      storeMap[storeId].items.push(item);
      storeMap[storeId].subtotal_toko += itemSubtotal;
      grandSubtotal += itemSubtotal;
      totalItems += item.kuantitas;
    });

    res.json({
      success: true,
      data: {
        id_cart: cartId,
        groups: Object.values(storeMap),
        stores: Object.values(storeMap),
        total_items: totalItems,
        subtotal: grandSubtotal,
        grand_subtotal: grandSubtotal
      }
    });
  } catch (err) {
    console.error('Cart fetch error:', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil data keranjang belanja.' });
  }
});

/**
 * POST /api/cart
 * Add product to cart with server-side stock validation
 */
router.post('/', async (req, res) => {
  try {
    const { id_produk, kuantitas, jumlah } = req.body;
    const qty = parseInt(kuantitas || jumlah, 10) || 1;

    if (!id_produk || qty <= 0) {
      return res.status(400).json({ success: false, error: 'ID produk dan kuantitas valid wajib disertakan.' });
    }

    // Verify product exists and has stock
    const product = await query.get('SELECT id_produk, nama_produk, harga, stok, status FROM produk WHERE id_produk = ?', [id_produk]);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Produk tidak ditemukan.' });
    }

    if (product.status && product.status !== 'Aktif') {
      return res.status(400).json({ success: false, error: 'Produk sedang tidak aktif atau dalam moderasi.' });
    }

    const availableStock = product.stok !== undefined ? product.stok : 50;

    const cartId = await getOrCreateCart(req.user.id_user);

    // Check if item already in cart
    const existing = await query.get('SELECT id_cart_item, kuantitas FROM cart_items WHERE id_cart = ? AND id_produk = ?', [cartId, id_produk]);

    if (existing) {
      const newQty = existing.kuantitas + qty;
      if (newQty > availableStock) {
        return res.status(400).json({
          success: false,
          error: `Stok produk "${product.nama_produk}" tidak mencukupi (Tersedia: ${availableStock}, Di keranjang: ${existing.kuantitas}).`
        });
      }
      await query.run('UPDATE cart_items SET kuantitas = ?, updated_at = CURRENT_TIMESTAMP WHERE id_cart_item = ?', [newQty, existing.id_cart_item]);
    } else {
      if (qty > availableStock) {
        return res.status(400).json({
          success: false,
          error: `Stok produk "${product.nama_produk}" tidak mencukupi (Tersedia: ${availableStock}).`
        });
      }
      await query.run('INSERT INTO cart_items (id_cart, id_produk, kuantitas) VALUES (?, ?, ?)', [cartId, id_produk, qty]);
    }

    res.json({
      success: true,
      message: `"${product.nama_produk}" berhasil dimasukkan ke keranjang belanja.`
    });
  } catch (err) {
    console.error('Cart add error:', err);
    res.status(500).json({ success: false, error: 'Gagal menambahkan produk ke keranjang belanja.' });
  }
});

/**
 * PUT /api/cart/items/:id
 * Update item quantity in cart
 */
router.put('/items/:id', async (req, res) => {
  try {
    const { kuantitas } = req.body;
    const qty = parseInt(kuantitas, 10);
    const cartItemId = req.params.id;

    if (!qty || qty <= 0) {
      return res.status(400).json({ success: false, error: 'Kuantitas harus lebih dari 0.' });
    }

    // Security check: verify this cart item belongs to active user's cart
    const cartId = await getOrCreateCart(req.user.id_user);
    const item = await query.get(`
      SELECT ci.id_cart_item, ci.id_produk, p.stok, p.nama_produk
      FROM cart_items ci
      JOIN produk p ON ci.id_produk = p.id_produk
      WHERE ci.id_cart_item = ? AND ci.id_cart = ?
    `, [cartItemId, cartId]);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Item keranjang tidak ditemukan.' });
    }

    const availableStock = item.stok !== undefined ? item.stok : 50;
    if (qty > availableStock) {
      return res.status(400).json({
        success: false,
        error: `Stok tidak mencukupi. Maksimal ${availableStock} unit.`
      });
    }

    await query.run('UPDATE cart_items SET kuantitas = ?, updated_at = CURRENT_TIMESTAMP WHERE id_cart_item = ?', [qty, cartItemId]);

    res.json({ success: true, message: 'Jumlah produk berhasil diperbarui.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal memperbarui item keranjang.' });
  }
});

/**
 * DELETE /api/cart/items/:id
 * Remove item from cart
 */
router.delete('/items/:id', async (req, res) => {
  try {
    const cartId = await getOrCreateCart(req.user.id_user);
    const result = await query.run('DELETE FROM cart_items WHERE id_cart_item = ? AND id_cart = ?', [req.params.id, cartId]);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Item tidak ditemukan di keranjang Anda.' });
    }

    res.json({ success: true, message: 'Produk berhasil dihapus dari keranjang.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal menghapus produk dari keranjang.' });
  }
});

/**
 * DELETE /api/cart
 * Clear entire cart
 */
router.delete('/', async (req, res) => {
  try {
    const cartId = await getOrCreateCart(req.user.id_user);
    await query.run('DELETE FROM cart_items WHERE id_cart = ?', [cartId]);
    res.json({ success: true, message: 'Keranjang belanja berhasil dikosongkan.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal mengosongkan keranjang.' });
  }
});

module.exports = router;
