const request = require('supertest');
const { app } = require('../server/server');
const { initDatabase, query } = require('../server/config/db');

let adminToken = '';
let umkmToken = '';
let createdUmkmId = null;
let createdProdukId = null;

beforeAll(async () => {
  await initDatabase();

  // Login as admin
  const resAdmin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' });
  adminToken = resAdmin.body.token;

  // Login as umkm
  const resUmkm = await request(app)
    .post('/api/auth/login')
    .send({ username: 'umkm_demo', password: 'password123' });
  umkmToken = resUmkm.body.token;
});

describe('1. SISTEM DAN KESEHATAN API', () => {
  test('GET /api/health mengembalikan status online dan informasi engine', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('online');
    expect(res.body.srid).toBe(4326);
  });
});

describe('2. AUTENTIKASI DAN HAK AKSES (BR-09, BR-10, BR-11, BR-15)', () => {
  test('Login dengan kredensial salah menghasilkan status 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Login admin berhasil dan menghasilkan token JWT', async () => {
    expect(adminToken).toBeTruthy();
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('admin');
  });

  test('Pengguna UMKM hanya mendapatkan role umkm', async () => {
    expect(umkmToken).toBeTruthy();
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${umkmToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('umkm');
  });

  test('Pengguna Pelanggan berhasil login dan mendapatkan role pelanggan', async () => {
    const resLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'pelanggan_demo', password: 'password123' });
    expect(resLogin.status).toBe(200);
    expect(resLogin.body.user.role).toBe('pelanggan');

    const resMe = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${resLogin.body.token}`);
    expect(resMe.status).toBe(200);
    expect(resMe.body.user.role).toBe('pelanggan');
  });

  test('Registrasi akun baru sebagai pelanggan berhasil', async () => {
    const uniqueUser = 'buyer_' + Date.now();
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        nama: 'Pembeli Baru Madura',
        username: uniqueUser,
        password: 'password123',
        role: 'pelanggan',
        email: `${uniqueUser}@gmail.com`
      });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('pelanggan');
  });
});

describe('3. PENGELOLAAN DATA UMKM & FILTER SPASIAL (BR-01 s/d BR-04, BR-08, BR-12)', () => {
  test('GET /api/umkm menampilkan UMKM aktif secara publik', async () => {
    const res = await request(app).get('/api/umkm');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    // Publik tidak boleh melihat status nonaktif secara default (BR-08)
    const hasInactive = res.body.data.some(u => u.status === 'Nonaktif');
    expect(hasInactive).toBe(false);
  });

  test('Filter berdasarkan kecamatan bekerja dengan benar', async () => {
    const res = await request(app).get('/api/umkm?kecamatan=Pademawu');
    expect(res.status).toBe(200);
    const allPademawu = res.body.data.every(u => u.kecamatan.toLowerCase() === 'pademawu');
    expect(allPademawu).toBe(true);
  });

  test('Pencarian kata kunci menemukan UMKM yang sesuai', async () => {
    const res = await request(app).get('/api/umkm?keyword=garam');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('Validasi BR-01 & BR-02: Pembuatan UMKM tanpa nama atau pemilik ditolak', async () => {
    const res = await request(app)
      .post('/api/umkm')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nama_umkm: '',
        pemilik: 'Budi Santoso',
        id_kategori: 1,
        latitude: -7.21,
        longitude: 113.54
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Validasi BR-04 & BR-12: Koordinat di luar batas valid ditolak', async () => {
    const res = await request(app)
      .post('/api/umkm')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nama_umkm: 'UMKM Koordinat Invalid',
        pemilik: 'Penanggung Jawab',
        id_kategori: 1,
        latitude: 95.5, // Invalid: > 90
        longitude: 113.54
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/rentang/i);
  });

  test('Admin berhasil membuat UMKM baru dengan data valid', async () => {
    const res = await request(app)
      .post('/api/umkm')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nama_umkm: 'Sentra Garam Uji Coba Pamekasan',
        pemilik: 'H. Moh. Fauzan',
        id_kategori: 2,
        alamat: 'Jl. Pesisir Tambak Uji No. 99',
        desa: 'Bunder',
        kecamatan: 'Pademawu',
        kontak: '+62 812-9999-8888',
        latitude: -7.2155,
        longitude: 113.5422,
        status: 'Aktif',
        deskripsi: 'Unit pengujian integrasi REST API'
      });
    expect(res.status).toBe(201);
    expect(res.body.data.id_umkm).toBeTruthy();
    createdUmkmId = res.body.data.id_umkm;
  });

  test('Detail UMKM dapat diakses melalui GET /api/umkm/:id', async () => {
    const res = await request(app).get(`/api/umkm/${createdUmkmId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.nama_umkm).toBe('Sentra Garam Uji Coba Pamekasan');
  });

  test('Export GeoJSON menghasilkan FeatureCollection yang valid', async () => {
    const res = await request(app).get('/api/umkm/export/geojson');
    expect(res.status).toBe(200);
    expect(res.body.type).toBe('FeatureCollection');
    expect(Array.isArray(res.body.features)).toBe(true);
  });
});

describe('4. PENGELOLAAN DATA PRODUK (BR-05, BR-06, BR-13, BR-14)', () => {
  test('Validasi BR-13: Pembuatan produk dengan harga negatif ditolak', async () => {
    const res = await request(app)
      .post('/api/produk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id_umkm: createdUmkmId,
        nama_produk: 'Produk Harga Negatif',
        kategori: 'Garam',
        harga: -15000
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/negatif/i);
  });

  test('Admin berhasil menambahkan produk baru untuk UMKM', async () => {
    const res = await request(app)
      .post('/api/produk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id_umkm: createdUmkmId,
        nama_produk: 'Garam Kristal Putih Premium 1kg',
        kategori: 'Garam',
        harga: 12500,
        berat: '1 kg',
        deskripsi: 'Garam kristalisasi geomembran berkualitas'
      });
    expect(res.status).toBe(201);
    expect(res.body.data.id_produk).toBeTruthy();
    createdProdukId = res.body.data.id_produk;
  });

  test('Validasi BR-14: Penghapusan UMKM menghapus produk terkait secara cascade', async () => {
    // 1. Delete UMKM
    const delRes = await request(app)
      .delete(`/api/umkm/${createdUmkmId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(delRes.status).toBe(200);

    // 2. Verify product is also deleted
    const prodRes = await request(app).get(`/api/produk/${createdProdukId}`);
    expect(prodRes.status).toBe(404);
  });
});

describe('5. KATEGORI, WILAYAH, DAN STATISTIK', () => {
  test('GET /api/kategori menampilkan daftar kategori usaha', async () => {
    const res = await request(app).get('/api/kategori');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  test('GET /api/wilayah/geojson menyediakan layer batas poligon kecamatan', async () => {
    const res = await request(app).get('/api/wilayah/geojson');
    expect(res.status).toBe(200);
    expect(res.body.type).toBe('FeatureCollection');
    expect(res.body.features.length).toBeGreaterThanOrEqual(5);
  });

  test('GET /api/stats menghitung agregasi data aktual dari database', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(200);
    expect(res.body.data.totalUMKM).toBeGreaterThan(0);
    expect(res.body.data.totalProduk).toBeGreaterThan(0);
    expect(Array.isArray(res.body.data.byKecamatan)).toBe(true);
  });
});

describe('6. ANALISIS SPASIAL JARAK & IMPOR GEOJSON', () => {
  test('GET /api/spatial/nearby menemukan UMKM dalam radius tertentu', async () => {
    // Coordinate near Pademawu: lat -7.2185, lng 113.5420
    const res = await request(app)
      .get('/api/spatial/nearby?lat=-7.2185&lng=113.5420&radius=5');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    // Nearest should be within 5 km
    expect(res.body.data[0].distance_km).toBeLessThanOrEqual(5);
  });

  test('Validasi format impor GeoJSON menolak JSON non-FeatureCollection', async () => {
    const res = await request(app)
      .post('/api/spatial/import/geojson')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'InvalidType' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
