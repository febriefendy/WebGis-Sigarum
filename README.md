# SIGARUM WebGIS Full-Stack Application
### Sistem Informasi Geografis UMKM Olahan Laut dan Garam (Kabupaten Pamekasan)

[![WebGIS](https://img.shields.io/badge/GIS-Leaflet.js_1.9.4-0284c7.svg)](https://leafletjs.com/)
[![Backend](https://img.shields.io/badge/Backend-Express.js_REST_API-059669.svg)](https://expressjs.com/)
[![Database](https://img.shields.io/badge/Spatial_DB-SQLite3_%2B_PostgreSQL_%2F_PostGIS-336791.svg)](https://postgis.net/)
[![PWA](https://img.shields.io/badge/PWA-Service_Worker_%2B_Manifest-8b5cf6.svg)](#-fitur-pwa)
[![Tests](https://img.shields.io/badge/Automated_Tests-20_Passed-10b981.svg)](#-pengujian-otomatis-automated-testing)
[![Status](https://img.shields.io/badge/Status-Full--Stack_Ready-blue.svg)](#catatan-data-demo)

> *"Pemetaan UMKM, Potensi Lokal, dan Informasi Ekonomi Berbasis Lokasi."*

---

## 📌 Ringkasan Proyek

**SIGARUM** adalah aplikasi WebGIS full-stack terintegrasi yang dirancang khusus untuk memetakan persebaran unit UMKM di sektor pengolahan hasil laut (seperti ikan asin, kerupuk payus/terung, terasi udang rebon asli, petis cakalang madura, abon ikan) serta sentra tambak garam kristalisasi geomembran dan industri garam konsumsi rakyat di Kabupaten Pamekasan, Madura, Jawa Timur.

Sistem ini telah ditingkatkan dari prototipe murni menjadi **aplikasi geospasial full-stack** yang dilengkapi dengan server backend Express.js, REST API berkeamanan JWT dan bcrypt, basis data spasial (SQLite zero-config lokal dan PostgreSQL/PostGIS untuk produksi), filter buffer radius spasial, integrasi impor/ekspor GeoJSON QGIS, serta arsitektur PWA (*Progressive Web App*).

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi dapat dijalankan secara instan dengan Node.js (v20+):

### 1. Instal Dependensi
```bash
npm install
```

### 2. Jalankan Server WebGIS Full-Stack
```bash
npm start
```
Server akan aktif di:
- **Web Utama & Beranda:** `http://localhost:5000`
- **Peta Interaktif WebGIS:** `http://localhost:5000/peta.html`
- **Direktori UMKM:** `http://localhost:5000/umkm.html`
- **Katalog Produk:** `http://localhost:5000/produk.html`
- **Dashboard Statistik:** `http://localhost:5000/statistik.html`
- **Panel Administrasi:** `http://localhost:5000/admin/dashboard.html`
- **Cek Kesehatan API:** `http://localhost:5000/api/health`

### 3. Menjalankan via Docker (Opsi Produksi)
```bash
docker compose up -d --build
```

---

## 🧪 Pengujian Otomatis (Automated Testing)

SIGARUM dilengkapi dengan automated test suite menggunakan Jest dan Supertest yang memverifikasi 31 skenario integrasi menyeluruh REST API, pengujian multi-role RBAC, kalkulasi spasial, alur multi-vendor e-commerce, checkout, verifikasi pembayaran manual, pelacakan resi kurir, konfirmasi penerimaan, hingga ulasan produk:

```bash
npm test
```
**Hasil Pengujian:**
```text
PASS tests/ecommerce.test.js (11 tests passed)
PASS tests/api.test.js (20 tests passed)

Test Suites: 2 passed, 2 total
Tests:       31 passed, 31 total
Snapshots:   0 total
Time:        2.839 s
```

---

## 🔐 Sistem Akses & Autentikasi Multi-Role

Sistem menerapkan prinsip keamanan **Zero Hardcoded Demo Accounts** & **Server-Side RBAC Enforcement**:

1. **Pengunjung (Publik Tanpa Login):**
   - Bebas menjelajahi Beranda, Peta WebGIS Leaflet, Direktori UMKM, dan Katalog Produk.
   - Dapat mencari, memfilter produk & toko, melihat detail harga, stok, ulasan terverifikasi, dan rating bintang.
   - Tidak dapat mengakses dashboard, data transaksi internal, maupun melakukan checkout tanpa autentikasi.

2. **Pembeli (Buyer):**
   - Registrasi mandiri melalui formulir publik (`login.html`) memilih peran **Pembeli / Pelanggan**.
   - Keranjang belanja multi-vendor yang otomatis mengelompokkan barang berdasarkan toko.
   - Checkout multi-vendor terpadu dengan snapshot data produk aman (anti manipulasi harga).
   - Unggah bukti transfer bank, pelacakan nomor resi per sub-pesanan, konfirmasi penerimaan barang, dan pemberian ulasan bintang 1–5.

3. **Penjual (Seller / Pelaku UMKM):**
   - Registrasi mandiri melalui formulir publik (`login.html`) memilih peran **Penjual / Pelaku UMKM** dan mendaftarkan toko miliknya.
   - Dashboard analitik toko aktual: omzet kotor, komisi platform, laba bersih, saldo dompet, dan pesanan masuk.
   - Manajemen produk toko sendiri, input nomor resi pengiriman untuk sub-pesanan tokonya, dan membalas ulasan pembeli.
   - Proteksi IDOR: Penjual tidak dapat mengakses pesanan, produk, atau data transaksi milik toko lain.

4. **Administrator (Pengelola Marketplace):**
   - **Keamanan Setup Awal:** Akun Admin **TIDAK DAPAT** didaftarkan melalui formulir publik untuk mencegah eskalasi hak istimewa (privilege escalation).
   - Inisialisasi atau pengaturan ulang kredensial Administrator dilakukan secara aman melalui skrip CLI khusus:
     ```bash
     node scripts/create-admin.js <username> <password> <email> <nama>
     ```
     *Contoh default provisioning saat inisialisasi:*
     ```bash
     node scripts/create-admin.js admin admin123 admin@sigarum.id "Administrator SIGARUM"
     ```
   - Dashboard Admin memuat analitik makro marketplace aktual dari database: GMV total, komisi platform, moderasi toko penjual, verifikasi manual bukti bayar pembeli, dan audit log aktivitas.


---

## 📁 Struktur Berkas Proyek

```text
sigarum-webgis/
│
├── server/                     # Backend Engine (Express.js REST API)
│   ├── config/
│   │   └── db.js               # Abstraksi Database SQLite3 / PostgreSQL + PostGIS & Auto-seed
│   ├── middleware/
│   │   ├── auth.js             # JWT Authentication & Role-Based Access Control (RBAC)
│   │   └── upload.js           # Multer Upload Handler dengan validasi MIME & batas ukuran
│   ├── routes/
│   │   ├── auth.js             # Endpoint login, register, me, dan kelola pengguna
│   │   ├── umkm.js             # Endpoint CRUD UMKM, BBox, Radius, dan GeoJSON Export
│   │   ├── produk.js           # Endpoint CRUD Produk & Validasi Harga Non-Negatif
│   │   ├── kategori.js         # Endpoint Master Data Kategori
│   │   ├── wilayah.js          # Endpoint Master Wilayah & GeoJSON Batas Poligon
│   │   ├── stats.js            # Endpoint Agregasi Statistik Berbasis Database
│   │   └── spatial.js          # Endpoint Analisis Radius Spasial & Impor GeoJSON QGIS
│   ├── services/
│   │   └── spatialUtils.js     # Formula Haversine, Validasi Koordinat, Serializer GeoJSON
│   └── server.js               # Entrypoint Utama Server HTTP, Static Files, & API Routing
│
├── tests/                      # Automated Test Suite (Jest + Supertest)
│   └── api.test.js             # 20 Pengujian Menyeluruh REST API & Aturan Bisnis
│
├── database/                   # Skema Basis Data Produksi & Data Seed
│   ├── schema.sql              # DDL PostgreSQL 14+ / PostGIS 3.0+ (Point & MultiPolygon)
│   ├── seed.sql                # Data Awal SQL & Contoh Kueri Spasial ST_DWithin
│   └── sigarum.sqlite          # SQLite Database Aktif untuk Lokal Server
│
├── assets/
│   ├── css/style.css           # Styling kustom, animasi marker, dan popup Leaflet
│   ├── js/
│   │   ├── app.js              # SigarumApi client connector & hybrid local synchronizer
│   │   ├── map.js              # Leaflet engine, custom pins, radius buffer & GeoJSON
│   │   └── charts.js           # Chart.js engine visualisasi analitik statistik
│   └── images/                 # Logo SVG, icon-192.png, icon-512.png
│
├── data/                       # Data Master JSON & GeoJSON Poligon Kecamatan
│   ├── umkm.json               # 18 Entitas UMKM Pesisir Pamekasan
│   ├── produk.json             # 32 Komoditas Produk Olahan Laut & Garam
│   ├── kategori.json           # Master Kategori Usaha
│   ├── wilayah.json            # Master Wilayah Administratif
│   └── wilayah.geojson         # Batas Poligon 6 Kecamatan Pesisir Pamekasan (EPSG:4326)
│
├── manifest.json               # Web App Manifest untuk PWA (Instalasi Android/Desktop)
├── sw.js                       # Service Worker untuk Caching Aset & Offline Fallback
├── Dockerfile                  # Container Image Specification
├── docker-compose.yml          # Multi-Container Deployment dengan PostGIS
│
├── DOKUMENTASI_PERANCANGAN.md  # Dokumen Lengkap Akademik (ERD, DFD, BR-01 s/d BR-20)
├── DOKUMENTASI_API.md          # Spesifikasi Lengkap REST API Endpoint & Schemas
├── DOKUMENTASI_QGIS_POSTGIS.md # Panduan Alur Kerja QGIS Desktop, Topologi & PostGIS
├── PANDUAN_DEPLOYMENT.md       # Panduan Deployment Produksi (Nginx, PM2, HTTPS SSL)
├── AUDIT_DAN_RENCANA_UPGRADE.md# Laporan Audit Proyek dan Rencana Kerja Upgrade
└── README.md                   # Petunjuk Utama Proyek
```

---

## 🗺️ Fitur-Fitur Unggulan WebGIS

1. **Multi-Basemap Layer Control:** Pilihan citra satelit Google Hybrid, Google Roadmap, Google Terrain, Esri World Imagery, dan OpenStreetMap.
2. **Kategori Simbolisasi Spasial:** Simbol ikan biru untuk sektor Olahan Laut dan kristal emas untuk sektor Garam Rakyat.
3. **Pencarian Real-Time & Filter Spasial Berlapis:** Saring UMKM secara langsung berdasarkan nama usaha, kecamatan, kategori, jenis produk, dan radius jarak buffer (3 km, 5 km, 10 km).
4. **Analisis Jarak Geolokasi Pengguna:** Tombol *"Lokasi Saya"* untuk mendeteksi posisi lintang dan bujur pengguna dan menghitung jarak kilometer ke UMKM terdekat.
5. **Ekspor & Impor GeoJSON Terverifikasi:** Impor data spasial hasil pengolahan QGIS Desktop langsung melalui panel admin dengan validasi batas koordinat dan proyeksi CRS84/EPSG:4326.
6. **Statistik Terintegrasi Basis Data:** Seluruh angka agregat dihitung secara real-time dari database aktif (bukan angka statis fiktif).
7. **PWA Ready:** Aplikasi dapat di-install sebagai aplikasi desktop dan smartphone dengan dukungan cache offline mandiri.
8. **Penegakan 20 Aturan Bisnis (BR-01 s/d BR-20):** Validasi koordinat, harga non-negatif, cascade deletion, dan isolasi hak akses data.

---

## ⚠️ Catatan Data Demo
Seluruh entitas UMKM, nama pemilik, dan titik koordinat yang disajikan pada demonstrasi ini berstatus **Data Demo / Data Dummy (Simulasi)** untuk keperluan tugas akademik Sistem Informasi dan tidak mengklaim sebagai data resmi pemerintah Kabupaten Pamekasan.

---

&copy; 2026 SIGARUM WebGIS • Sistem Informasi Geografis UMKM Olahan Laut dan Garam.
