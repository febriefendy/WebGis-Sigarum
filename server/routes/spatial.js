const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { calculateHaversineDistance, validateCoordinates, toUmkmGeoJSON, validateGeoJSONImport } = require('../services/spatialUtils');

/**
 * GET /api/spatial/nearby
 * Find UMKM points within a specified radius from user or centroid
 */
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 10, kategori } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, error: 'Parameter latitude (lat) dan longitude (lng) wajib disertakan.' });
    }

    const cLat = parseFloat(lat);
    const cLng = parseFloat(lng);
    const maxR = parseFloat(radius);

    const coordVal = validateCoordinates(cLat, cLng);
    if (!coordVal.valid) {
      return res.status(400).json({ success: false, error: coordVal.error });
    }

    let katClause = '';
    const params = [];
    if (kategori && kategori !== 'Semua') {
      katClause = 'AND LOWER(k.nama_kategori) = LOWER(?)';
      params.push(kategori.trim());
    }

    const rows = await query.all(`
      SELECT u.*, k.nama_kategori, k.warna as warna_kategori
      FROM umkm u
      JOIN kategori k ON u.id_kategori = k.id_kategori
      WHERE u.status = 'Aktif' ${katClause}
    `, params);

    const nearby = rows
      .map(u => ({
        ...u,
        distance_km: calculateHaversineDistance(cLat, cLng, u.latitude, u.longitude)
      }))
      .filter(u => u.distance_km <= maxR)
      .sort((a, b) => a.distance_km - b.distance_km);

    res.json({
      success: true,
      origin: { lat: cLat, lng: cLng },
      radius_km: maxR,
      count: nearby.length,
      data: nearby
    });
  } catch (err) {
    console.error('GET /api/spatial/nearby error:', err);
    res.status(500).json({ success: false, error: 'Gagal melakukan analisis spasial jarak terdekat.' });
  }
});

/**
 * POST /api/spatial/import/geojson
 * Import or sync GeoJSON FeatureCollection into database with validation (Admin only)
 */
router.post('/import/geojson', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const geojson = req.body;
    const validation = validateGeoJSONImport(geojson);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Berkas GeoJSON tidak memenuhi standar validasi spasial.',
        details: validation.errors
      });
    }

    let insertedCount = 0;
    let updatedCount = 0;

    for (const feat of geojson.features) {
      const p = feat.properties || {};
      const [lng, lat] = feat.geometry.coordinates;

      const nama = p.nama_umkm || 'UMKM Impor';
      const pemilik = p.pemilik || 'Pengelola UMKM';
      const kecamatan = p.kecamatan || 'Pademawu';
      const desa = p.desa || 'Pesisir';
      const kategoriName = p.kategori || 'Olahan Laut';
      const idKategori = kategoriName.toLowerCase().includes('garam') ? 2 : 1;

      // Check if existing by name
      const existing = await query.get('SELECT id_umkm FROM umkm WHERE LOWER(nama_umkm) = LOWER(?)', [nama.trim()]);

      if (existing) {
        await query.run(
          `UPDATE umkm SET
            pemilik = ?, id_kategori = ?, kecamatan = ?, desa = ?,
            latitude = ?, longitude = ?, status = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id_umkm = ?`,
          [pemilik, idKategori, kecamatan, desa, lat, lng, p.status || 'Aktif', existing.id_umkm]
        );
        updatedCount++;
      } else {
        await query.run(
          `INSERT INTO umkm (
            nama_umkm, pemilik, id_kategori, alamat, desa, kecamatan, kontak,
            latitude, longitude, status, foto
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            nama.trim(),
            pemilik,
            idKategori,
            p.alamat || `Desa ${desa}, Kec. ${kecamatan}`,
            desa,
            kecamatan,
            p.kontak || '+62 812-0000-0000',
            lat,
            lng,
            p.status || 'Aktif',
            p.foto || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80'
          ]
        );
        insertedCount++;
      }
    }

    res.json({
      success: true,
      message: `Impor spasial GeoJSON berhasil diproses. ${insertedCount} data baru ditambahkan, ${updatedCount} data diperbarui.`,
      stats: {
        total_features: geojson.features.length,
        inserted: insertedCount,
        updated: updatedCount
      }
    });
  } catch (err) {
    console.error('POST /api/spatial/import/geojson error:', err);
    res.status(500).json({ success: false, error: 'Gagal mengimpor berkas spasial GeoJSON.' });
  }
});

/**
 * GET /api/spatial/summary
 * Spatial coverage metrics (BBox, Centroid, Coordinates dispersion)
 */
router.get('/summary', async (req, res) => {
  try {
    const stats = await query.get(`
      SELECT 
        COUNT(*) as total_points,
        MIN(latitude) as min_lat,
        MAX(latitude) as max_lat,
        MIN(longitude) as min_lng,
        MAX(longitude) as max_lng,
        AVG(latitude) as center_lat,
        AVG(longitude) as center_lng
      FROM umkm
      WHERE status = 'Aktif'
    `);

    res.json({
      success: true,
      data: {
        total_features: stats.total_points,
        bbox: [stats.min_lng, stats.min_lat, stats.max_lng, stats.max_lat],
        centroid: [stats.center_lat, stats.center_lng],
        crs: "EPSG:4326 (WGS 84)"
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal mengambil ringkasan cakupan spasial.' });
  }
});

module.exports = router;
