const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

/**
 * GET /api/stats
 * Real-time computed spatial & business metrics directly from the database
 */
router.get('/', async (req, res) => {
  try {
    // 1. Overall Totals
    const umkmTotals = await query.get(`
      SELECT 
        COUNT(*) as total_umkm,
        SUM(CASE WHEN status = 'Aktif' THEN 1 ELSE 0 END) as total_aktif,
        SUM(CASE WHEN status = 'Nonaktif' THEN 1 ELSE 0 END) as total_nonaktif,
        SUM(CASE WHEN id_kategori = 1 THEN 1 ELSE 0 END) as total_laut,
        SUM(CASE WHEN id_kategori = 2 THEN 1 ELSE 0 END) as total_garam
      FROM umkm
    `);

    const prodTotals = await query.get('SELECT COUNT(*) as total_produk FROM produk');

    // 2. Breakdown per Kecamatan
    const byKecamatanRows = await query.all(`
      SELECT 
        w.kecamatan,
        COUNT(u.id_umkm) as total,
        SUM(CASE WHEN u.id_kategori = 1 THEN 1 ELSE 0 END) as laut,
        SUM(CASE WHEN u.id_kategori = 2 THEN 1 ELSE 0 END) as garam,
        SUM(CASE WHEN u.status = 'Aktif' THEN 1 ELSE 0 END) as aktif,
        SUM(CASE WHEN u.status = 'Nonaktif' THEN 1 ELSE 0 END) as nonaktif
      FROM wilayah w
      LEFT JOIN umkm u ON LOWER(w.kecamatan) = LOWER(u.kecamatan)
      GROUP BY w.kecamatan
      ORDER BY total DESC
    `);

    // 3. Breakdown per Kategori
    const byKategoriRows = await query.all(`
      SELECT 
        k.id_kategori,
        k.nama_kategori,
        k.warna,
        COUNT(DISTINCT u.id_umkm) as total_umkm,
        COUNT(DISTINCT p.id_produk) as total_produk
      FROM kategori k
      LEFT JOIN umkm u ON k.id_kategori = u.id_kategori
      LEFT JOIN produk p ON k.id_kategori = p.id_kategori OR u.id_umkm = p.id_umkm
      GROUP BY k.id_kategori
      ORDER BY k.id_kategori ASC
    `);

    // 4. Products by Kategori Group
    const productsByKategori = await query.all(`
      SELECT 
        kategori,
        COUNT(*) as count,
        AVG(harga) as avg_harga,
        MIN(harga) as min_harga,
        MAX(harga) as max_harga
      FROM produk
      GROUP BY kategori
      ORDER BY count DESC
    `);

    const stats = {
      totalUMKM: umkmTotals.total_umkm || 0,
      totalAktif: umkmTotals.total_aktif || 0,
      totalNonaktif: umkmTotals.total_nonaktif || 0,
      totalLaut: umkmTotals.total_laut || 0,
      totalGaram: umkmTotals.total_garam || 0,
      totalProduk: prodTotals.total_produk || 0,
      totalKecamatan: byKecamatanRows.filter(k => k.total > 0).length,
      byKecamatan: byKecamatanRows,
      byKategori: byKategoriRows,
      productsByKategori
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('GET /api/stats error:', err);
    res.status(500).json({ success: false, error: 'Gagal menghitung statistik dari basis data.' });
  }
});

module.exports = router;
