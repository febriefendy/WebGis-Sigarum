const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * GET /api/kategori
 * List all categories with count of UMKM & products
 */
router.get('/', async (req, res) => {
  try {
    const categories = await query.all(`
      SELECT 
        k.id_kategori, k.nama_kategori, k.slug, k.deskripsi, k.warna, k.icon,
        k.badge_bg, k.badge_text, k.border_color,
        COUNT(DISTINCT u.id_umkm) as total_umkm,
        COUNT(DISTINCT p.id_produk) as total_produk
      FROM kategori k
      LEFT JOIN umkm u ON k.id_kategori = u.id_kategori
      LEFT JOIN produk p ON k.id_kategori = p.id_kategori OR u.id_umkm = p.id_umkm
      GROUP BY k.id_kategori
      ORDER BY k.id_kategori ASC
    `);

    res.json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal mengambil data kategori.' });
  }
});

/**
 * POST /api/kategori
 * Create category (Admin only)
 */
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { nama_kategori, slug, deskripsi, warna, icon } = req.body;

    if (!nama_kategori || !nama_kategori.trim()) {
      return res.status(400).json({ success: false, error: 'Nama kategori wajib diisi.' });
    }

    const autoSlug = (slug || nama_kategori)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const existing = await query.get('SELECT id_kategori FROM kategori WHERE LOWER(nama_kategori) = LOWER(?) OR slug = ?', [nama_kategori.trim(), autoSlug]);
    if (existing) {
      return res.status(409).json({ success: false, error: 'Kategori dengan nama atau slug serupa sudah terdaftar.' });
    }

    const result = await query.run(
      `INSERT INTO kategori (nama_kategori, slug, deskripsi, warna, icon)
       VALUES (?, ?, ?, ?, ?)`,
      [nama_kategori.trim(), autoSlug, deskripsi || '', warna || '#0284c7', icon || 'box']
    );

    const created = await query.get('SELECT * FROM kategori WHERE id_kategori = ?', [result.lastID]);
    res.status(201).json({ success: true, message: 'Kategori baru berhasil dibuat.', data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal membuat kategori baru.' });
  }
});

/**
 * PUT /api/kategori/:id
 * Update category (Admin only)
 */
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await query.get('SELECT * FROM kategori WHERE id_kategori = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Kategori tidak ditemukan.' });
    }

    const { nama_kategori, deskripsi, warna, icon } = req.body;

    await query.run(
      `UPDATE kategori SET
        nama_kategori = ?,
        deskripsi = ?,
        warna = ?,
        icon = ?
       WHERE id_kategori = ?`,
      [
        nama_kategori ? nama_kategori.trim() : existing.nama_kategori,
        deskripsi !== undefined ? deskripsi : existing.deskripsi,
        warna || existing.warna,
        icon || existing.icon,
        id
      ]
    );

    const updated = await query.get('SELECT * FROM kategori WHERE id_kategori = ?', [id]);
    res.json({ success: true, message: 'Kategori berhasil diperbarui.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal memperbarui kategori.' });
  }
});

/**
 * DELETE /api/kategori/:id
 * Delete category (Admin only - protected against cascade if in use)
 */
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const inUse = await query.get('SELECT COUNT(*) as cnt FROM umkm WHERE id_kategori = ?', [id]);
    if (inUse && inUse.cnt > 0) {
      return res.status(400).json({
        success: false,
        error: `Kategori tidak dapat dihapus karena masih digunakan oleh ${inUse.cnt} unit UMKM. Pindahkan atau hapus UMKM terkait terlebih dahulu.`
      });
    }

    await query.run('DELETE FROM kategori WHERE id_kategori = ?', [id]);
    res.json({ success: true, message: 'Kategori berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal menghapus kategori.' });
  }
});

module.exports = router;
