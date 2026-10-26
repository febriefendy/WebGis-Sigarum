const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * GET /api/coupons
 * Public: List active promotion vouchers
 */
router.get('/', async (req, res) => {
  try {
    const list = await query.all('SELECT id_coupon, kode_kupon, tipe_diskon, nilai_diskon, min_belanja, maks_diskon FROM coupons WHERE is_aktif = 1');
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal mengambil data kupon promosi.' });
  }
});

/**
 * POST /api/coupons/validate
 * Validate coupon code against cart subtotal
 */
router.post('/validate', async (req, res) => {
  try {
    const { kode_kupon, subtotal } = req.body;
    if (!kode_kupon) {
      return res.status(400).json({ success: false, error: 'Kode kupon wajib diisi.' });
    }

    const code = kode_kupon.toUpperCase().trim();
    const coupon = await query.get('SELECT * FROM coupons WHERE kode_kupon = ? AND is_aktif = 1', [code]);

    if (!coupon) {
      return res.status(404).json({ success: false, error: 'Kupon promosi tidak ditemukan atau sudah tidak aktif.' });
    }

    const cartTotal = parseFloat(subtotal) || 0;
    if (cartTotal < coupon.min_belanja) {
      return res.status(400).json({
        success: false,
        error: `Minimal transaksi untuk menggunakan kupon ini adalah Rp ${Number(coupon.min_belanja).toLocaleString('id-ID')}.`
      });
    }

    let discount = 0;
    if (coupon.tipe_diskon === 'persen') {
      discount = (cartTotal * coupon.nilai_diskon) / 100;
      if (coupon.maks_diskon && discount > coupon.maks_diskon) {
        discount = coupon.maks_diskon;
      }
    } else {
      discount = coupon.nilai_diskon;
    }

    res.json({
      success: true,
      message: `Kupon "${coupon.kode_kupon}" berhasil diterapkan!`,
      data: {
        kode_kupon: coupon.kode_kupon,
        tipe_diskon: coupon.tipe_diskon,
        nilai_diskon: coupon.nilai_diskon,
        potongan: discount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal memvalidasi kupon promosi.' });
  }
});

module.exports = router;
