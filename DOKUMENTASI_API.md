# DOKUMENTASI LENGKAP SPESIFIKASI REST API — SIGARUM WEBGIS
## Sistem Informasi Geografis UMKM Olahan Laut dan Garam (Kabupaten Pamekasan)
**Versi API:** `2.0.0` | **Protokol:** HTTP/HTTPS | **Format:** JSON & GeoJSON (RFC 7946) | **SRID:** 4326 (WGS 84)

---

## 1. IKHTISAR TEKNIS & STANDAR API

REST API SIGARUM dibangun menggunakan arsitektur Express.js modern yang terhubung dengan layer database relasional spasial (SQLite3 untuk kemudahan demo lokal tanpa konfigurasi dan PostgreSQL 14+ / PostGIS 3.0+ untuk deployment produksi).

### Base URL:
- **Pengembangan Lokal:** `http://localhost:5000/api`
- **Produksi:** `https://sigarum.pamekasankab.go.id/api`

### Header Standar:
| Header | Nilai | Keterangan |
|---|---|---|
| `Content-Type` | `application/json` | Format request dan response data |
| `Authorization` | `Bearer <JWT_TOKEN>` | Wajib untuk endpoint yang dilindungi (Admin / Pelaku UMKM) |

### Format Respons Standar:
```json
{
  "success": true,
  "message": "Deskripsi status operasi (opsional)",
  "count": 18,
  "data": [ ... ]
}
```
Jika terjadi kegagalan atau validasi ditolak:
```json
{
  "success": false,
  "error": "Pesan kesalahan deskriptif dan ramah pengguna.",
  "details": [ ... ]
}
```

---

## 2. KELOMPOK ENDPOINT API

### A. Autentikasi & Akun (`/api/auth`)

#### 1. Login Pengelola & Pelaku UMKM
- **Endpoint:** `POST /api/auth/login`
- **Akses:** Publik
- **Deskripsi:** Memvalidasi kredensial pengguna menggunakan perbandingan hash password satu arah `bcryptjs` (BR-15).
- **Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```
- **Response 200 OK:**
```json
{
  "success": true,
  "message": "Login berhasil.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id_user": 1,
    "nama": "Administrator SIGARUM",
    "username": "admin",
    "role": "admin",
    "email": "admin@sigarum.id",
    "id_umkm": null
  }
}
```

#### 2. Registrasi Pelaku UMKM Baru
- **Endpoint:** `POST /api/auth/register`
- **Akses:** Publik (default role: `umkm`)
- **Request Body:**
```json
{
  "nama": "Hj. Siti Aminah",
  "username": "siti_aminah",
  "password": "password123",
  "email": "aminah@gmail.com",
  "nomor_telepon": "+62 821-4098-1234"
}
```

#### 3. Cek Profil Pengguna Aktif (Session Me)
- **Endpoint:** `GET /api/auth/me`
- **Akses:** Terautentikasi (`Bearer Token`)
- **Response 200 OK:** Mengembalikan data pengguna login beserta hak akses role dan unit usaha binaan (BR-10).

#### 4. Manajemen Pengguna (Admin)
- **Endpoint:** `GET /api/auth/users`
- **Akses:** Administrator saja (`BR-09`)
- **Response 200 OK:** Daftar seluruh pengguna terdaftar, peran, surel, dan UMKM yang diasosiasikan.

---

### B. Pengelolaan UMKM & Data Geospasial (`/api/umkm`)

#### 1. Dapatkan Daftar UMKM (Multi-Kriteria & Radius)
- **Endpoint:** `GET /api/umkm`
- **Akses:** Publik & Terautentikasi
- **Parameter Query (Opsional):**
  - `keyword` *(string)*: Pencarian teks pada nama usaha, pemilik, desa, kecamatan, alamat, komoditas produk.
  - `kecamatan` *(string)*: Filter kecamatan (Pademawu, Tlanakan, Galis, Larangan, Pasean, Batumarmar).
  - `kategori` *(string / int)*: Filter kategori (`Olahan Laut`, `Garam`, atau ID).
  - `status` *(string)*: `Aktif` / `Nonaktif` / `Semua`. *Catatan: Pengguna publik tanpa hak admin hanya akan menerima data `Aktif` (BR-08).*
  - `lat` *(number)* & `lng` *(number)* & `radius` *(number)*: Filter spasial buffer radius dalam kilometer (Haversine formula). Mengembalikan atribut tambahan `distance_km` terurut dari terdekat.
  - `bbox` *(string)*: Bounding box spasial format `minLng,minLat,maxLng,maxLat`.
  - `page` *(int)* & `limit` *(int)*: Penomoran halaman (Pagination).

#### 2. Dapatkan Detail Satu UMKM
- **Endpoint:** `GET /api/umkm/:id`
- **Akses:** Publik (jika aktif) / Admin & Pemilik
- **Response 200 OK:** Profil lengkap UMKM beserta daftar produk (`produk_list`), kategori, koordinat lintang/bujur, dan kontak WhatsApp.

#### 3. Tambah UMKM Baru
- **Endpoint:** `POST /api/umkm`
- **Akses:** Administrator / Pelaku UMKM terautentikasi
- **Aturan Bisnis Divalidasi:**
  - `BR-01`: Nama UMKM wajib diisi.
  - `BR-02`: Nama Pemilik wajib diisi.
  - `BR-03`: Kategori usaha wajib dipilih.
  - `BR-04` & `BR-12`: Latitude (-90 s/d 90) dan Longitude (-180 s/d 180) wajib berupa angka valid.
  - `BR-07`: Status wajib `Aktif` atau `Nonaktif`.
- **Request Body:**
```json
{
  "nama_umkm": "Tambak Garam Kristal Galis Super",
  "pemilik": "H. Moh. Fadli",
  "id_kategori": 2,
  "alamat": "Jl. Sentra Tambak Garam No. 22",
  "desa": "Ponteh",
  "kecamatan": "Galis",
  "kontak": "+62 813-5789-2234",
  "latitude": -7.1980,
  "longitude": 113.5760,
  "status": "Aktif",
  "deskripsi": "Sentra garam meja halus dapur SNI dan garam krosok.",
  "produk_unggulan": ["Garam Meja Halus 500g", "Garam Krosok 50kg"]
}
```

#### 4. Perbarui Data UMKM
- **Endpoint:** `PUT /api/umkm/:id`
- **Akses:** Administrator atau Pemilik UMKM terkait (`BR-10`).

#### 5. Hapus Data UMKM
- **Endpoint:** `DELETE /api/umkm/:id`
- **Akses:** Administrator (`BR-09`).
- **Aturan Bisnis:** Menerapkan *Cascade Delete* (BR-14) yang secara otomatis menghapus seluruh produk yang diasosiasikan dengan UMKM tersebut guna mencegah data yatim (*orphaned records*).

#### 6. Ekspor Titik UMKM ke GeoJSON
- **Endpoint:** `GET /api/umkm/export/geojson`
- **Akses:** Publik & Terautentikasi
- **Header:** `Content-Type: application/geo+json`
- **Format:** GeoJSON FeatureCollection berstandar RFC 7946 dengan proyeksi WGS 84 (CRS84).

---

### C. Katalog Produk (`/api/produk`)

#### 1. Daftar Katalog Produk
- **Endpoint:** `GET /api/produk`
- **Parameter Query:** `id_umkm`, `kategori`, `keyword`, `page`, `limit`
- **Response:** Array produk lengkap dengan informasi produsen UMKM, nomor kontak, kecamatan, dan harga Rupiah.

#### 2. Tambah Produk Baru
- **Endpoint:** `POST /api/produk`
- **Akses:** Administrator atau Pelaku UMKM terautentikasi (BR-10: Pelaku UMKM hanya dapat menambahkan produk pada unit usahanya sendiri).
- **Aturan Bisnis Divalidasi:**
  - `BR-05`: Satu UMKM dapat memiliki banyak produk.
  - `BR-06`: Setiap produk wajib memiliki UMKM pemilik yang sah.
  - `BR-13`: Harga produk wajib berupa bilangan riil positif atau nol (tidak boleh negatif).
- **Request Body:**
```json
{
  "id_umkm": 1,
  "nama_produk": "Garam Konsumsi Beryodium 250gr",
  "kategori": "Garam",
  "harga": 3500,
  "berat": "250 gram",
  "deskripsi": "Garam beryodium kemasan praktis higienis.",
  "stok_status": "Tersedia"
}
```

#### 3. Perbarui & Hapus Produk
- **Endpoint:** `PUT /api/produk/:id` dan `DELETE /api/produk/:id`
- **Otorisasi:** Dibatasi hanya untuk Administrator atau Pemilik unit usaha terkait (BR-10).

---

### D. Master Kategori & Wilayah Spasial (`/api/kategori` & `/api/wilayah`)

#### 1. Master Kategori
- `GET /api/kategori`: Menampilkan daftar kategori lengkap dengan jumlah UMKM dan produk terhubung.
- `POST /api/kategori`: Tambah kategori baru (Admin).
- `DELETE /api/kategori/:id`: Hapus kategori (Admin, dilindungi constraint relasi jika kategori masih memiliki UMKM).

#### 2. Master Wilayah & Batas Poligon GeoJSON
- `GET /api/wilayah`: Menampilkan daftar kecamatan pesisir Pamekasan beserta ringkasan UMKM aktif/nonaktif.
- `GET /api/wilayah/geojson`: Menyajikan lapisan batas poligon kecamatan dalam format GeoJSON FeatureCollection yang diperkaya dengan data statistik agregat langsung dari basis data.

---

### E. Statistik Analitik Aktual (`/api/stats`)

- **Endpoint:** `GET /api/stats`
- **Akses:** Publik
- **Deskripsi:** Menghitung KPI ekonomi dan persebaran geospasial aktual secara real-time dari basis data (tidak menggunakan data statis/hardcoded).
- **Contoh Respons Data Aktual:**
```json
{
  "success": true,
  "data": {
    "totalUMKM": 18,
    "totalAktif": 17,
    "totalNonaktif": 1,
    "totalLaut": 10,
    "totalGaram": 8,
    "totalProduk": 32,
    "totalKecamatan": 6,
    "byKecamatan": [
      { "kecamatan": "Pademawu", "total": 5, "laut": 2, "garam": 3, "aktif": 5, "nonaktif": 0 },
      { "kecamatan": "Tlanakan", "total": 4, "laut": 4, "garam": 0, "aktif": 4, "nonaktif": 0 },
      { "kecamatan": "Galis", "total": 4, "laut": 0, "garam": 4, "aktif": 3, "nonaktif": 1 },
      { "kecamatan": "Pasean", "total": 2, "laut": 2, "garam": 0, "aktif": 2, "nonaktif": 0 },
      { "kecamatan": "Larangan", "total": 2, "laut": 1, "garam": 1, "aktif": 2, "nonaktif": 0 },
      { "kecamatan": "Batumarmar", "total": 1, "laut": 1, "garam": 0, "aktif": 1, "nonaktif": 0 }
    ],
    "byKategori": [ ... ]
  }
}
```

---

### F. Analisis Spasial Lanjutan & Integrasi QGIS (`/api/spatial`)

#### 1. Analisis Radius Terdekat (Nearby Spatial Search)
- **Endpoint:** `GET /api/spatial/nearby?lat={latitude}&lng={longitude}&radius={km}`
- **Fungsi:** Mengambil titik UMKM yang berada dalam radius tertentu dari koordinat referensi pengguna menggunakan kalkulasi *Spherical Haversine*.

#### 2. Impor Geospasial GeoJSON dari QGIS Desktop
- **Endpoint:** `POST /api/spatial/import/geojson`
- **Akses:** Administrator
- **Fungsi:** Menerima berkas GeoJSON hasil digitasi QGIS, memvalidasi struktur FeatureCollection, memeriksa rentang koordinat WGS 84, menyinkronkan data atribut, dan menyimpan ke database dengan laporan detail.

#### 3. Ringkasan Cakupan Spasial
- **Endpoint:** `GET /api/spatial/summary`
- **Fungsi:** Menghitung *Bounding Box* (BBox minimum dan maksimum koordinat), titik tengah centroid sebaran, dan jumlah fitur terdaftar.

---

### G. Unggah Berkas
- `POST /api/upload`: Unggah foto produk atau profil UMKM (Format JPG, PNG, WebP; batas maksimal 5 MB).

---

### H. E-Commerce Multi-Vendor & Transaksi Pasar

#### 1. Keranjang Belanja Multi-Vendor (`/api/cart`)
- `GET /api/cart`: Mengambil seluruh item keranjang milik pembeli, dikelompokkan per toko/UMKM (`by_store`), subtotal per toko, dan verifikasi stok langsung dari database.
- `POST /api/cart`: Menambahkan produk ke keranjang. Parameter: `{ id_produk, kuantitas }` (mendukung `jumlah`).
- `PUT /api/cart/:id`: Memperbarui kuantitas produk dengan validasi stok aktual server.
- `DELETE /api/cart/:id`: Menghapus item tertentu dari keranjang pembeli.
- `DELETE /api/cart`: Mengosongkan keranjang pembeli.

#### 2. Pesanan & Checkout Multi-Vendor (`/api/orders`)
- `POST /api/orders/checkout` (atau `POST /api/orders`): Membuat master pesanan dan memecah secara otomatis menjadi `sub_orders` untuk masing-masing penjual/toko. Parameter: `{ id_alamat, metode_pembayaran, catatan, kupon_kode, store_shipping: { [id_umkm]: { kurir, ongkir } } }`. Mengunci snapshot harga produk, nama produk, dan berat pada detail item pesanan.
- `GET /api/orders`: Mengambil riwayat pesanan (difilter berdasarkan role: Pembeli melihat pesanannya, Penjual melihat sub-pesanan tokonya, Admin melihat seluruh pesanan marketplace).
- `GET /api/orders/:id`: Detail pesanan spesifik beserta sub-pesanan dan rincian item.
- `PUT /api/orders/sub-order/:id/status` (atau `/sub-orders/:id/status`): Memperbarui status sub-pesanan (`diproses`, `dikirim`) dan nomor resi pengiriman oleh Penjual/Admin.
- `POST /api/orders/sub-order/:id/confirm-received`: Konfirmasi penerimaan barang oleh Pembeli, mengubah status menjadi `selesai` dan mendistribusikan saldo penjualan ke dompet toko penjual (setelah dipotong komisi platform).

#### 3. Pembayaran & Verifikasi (`/api/payments`)
- `GET /api/payments/order/:orderId`: Mengambil rincian instruksi pembayaran (QRIS dinamis, Nomor Rekening Virtual Account / Bank, batas waktu transfer, dan total tagihan).
- `POST /api/payments/upload-receipt/:orderId` (atau `POST /api/payments/upload-receipt`): Mengunggah foto bukti transfer bank (multipart/form-data: `bukti_bayar`).
- `POST /api/payments/verify/:paymentId`: Verifikasi manual bukti pembayaran oleh Administrator (`disetujui` / `ditolak`). Otomatis memperbarui status pesanan utama menjadi `dibayar` dan sub-pesanan menjadi `diproses`.

#### 4. Ulasan & Penilaian Produk (`/api/reviews`)
- `GET /api/reviews/product/:id`: Menampilkan ulasan publik untuk produk tertentu beserta rating bintang (1-5), nama pembeli yang terverifikasi, dan balasan penjual.
- `POST /api/reviews`: Menulis ulasan dan rating produk setelah pesanan diselesaikan oleh pembeli. Otomatis memperbarui rating rata-rata toko di database.
- `POST /api/reviews/:id/reply`: Penjual membalas ulasan yang ditinggalkan pembeli pada produk tokonya.

#### 5. Analitik & Laporan Penjual (`/api/seller`)
- `GET /api/seller/metrics`: Mengambil ringkasan performa toko penjual secara real-time (total pendapatan kotor, komisi platform, pendapatan bersih, saldo tersedia, saldo tertahan, pesanan baru, produk terlaris).
- `GET /api/seller/reports?start_date=...&end_date=...`: Laporan omzet dan pesanan terjual dengan filter rentang tanggal.
- `PUT /api/seller/store`: Memperbarui profil toko (nama toko, deskripsi, alamat, kontak, logo, banner).

#### 6. Kupon & Diskon (`/api/coupons`)
- `POST /api/coupons/validate`: Memvalidasi kode kupon, memeriksa batas minimum belanja, tanggal kedaluwarsa, kuota pemakaian, dan menghitung nominal potongan harga.
- `GET /api/coupons`: Mengambil daftar kupon promo yang aktif.

#### 7. Pengaturan Platform & Audit Trail (`/api/settings`)
- `GET /api/settings`: Mengambil konfigurasi marketplace (persentase komisi, biaya layanan, kontak darurat).
- `PUT /api/settings`: Memperbarui konfigurasi marketplace (khusus Admin).
- `GET /api/settings/audit-logs`: Mengambil riwayat tindakan administratif dan operasional platform (khusus Admin).

