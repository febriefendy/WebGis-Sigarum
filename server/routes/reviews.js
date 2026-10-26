const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/reviews/product/:id
 * Public: Get verified reviews for a specific product
 */
router.get('/product/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const reviews = await query.all(`
      SELECT r.*, u.nama as nama_pembeli
      FROM reviews r
      JOIN users u ON r.id_user = u.id_user
      WHERE r.id_produk = ?
      ORDER BY r.id_review DESC
    `, [productId]);

    const avg = await query.get('SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE id_produk = ?', [productId]);

    res.json({
      success: true,
      data: reviews,
      summary: {
        rating_avg: avg && avg.avg_rating ? parseFloat(avg.avg_rating).toFixed(1) : '5.0',
        total_ulasan: avg ? avg.count : 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal mengambil ulasan produk.' });
  }
});

/**
 * POST /api/reviews
 * Buyer posts review for a purchased product
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { id_produk, id_order_item, rating, komentar } = req.body;
    const userId = req.user.id_user;
    const numRating = parseInt(rating, 10);

    if (!id_produk || !numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, error: 'Rating harus bernilai antara 1 hingga 5 bintang.' });
    }

    // Verify order item was purchased by this user if id_order_item is provided
    if (id_order_item) {
      const orderItem = await query.get(`
        SELECT oi.id_order_item, o.id_pembeli, so.status_pesanan
        FROM order_items oi
        JOIN sub_orders so ON oi.id_sub_order = so.id_sub_order
        JOIN orders o ON so.id_order = o.id_order
        WHERE oi.id_order_item = ?
      `, [id_order_item]);

      if (!orderItem || orderItem.id_pembeli !== userId) {
        return res.status(403).json({ success: false, error: 'Ulasan hanya dapat diberikan untuk produk yang telah Anda beli.' });
      }

      // Check if already reviewed
      const existing = await query.get('SELECT id_review FROM reviews WHERE id_order_item = ?', [id_order_item]);
      if (existing) {
        return res.status(400).json({ success: false, error: 'Anda telah memberikan ulasan untuk pesanan ini.' });
      }
    }

    const insertRes = await query.run(`
      INSERT INTO reviews (id_produk, id_order_item, id_user, rating, komentar)
      VALUES (?, ?, ?, ?, ?)
    `, [id_produk, id_order_item || null, userId, numRating, (komentar || '').trim()]);

    // Recalculate average rating for UMKM store
    const storeInfo = await query.get('SELECT id_umkm FROM produk WHERE id_produk = ?', [id_produk]);
    if (storeInfo) {
      const storeAvg = await query.get(`
        SELECT AVG(r.rating) as avg_rat, COUNT(r.id_review) as total_rev
        FROM reviews r
        JOIN produk p ON r.id_produk = p.id_produk
        WHERE p.id_umkm = ?
      `, [storeInfo.id_umkm]);

      if (storeAvg && storeAvg.total_rev > 0) {
        await query.run('UPDATE umkm SET rating_avg = ?, rating_count = ? WHERE id_umkm = ?', [
          parseFloat(storeAvg.avg_rat).toFixed(1),
          storeAvg.total_rev,
          storeInfo.id_umkm
        ]);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Ulasan Anda berhasil dikirimkan. Terima kasih!',
      data: { id_review: insertRes.lastID },
      id_review: insertRes.lastID
    });
  } catch (err) {
    console.error('Review submit error:', err);
    res.status(500).json({ success: false, error: 'Gagal mengirimkan ulasan: ' + err.message });
  }
});

/**
 * PUT /api/reviews/:id/reply
 * Seller replies to review on their product
 */
router.put('/:id/reply', authenticateToken, async (req, res) => {
  try {
    const { balasan } = req.body;
    const reviewId = req.params.id;
    const userId = req.user.id_user;

    const review = await query.get(`
      SELECT r.*, p.id_umkm, u.id_user as owner_user_id
      FROM reviews r
      JOIN produk p ON r.id_produk = p.id_produk
      JOIN umkm u ON p.id_umkm = u.id_umkm
      WHERE r.id_review = ?
    `, [reviewId]);

    if (!review) {
      return res.status(404).json({ success: false, error: 'Ulasan tidak ditemukan.' });
    }

    // Ownership check: only the store owner or admin can reply
    if (review.owner_user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Akses ditolak. Anda hanya dapat membalas ulasan pada produk toko Anda.' });
    }

    await query.run(`
      UPDATE reviews
      SET balasan_penjual = ?, balasan_pada = CURRENT_TIMESTAMP
      WHERE id_review = ?
    `, [(balasan || '').trim(), reviewId]);

    res.json({ success: true, message: 'Balasan ulasan berhasil disimpan.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal membalas ulasan.' });
  }
});

module.exports = router;
