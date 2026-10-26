const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, optionalAuth, requireRole } = require('../middleware/auth');
const { validateCoordinates, calculateHaversineDistance, toUmkmGeoJSON } = require('../services/spatialUtils');

/**
 * GET /api/umkm
 * Query UMKM with multi-criteria filters, spatial radius, search, and pagination
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      keyword,
      kecamatan,
      kategori,
      status,
      lat,
      lng,
      radius,
      bbox,
      page,
      limit
    } = req.query;

    const conditions = [];
    const params = [];

    // BR-08: Non-admin users only see 'Aktif' UMKM by default
    const isAdmin = req.user && req.user.role === 'admin';
    if (status && status !== 'Semua') {
      if (isAdmin || status === 'Aktif') {
        conditions.push('u.status = ?');
        params.push(status);
      } else {
        conditions.push('u.status = ?');
        params.push('Aktif');
      }
    } else if (!isAdmin) {
      conditions.push("u.status = 'Aktif'");
    }

    // Kecamatan filter
    if (kecamatan && kecamatan !== 'Semua') {
      conditions.push('LOWER(u.kecamatan) = LOWER(?)');
      params.push(kecamatan.trim());
    }

    // Kategori filter (name or slug or id)
    if (kategori && kategori !== 'Semua') {
      if (!isNaN(kategori)) {
        conditions.push('u.id_kategori = ?');
        params.push(Number(kategori));
      } else {
        conditions.push('(LOWER(k.nama_kategori) = LOWER(?) OR LOWER(k.slug) = LOWER(?))');
        params.push(kategori.trim(), kategori.trim());
      }
    }

    // Keyword search across name, owner, village, subdistrict, address, products
    if (keyword && keyword.trim()) {
      const q = `%${keyword.trim().toLowerCase()}%`;
      conditions.push(`(
        LOWER(u.nama_umkm) LIKE ? OR
        LOWER(u.pemilik) LIKE ? OR
        LOWER(u.desa) LIKE ? OR
        LOWER(u.kecamatan) LIKE ? OR
        LOWER(u.alamat) LIKE ? OR
        LOWER(u.produk_unggulan) LIKE ?
      )`);
      params.push(q, q, q, q, q, q);
    }

    // Bounding Box filter: minLng,minLat,maxLng,maxLat
    if (bbox) {
      const parts = bbox.split(',').map(Number);
      if (parts.length === 4 && parts.every(n => !isNaN(n))) {
        const [minLng, minLat, maxLng, maxLat] = parts;
        conditions.push('u.longitude >= ? AND u.longitude <= ? AND u.latitude >= ? AND u.latitude <= ?');
        params.push(minLng, maxLng, minLat, maxLat);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        u.id_umkm, u.id_user, u.id_kategori, u.id_wilayah,
        u.nama_umkm, u.pemilik, u.alamat, u.desa, u.kecamatan, u.kabupaten, u.provinsi,
        u.deskripsi, u.kontak, u.latitude, u.longitude, u.foto, u.status,
        u.tahun_berdiri, u.legalitas, u.jumlah_karyawan, u.produk_unggulan, u.created_at,
        k.nama_kategori, k.warna as warna_kategori, k.icon as icon_kategori,
        COUNT(p.id_produk) as total_produk
      FROM umkm u
      LEFT JOIN kategori k ON u.id_kategori = k.id_kategori
      LEFT JOIN produk p ON u.id_umkm = p.id_umkm
      ${whereClause}
      GROUP BY u.id_umkm
      ORDER BY u.id_umkm ASC
    `;

    let rows = await query.all(sql, params);

    // Format fields
    rows = rows.map(r => ({
      ...r,
      kategori: r.nama_kategori,
      produk_unggulan: typeof r.produk_unggulan === 'string' ? JSON.parse(r.produk_unggulan || '[]') : (r.produk_unggulan || [])
    }));

    // If spatial radius search is specified: calculate Haversine distance
    if (lat && lng && radius) {
      const cLat = Number(lat);
      const cLng = Number(lng);
      const maxR = Number(radius);

      if (!isNaN(cLat) && !isNaN(cLng) && !isNaN(maxR)) {
        rows = rows
          .map(r => ({
            ...r,
            distance_km: calculateHaversineDistance(cLat, cLng, r.latitude, r.longitude)
          }))
          .filter(r => r.distance_km <= maxR)
          .sort((a, b) => a.distance_km - b.distance_km);
      }
    }

    // Pagination if requested
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
    console.error('GET /api/umkm error:', err);
    res.status(500).json({ success: false, error: 'Gagal mengambil data UMKM dari server.' });
  }
});

/**
 * GET /api/umkm/export/geojson
 * Export UMKM features in RFC 7946 GeoJSON FeatureCollection
 */
router.get('/export/geojson', optionalAuth, async (req, res) => {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    const statusFilter = isAdmin ? '' : "WHERE u.status = 'Aktif'";

    const rows = await query.all(`
      SELECT u.*, k.nama_kategori, COUNT(p.id_produk) as total_produk
      FROM umkm u
      LEFT JOIN kategori k ON u.id_kategori = k.id_kategori
      LEFT JOIN produk p ON u.id_umkm = p.id_umkm
      ${statusFilter}
      GROUP BY u.id_umkm
      ORDER BY u.id_umkm ASC
    `);

    const geojson = toUmkmGeoJSON(rows);
    res.setHeader('Content-Type', 'application/geo+json');
    res.setHeader('Content-Disposition', 'attachment; filename="sigarum_umkm_pamekasan.geojson"');
    res.json(geojson);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal mengekspor berkas GeoJSON.' });
  }
});

/**
 * GET /api/umkm/:id
 * Retrieve single UMKM by ID with associated products
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID UMKM tidak valid.' });
    }

    const umkm = await query.get(
      `SELECT u.*, k.nama_kategori, k.warna as warna_kategori, k.icon as icon_kategori
       FROM umkm u
       LEFT JOIN kategori k ON u.id_kategori = k.id_kategori
       WHERE u.id_umkm = ?`,
      [id]
    );

    if (!umkm) {
      return res.status(404).json({ success: false, error: 'Data UMKM tidak ditemukan.' });
    }

    // BR-08: If nonaktif and user is not admin or owner, restrict
    const isAdmin = req.user && req.user.role === 'admin';
    const isOwner = req.user && req.user.id_umkm === id;
    if (umkm.status === 'Nonaktif' && !isAdmin && !isOwner) {
      return res.status(404).json({ success: false, error: 'Unit usaha ini sedang tidak aktif.' });
    }

    // Fetch products belonging to this UMKM
    const products = await query.all(
      `SELECT id_produk, nama_produk, kategori, harga, berat, deskripsi, foto, stok_status
       FROM produk WHERE id_umkm = ? ORDER BY id_produk ASC`,
      [id]
    );

    umkm.kategori = umkm.nama_kategori;
    umkm.produk_unggulan = typeof umkm.produk_unggulan === 'string' ? JSON.parse(umkm.produk_unggulan || '[]') : (umkm.produk_unggulan || []);
    umkm.produk_list = products;

    res.json({ success: true, data: umkm });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal mengambil detail UMKM.' });
  }
});

/**
 * POST /api/umkm
 * Create a new UMKM record (Admin or registered UMKM actor)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      nama_umkm,
      pemilik,
      id_kategori,
      alamat,
      desa,
      kecamatan,
      kabupaten,
      provinsi,
      kontak,
      latitude,
      longitude,
      foto,
      status,
      deskripsi,
      tahun_berdiri,
      legalitas,
      jumlah_karyawan,
      produk_unggulan
    } = req.body;

    // BR-01: Nama UMKM wajib
    if (!nama_umkm || !nama_umkm.trim()) {
      return res.status(400).json({ success: false, error: 'Nama UMKM wajib diisi (Aturan Bisnis BR-01).' });
    }

    // BR-02: Nama Pemilik wajib
    if (!pemilik || !pemilik.trim()) {
      return res.status(400).json({ success: false, error: 'Nama pemilik UMKM wajib diisi (Aturan Bisnis BR-02).' });
    }

    // BR-03: Kategori wajib
    if (!id_kategori) {
      return res.status(400).json({ success: false, error: 'Kategori UMKM wajib dipilih (Aturan Bisnis BR-03).' });
    }

    // BR-04 & BR-12: Validasi Latitude dan Longitude
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const coordVal = validateCoordinates(lat, lng);
    if (!coordVal.valid) {
      return res.status(400).json({ success: false, error: coordVal.error + ' (Aturan Bisnis BR-04 & BR-12).' });
    }

    // BR-07: Status
    const umkmStatus = status === 'Nonaktif' ? 'Nonaktif' : 'Aktif';

    // Link user if caller is UMKM role
    const id_user = req.user.role === 'umkm' ? req.user.id_user : (req.body.id_user || null);

    const result = await query.run(
      `INSERT INTO umkm (
        id_user, id_kategori, nama_umkm, pemilik, alamat, desa, kecamatan, kabupaten, provinsi,
        kontak, latitude, longitude, foto, status, deskripsi, tahun_berdiri, legalitas, jumlah_karyawan, produk_unggulan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_user,
        id_kategori,
        nama_umkm.trim(),
        pemilik.trim(),
        alamat || '',
        desa || '',
        kecamatan || '',
        kabupaten || 'Pamekasan',
        provinsi || 'Jawa Timur',
        kontak || '',
        lat,
        lng,
        foto || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
        umkmStatus,
        deskripsi || '',
        tahun_berdiri ? parseInt(tahun_berdiri) : null,
        legalitas || null,
        jumlah_karyawan ? parseInt(jumlah_karyawan) : 5,
        JSON.stringify(produk_unggulan || [])
      ]
    );

    const newId = result.lastID;
    const created = await query.get('SELECT * FROM umkm WHERE id_umkm = ?', [newId]);

    res.status(201).json({
      success: true,
      message: 'Data UMKM baru berhasil disimpan.',
      data: created
    });
  } catch (err) {
    console.error('POST /api/umkm error:', err);
    res.status(500).json({ success: false, error: 'Gagal menyimpan data UMKM ke basis data.' });
  }
});

/**
 * PUT /api/umkm/:id
 * Update existing UMKM record (Admin or owner check BR-10)
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await query.get('SELECT * FROM umkm WHERE id_umkm = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Data UMKM tidak ditemukan.' });
    }

    // BR-10: Pelaku UMKM hanya dapat mengelola data usahanya sendiri
    if (req.user.role === 'umkm') {
      const userUmkmId = req.user.id_umkm || 1;
      if (id !== userUmkmId && existing.id_user !== req.user.id_user) {
        return res.status(403).json({
          success: false,
          error: 'Akses ditolak. Anda hanya diizinkan memperbarui data unit usaha Anda sendiri (Aturan Bisnis BR-10).'
        });
      }
    }

    const {
      nama_umkm,
      pemilik,
      id_kategori,
      alamat,
      desa,
      kecamatan,
      kabupaten,
      provinsi,
      kontak,
      latitude,
      longitude,
      foto,
      status,
      deskripsi,
      tahun_berdiri,
      legalitas,
      jumlah_karyawan,
      produk_unggulan
    } = req.body;

    const lat = latitude !== undefined ? parseFloat(latitude) : existing.latitude;
    const lng = longitude !== undefined ? parseFloat(longitude) : existing.longitude;

    const coordVal = validateCoordinates(lat, lng);
    if (!coordVal.valid) {
      return res.status(400).json({ success: false, error: coordVal.error });
    }

    await query.run(
      `UPDATE umkm SET
        nama_umkm = ?,
        pemilik = ?,
        id_kategori = ?,
        alamat = ?,
        desa = ?,
        kecamatan = ?,
        kabupaten = ?,
        provinsi = ?,
        kontak = ?,
        latitude = ?,
        longitude = ?,
        foto = ?,
        status = ?,
        deskripsi = ?,
        tahun_berdiri = ?,
        legalitas = ?,
        jumlah_karyawan = ?,
        produk_unggulan = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id_umkm = ?`,
      [
        nama_umkm ? nama_umkm.trim() : existing.nama_umkm,
        pemilik ? pemilik.trim() : existing.pemilik,
        id_kategori || existing.id_kategori,
        alamat !== undefined ? alamat : existing.alamat,
        desa !== undefined ? desa : existing.desa,
        kecamatan !== undefined ? kecamatan : existing.kecamatan,
        kabupaten !== undefined ? kabupaten : existing.kabupaten,
        provinsi !== undefined ? provinsi : existing.provinsi,
        kontak !== undefined ? kontak : existing.kontak,
        lat,
        lng,
        foto !== undefined ? foto : existing.foto,
        status !== undefined ? status : existing.status,
        deskripsi !== undefined ? deskripsi : existing.deskripsi,
        tahun_berdiri !== undefined ? parseInt(tahun_berdiri) : existing.tahun_berdiri,
        legalitas !== undefined ? legalitas : existing.legalitas,
        jumlah_karyawan !== undefined ? parseInt(jumlah_karyawan) : existing.jumlah_karyawan,
        produk_unggulan !== undefined ? JSON.stringify(produk_unggulan) : existing.produk_unggulan,
        id
      ]
    );

    const updated = await query.get('SELECT * FROM umkm WHERE id_umkm = ?', [id]);
    res.json({
      success: true,
      message: 'Data UMKM berhasil diperbarui.',
      data: updated
    });
  } catch (err) {
    console.error('PUT /api/umkm error:', err);
    res.status(500).json({ success: false, error: 'Gagal memperbarui data UMKM.' });
  }
});

/**
 * DELETE /api/umkm/:id
 * Delete UMKM record (Admin only BR-09, with cascade delete products BR-14)
 */
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await query.get('SELECT id_umkm, nama_umkm FROM umkm WHERE id_umkm = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Data UMKM tidak ditemukan.' });
    }

    // Cascade delete associated products (BR-14)
    await query.run('DELETE FROM produk WHERE id_umkm = ?', [id]);
    await query.run('DELETE FROM umkm WHERE id_umkm = ?', [id]);

    res.json({
      success: true,
      message: `Data UMKM "${existing.nama_umkm}" beserta seluruh produk terkait berhasil dihapus (Aturan Bisnis BR-14).`
    });
  } catch (err) {
    console.error('DELETE /api/umkm error:', err);
    res.status(500).json({ success: false, error: 'Gagal menghapus data UMKM.' });
  }
});

module.exports = router;
