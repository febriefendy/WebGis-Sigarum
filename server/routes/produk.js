const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

/**
 * GET /api/produk
 * List products with multi-criteria filters & pagination
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { id_umkm, kategori, keyword, page, limit } = req.query;

    const conditions = [];
    const params = [];

    if (id_umkm) {
      conditions.push('p.id_umkm = ?');
      params.push(Number(id_umkm));
    }

    if (kategori && kategori !== 'Semua') {
      conditions.push('LOWER(p.kategori) = LOWER(?)');
      params.push(kategori.trim());
    }

    if (keyword && keyword.trim()) {
      const q = `%${keyword.trim().toLowerCase()}%`;
      conditions.push('(LOWER(p.nama_produk) LIKE ? OR LOWER(p.deskripsi) LIKE ? OR LOWER(u.nama_umkm) LIKE ?)');
      params.push(q, q, q);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        p.id_produk, p.id_umkm, p.id_kategori, p.nama_produk, p.kategori,
        p.harga, p.berat, p.deskripsi, p.foto, p.stok_status, p.created_at,
        u.nama_umkm, u.kecamatan, u.desa, u.kontak as kontak_umkm, u.status as status_umkm
      FROM produk p
      JOIN umkm u ON p.id_umkm = u.id_umkm
      ${whereClause}
      ORDER BY p.id_produk ASC
    `;

    const rows = await query.all(sql, params);

    const totalCount = rows.length;
    let paginatedData = rows;
    if (page && limit) {
      const p = Math.max(1, parseInt(page));
      const l = Math.max(1, parseInt(limit));
      const startIndex = (p - 1) * l;
      paginatedData = rows.slice(startIndex, startIndex + l);
    }

    res.json({
      success: true,
      count: paginatedData.length,
      total: totalCount,
      data: paginatedData
    });
  } catch (err) {
    console.error('GET /api/produk error:', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil data katalog produk.' });
  }
});

/**
 * GET /api/produk/:id
 * Retrieve single product with UMKM producer detail
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID Produk tidak valid.' });
    }

    const product = await query.get(
      `SELECT p.*, u.nama_umkm, u.pemilik, u.kecamatan, u.desa, u.alamat, u.kontak as kontak_umkm, u.latitude, u.longitude
       FROM produk p
       JOIN umkm u ON p.id_umkm = u.id_umkm
       WHERE p.id_produk = ?`,
      [id]
    );

    if (!product) {
      return res.status(404).json({ success: false, error: 'Produk tidak ditemukan.' });
    }

    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal mengambil detail produk.' });
  }
});

/**
 * POST /api/produk
 * Create product (Admin or UMKM producer)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    let { id_umkm, nama_produk, kategori, harga, berat, deskripsi, foto, stok_status, id_kategori } = req.body;

    // BR-10: If role is UMKM, enforce their own UMKM ID
    if (req.user.role === 'umkm') {
      id_umkm = req.user.id_umkm || 1;
    }

    if (!id_umkm) {
      return res.status(400).json({ success: false, error: 'UMKM produsen wajib dipilih (Aturan Bisnis BR-06).' });
    }

    // Verify target UMKM exists
    const umkm = await query.get('SELECT id_umkm, nama_umkm FROM umkm WHERE id_umkm = ?', [id_umkm]);
    if (!umkm) {
      return res.status(404).json({ success: false, error: 'UMKM produsen yang dipilih tidak ditemukan dalam sistem.' });
    }

    if (!nama_produk || !nama_produk.trim()) {
      return res.status(400).json({ success: false, error: 'Nama produk wajib diisi.' });
    }

    // BR-13: Harga non-negatif
    const price = parseFloat(harga);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({
        success: false,
        error: 'Harga produk harus berupa angka dan tidak boleh bernilai negatif (Aturan Bisnis BR-13).'
      });
    }

    const result = await query.run(
      `INSERT INTO produk (id_umkm, id_kategori, nama_produk, kategori, harga, berat, deskripsi, foto, stok_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_umkm,
        id_kategori || null,
        nama_produk.trim(),
        kategori || 'Olahan Laut',
        price,
        berat || '250 gram',
        deskripsi || '',
        foto || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
        stok_status || 'Tersedia'
      ]
    );

    const created = await query.get(
      `SELECT p.*, u.nama_umkm FROM produk p JOIN umkm u ON p.id_umkm = u.id_umkm WHERE p.id_produk = ?`,
      [result.lastID]
    );

    res.status(201).json({
      success: true,
      message: 'Produk baru berhasil ditambahkan.',
      data: created
    });
  } catch (err) {
    console.error('POST /api/produk error:', err);
    res.status(500).json({ success: false, error: 'Gagal menambahkan produk baru.' });
  }
});

/**
 * PUT /api/produk/:id
 * Update product
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await query.get('SELECT * FROM produk WHERE id_produk = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Data produk tidak ditemukan.' });
    }

    // BR-10: Pelaku UMKM hanya dapat mengedit produk miliknya
    if (req.user.role === 'umkm') {
      const userUmkmId = req.user.id_umkm || 1;
      if (existing.id_umkm !== userUmkmId) {
        return res.status(403).json({
          success: false,
          error: 'Akses ditolak. Anda hanya diizinkan mengubah produk unit usaha Anda sendiri (Aturan Bisnis BR-10).'
        });
      }
    }

    const { nama_produk, kategori, harga, berat, deskripsi, foto, stok_status, id_umkm, id_kategori } = req.body;

    // BR-13: Validasi harga non-negatif jika diperbarui
    let price = existing.harga;
    if (harga !== undefined) {
      price = parseFloat(harga);
      if (isNaN(price) || price < 0) {
        return res.status(400).json({
          success: false,
          error: 'Harga produk tidak boleh bernilai negatif (Aturan Bisnis BR-13).'
        });
      }
    }

    const targetUmkmId = req.user.role === 'admin' && id_umkm ? id_umkm : existing.id_umkm;

    await query.run(
      `UPDATE produk SET
        nama_produk = ?,
        kategori = ?,
        harga = ?,
        berat = ?,
        deskripsi = ?,
        foto = ?,
        stok_status = ?,
        id_umkm = ?,
        id_kategori = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id_produk = ?`,
      [
        nama_produk ? nama_produk.trim() : existing.nama_produk,
        kategori || existing.kategori,
        price,
        berat !== undefined ? berat : existing.berat,
        deskripsi !== undefined ? deskripsi : existing.deskripsi,
        foto !== undefined ? foto : existing.foto,
        stok_status !== undefined ? stok_status : existing.stok_status,
        targetUmkmId,
        id_kategori !== undefined ? id_kategori : existing.id_kategori,
        id
      ]
    );

    const updated = await query.get(
      `SELECT p.*, u.nama_umkm FROM produk p JOIN umkm u ON p.id_umkm = u.id_umkm WHERE p.id_produk = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Data produk berhasil diperbarui.',
      data: updated
    });
  } catch (err) {
    console.error('PUT /api/produk error:', err);
    res.status(500).json({ success: false, error: 'Gagal memperbarui data produk.' });
  }
});

/**
 * DELETE /api/produk/:id
 * Delete product
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await query.get('SELECT * FROM produk WHERE id_produk = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Data produk tidak ditemukan.' });
    }

    // BR-10: Pelaku UMKM hanya dapat menghapus produk usahanya sendiri
    if (req.user.role === 'umkm') {
      const userUmkmId = req.user.id_umkm || 1;
      if (existing.id_umkm !== userUmkmId) {
        return res.status(403).json({
          success: false,
          error: 'Akses ditolak. Anda tidak berhak menghapus produk UMKM lain.'
        });
      }
    }

    await query.run('DELETE FROM produk WHERE id_produk = ?', [id]);
    res.json({
      success: true,
      message: `Produk "${existing.nama_produk}" berhasil dihapus.`
    });
  } catch (err) {
    console.error('DELETE /api/produk error:', err);
    res.status(500).json({ success: false, error: 'Gagal menghapus produk.' });
  }
});

module.exports = router;
