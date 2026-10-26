const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { query } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * GET /api/wilayah
 * List subdistricts with aggregated UMKM counts
 */
router.get('/', async (req, res) => {
  try {
    const list = await query.all(`
      SELECT 
        w.id_wilayah, w.nama_wilayah, w.kecamatan, w.kabupaten, w.provinsi,
        w.tipe_pesisir, w.deskripsi, w.center_lat, w.center_lng, w.zoom, w.potensi_utama,
        COUNT(DISTINCT u.id_umkm) as total_umkm,
        SUM(CASE WHEN u.status = 'Aktif' THEN 1 ELSE 0 END) as total_aktif,
        SUM(CASE WHEN u.status = 'Nonaktif' THEN 1 ELSE 0 END) as total_nonaktif
      FROM wilayah w
      LEFT JOIN umkm u ON LOWER(w.kecamatan) = LOWER(u.kecamatan)
      GROUP BY w.id_wilayah
      ORDER BY w.id_wilayah ASC
    `);

    const formatted = list.map(item => ({
      ...item,
      center: item.center_lat && item.center_lng ? [item.center_lat, item.center_lng] : null,
      tipe: item.tipe_pesisir
    }));

    res.json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (err) {
    console.error('GET /api/wilayah error:', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil data wilayah.' });
  }
});

/**
 * GET /api/wilayah/geojson
 * Retrieve GeoJSON polygon boundaries for Pamekasan coastal subdistricts
 * Dynamically enriched with live UMKM totals
 */
router.get('/geojson', async (req, res) => {
  try {
    const geojsonPath = path.join(__dirname, '..', '..', 'data', 'wilayah.geojson');
    if (!fs.existsSync(geojsonPath)) {
      return res.status(404).json({ success: false, error: 'Berkas batas wilayah GeoJSON tidak ditemukan.' });
    }

    const raw = fs.readFileSync(geojsonPath, 'utf8');
    const geojson = JSON.parse(raw);

    // Enrich features with live UMKM counts from DB
    const counts = await query.all(`
      SELECT LOWER(kecamatan) as kec, COUNT(id_umkm) as total,
             SUM(CASE WHEN id_kategori = 1 THEN 1 ELSE 0 END) as laut,
             SUM(CASE WHEN id_kategori = 2 THEN 1 ELSE 0 END) as garam
      FROM umkm
      WHERE status = 'Aktif'
      GROUP BY LOWER(kecamatan)
    `);

    const countMap = {};
    counts.forEach(c => {
      countMap[c.kec] = { total: c.total, laut: c.laut, garam: c.garam };
    });

    geojson.features = geojson.features.map(f => {
      const k = (f.properties.kecamatan || '').toLowerCase();
      const stats = countMap[k] || { total: 0, laut: 0, garam: 0 };
      return {
        ...f,
        properties: {
          ...f.properties,
          total_umkm_aktif: stats.total,
          total_olahan_laut: stats.laut,
          total_garam: stats.garam
        }
      };
    });

    res.setHeader('Content-Type', 'application/geo+json');
    res.json(geojson);
  } catch (err) {
    console.error('GET /api/wilayah/geojson error:', err);
    res.status(500).json({ success: false, error: 'Gagal memuat batas GeoJSON wilayah.' });
  }
});

/**
 * GET /api/wilayah/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const item = await query.get('SELECT * FROM wilayah WHERE id_wilayah = ?', [id]);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Wilayah tidak ditemukan.' });
    }
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal mengambil detail wilayah.' });
  }
});

/**
 * POST /api/wilayah (Admin only)
 */
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { nama_wilayah, kecamatan, kabupaten, provinsi, tipe_pesisir, deskripsi, center_lat, center_lng, zoom, potensi_utama } = req.body;
    if (!nama_wilayah || !kecamatan) {
      return res.status(400).json({ success: false, error: 'Nama wilayah dan kecamatan wajib diisi.' });
    }

    const result = await query.run(
      `INSERT INTO wilayah (nama_wilayah, kecamatan, kabupaten, provinsi, tipe_pesisir, deskripsi, center_lat, center_lng, zoom, potensi_utama)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nama_wilayah.trim(),
        kecamatan.trim(),
        kabupaten || 'Pamekasan',
        provinsi || 'Jawa Timur',
        tipe_pesisir || '',
        deskripsi || '',
        center_lat ? parseFloat(center_lat) : null,
        center_lng ? parseFloat(center_lng) : null,
        zoom ? parseInt(zoom) : 13,
        potensi_utama || ''
      ]
    );

    const created = await query.get('SELECT * FROM wilayah WHERE id_wilayah = ?', [result.lastID]);
    res.status(201).json({ success: true, message: 'Wilayah berhasil ditambahkan.', data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal menambahkan wilayah baru.' });
  }
});

/**
 * PUT /api/wilayah/:id (Admin only)
 */
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await query.get('SELECT * FROM wilayah WHERE id_wilayah = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Wilayah tidak ditemukan.' });
    }

    const { nama_wilayah, kecamatan, kabupaten, provinsi, tipe_pesisir, deskripsi, center_lat, center_lng, zoom, potensi_utama } = req.body;

    await query.run(
      `UPDATE wilayah SET
        nama_wilayah = ?,
        kecamatan = ?,
        kabupaten = ?,
        provinsi = ?,
        tipe_pesisir = ?,
        deskripsi = ?,
        center_lat = ?,
        center_lng = ?,
        zoom = ?,
        potensi_utama = ?
       WHERE id_wilayah = ?`,
      [
        nama_wilayah || existing.nama_wilayah,
        kecamatan || existing.kecamatan,
        kabupaten || existing.kabupaten,
        provinsi || existing.provinsi,
        tipe_pesisir !== undefined ? tipe_pesisir : existing.tipe_pesisir,
        deskripsi !== undefined ? deskripsi : existing.deskripsi,
        center_lat !== undefined ? parseFloat(center_lat) : existing.center_lat,
        center_lng !== undefined ? parseFloat(center_lng) : existing.center_lng,
        zoom !== undefined ? parseInt(zoom) : existing.zoom,
        potensi_utama !== undefined ? potensi_utama : existing.potensi_utama,
        id
      ]
    );

    const updated = await query.get('SELECT * FROM wilayah WHERE id_wilayah = ?', [id]);
    res.json({ success: true, message: 'Wilayah berhasil diperbarui.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal memperbarui wilayah.' });
  }
});

module.exports = router;
