# LAPORAN AUDIT TEKNIS DAN RENCANA UPGRADE SISTEM SIGARUM
## Dari Prototype WebGIS Menjadi Aplikasi Geospasial Full-Stack Berstandar Produksi

---

### 1. RINGKASAN AUDIT KONDISI AKTUAL PROYEK

Berdasarkan pemeriksaan menyeluruh terhadap seluruh kode sumber, konfigurasi, berkas data, dokumentasi, dan aset yang ada di workspace, berikut adalah kondisi faktual proyek SIGARUM:

#### A. Komponen yang Sudah Selesai dan Berfungsi Baik:
1. **Desain Antarmuka & Tata Letak:**
   - Halaman publik (`index.html`, `peta.html`, `umkm.html`, `detail-umkm.html`, `produk.html`, `statistik.html`, `tentang.html`, `login.html`) telah mengimplementasikan estetika *Modern Minimalist GIS* dengan Tailwind CSS, responsif, dan konsisten dengan palet warna bahari (`#0284c7`) dan garam (`#d97706`).
   - Halaman admin (`admin/dashboard.html`, `admin/umkm.html`, `admin/produk.html`, `admin/kategori.html`, `admin/wilayah.html`, `admin/pengguna.html`) memiliki sidebar navigasi, modal CRUD, dan penyesuaian Role-Based Access Control (RBAC).
2. **Mesin Peta Leaflet:**
   - Peta Leaflet 1.9.4 terhubung dengan multi-basemap (Google Maps Hybrid, Roadmap, Terrain, Esri World Imagery, OpenStreetMap).
   - Marker kategori dengan simbol khusus (ikan untuk Olahan Laut, kristal untuk Garam) beserta popup informatif dan tautan Google Maps.
   - Lapisan batas wilayah GeoJSON 6 kecamatan pesisir (Pademawu, Tlanakan, Galis, Larangan, Pasean, Batumarmar).
3. **Spesifikasi Basis Data & Akademik:**
   - `database/schema.sql` telah mendefinisikan skema DDL PostgreSQL + PostGIS (tabel `users`, `kategori`, `wilayah`, `umkm`, `produk`, trigger sinkronisasi spasial `ST_MakePoint`, dan spatial views).
   - `database/seed.sql` menyediakan 16 data UMKM simulasi dan 28 produk komoditas pesisir Pamekasan.
   - `DOKUMENTASI_PERANCANGAN.md` memuat ERD, DFD Level 0 & Level 1, analisis kebutuhan, serta Business Rules BR-01 s/d BR-15.

#### B. Kekurangan, Masalah Arsitektur, dan Risiko Keamanan yang Ditemukan:
1. **Belum Ada Backend Server & REST API Nyata:**
   - Sebelumnya sistem berjalan murni *client-side* mengandalkan `localStorage` browser melalui `SigarumStore` di `assets/js/app.js`.
   - Tidak ada server HTTP atau service API yang melayani request antar-klien, sehingga perubahan data di satu perangkat tidak tersimpan ke server bersama.
2. **Autentikasi Belum Aman:**
   - Password disimpan dalam teks polos di `localStorage` dan diverifikasi di sisi klien (`user.password === password`).
   - Belum ada token JWT, hashing bcrypt di server, atau session otorisasi backend yang memvalidasi hak akses setiap operasi API.
3. **Validasi Server-Side Belum Ada:**
   - Validasi data (seperti koordinat bujur/lintang, harga non-negatif, cascade deletion) hanya berjalan di JavaScript browser. Jika di-bypass, integritas data terancam.
4. **PWA dan Dukungan Offline Belum Diimplementasikan:**
   - Belum terdapat `manifest.json`, icon PWA, dan Service Worker untuk caching aset dan penanganan status offline.
5. **Ketiadaan Pengujian Otomatis (Automated Testing):**
   - Belum ada automated test suite (Unit / API Test) untuk memverifikasi fungsionalitas endpoint, business rules, dan penanganan error.
6. **Alur Impor / Ekspor GeoJSON Belum Terintegrasi ke Backend:**
   - Fitur ekspor/impor file GeoJSON spasial dengan validasi koordinat dan CRS belum tersedia di UI maupun API.

---

### 2. RENCANA UPGRADE ARSITEKTUR & IMPLEMENTASI (TAHAP DEMI TAHAP)

| Tahap | Lingkup Pekerjaan | Target Luaran |
|---|---|---|
| **Tahap 1: Backend & REST API** | Membangun server Express.js modular dengan arsitektur RESTful yang aman, validasi server-side, hashing bcrypt, dan otentikasi JWT. | `server/` atau `server.js`, `routes/`, `controllers/`, `middleware/` |
| **Tahap 2: Database & Spatial Engine** | Membangun layer database relasional dengan kalkulasi spasial (Bounding Box, Radius Search, GeoJSON FeatureCollection generator) yang kompatibel dengan SQLite (zero-config lokal) dan PostgreSQL + PostGIS (produksi). | `database/db.js`, auto-migration, seed otomatis |
| **Tahap 3: Integrasi Frontend-API (Hybrid Sync)** | Memperbarui `assets/js/app.js` agar menjadi klien API asynchronous yang berkomunikasi dengan REST API saat server aktif, dengan fallback aman ke local storage saat offline. | Sinkronisasi dua arah, status koneksi API di UI |
| **Tahap 4: Fitur GIS Lanjutan & QGIS Bridge** | Menambahkan fitur pencarian radius (Spatial Buffer/Nearby), impor dan ekspor GeoJSON terverifikasi, dan validasi koordinat. | Endpoint spasial, form import/export di admin & peta |
| **Tahap 5: PWA & Kemampuan Instalasi** | Menambahkan Web App Manifest (`manifest.json`), Service Worker (`sw.js`), ikon aplikasi, dan status offline ramah pengguna. | Aplikasi dapat di-install di Desktop/Android |
| **Tahap 6: Automated Test Suite** | Menyusun pengujian menyeluruh (API, Autentikasi, CRUD, Aturan Bisnis BR-01 s/d BR-20) dan menjalankannya dengan `npm test`. | Semua pengujian lulus 100% |
| **Tahap 7: Dokumentasi Lengkap** | Memperbarui dokumentasi akademik, API spec, panduan QGIS-PostGIS, dan panduan deployment produksi. | `DOKUMENTASI_PERANCANGAN.md`, `DOKUMENTASI_API.md`, `DOKUMENTASI_QGIS_POSTGIS.md`, `PANDUAN_DEPLOYMENT.md` |

---
