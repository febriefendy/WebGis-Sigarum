# PANDUAN INTEGRASI QGIS DESKTOP & POSTGRESQL/POSTGIS
## Alur Kerja Pengolahan Geospasial, Validasi Topologi, dan Sinkronisasi Data SIGARUM

---

## 1. PENDAHULUAN & PRINSIP INTEGRASI

Sistem SIGARUM memisahkan secara tegas antara **Desktop GIS (QGIS)** sebagai perangkat analisis/digitasi spasial tingkat lanjut dengan **WebGIS (Leaflet + Express + PostGIS)** sebagai media penyajian interaktif kepada masyarakat dan pengambil kebijakan.

Proyek QGIS Desktop tidak berubah secara otomatis menjadi aplikasi web, melainkan berinteraksi melalui dua jalur pertukaran standar:
1. **Jalur Langsung (Direct PostGIS Connection):** QGIS Desktop terhubung langsung ke basis data PostgreSQL/PostGIS melalui protokol TCP/IP Port 5432.
2. **Jalur Berkas Pertukaran (Interchange GeoJSON RFC 7946):** QGIS mengekspor layer spasial berproyeksi WGS 84 (EPSG:4326), yang kemudian diunggah dan divalidasi oleh backend SIGARUM melalui endpoint `/api/spatial/import/geojson` atau panel administrasi.

---

## 2. STANDAR SISTEM KOORDINAT REFERENSI (CRS)

Seluruh data geospasial pada SIGARUM menggunakan standar internasional:
- **Nama CRS:** WGS 84 (World Geodetic System 1984)
- **Kode EPSG:** `EPSG:4326`
- **Tipe Koordinat:** Geografis (Derajat Desimal: Latitude, Longitude)
- **Rentang Batas Valid Kabupaten Pamekasan:**
  - Latitude (Lintang): `-6.8000` s/d `-7.3000`
  - Longitude (Bujur): `113.4000` s/d `113.6500`

---

## 3. ALUR KERJA LENGKAP PENGOLAHAN DATA SPASIAL DI QGIS (8 TAHAP)

### Tahap 1: Menyiapkan Data Spasial di QGIS Desktop
1. Buka aplikasi **QGIS Desktop 3.28 LTR (atau versi terbaru)**.
2. Muat basemap pendukung dari browser panel (misal: *OpenStreetMap* atau *Google Satellite* via XYZ Tiles).
3. Buat layer shapefile/geopackage baru:
   - Untuk data lokasi UMKM: pilih tipe geometri **Point** (Titik).
   - Untuk batas wilayah kecamatan: pilih tipe geometri **MultiPolygon** (Poligon).
4. Pastikan opsi CRS layer diatur ke **EPSG:4326 - WGS 84**.

### Tahap 2: Memeriksa Atribut & Skema Data
Buka tabel atribut (*Attribute Table*) di QGIS dan pastikan nama kolom mengikuti standar skema SIGARUM:

| Nama Atribut (Field) | Tipe Data | Deskripsi / Contoh |
|---|---|---|
| `nama_umkm` | String (Text) | Nama entitas usaha (misal: *Garam Makmur Bunder*) |
| `pemilik` | String (Text) | Nama penanggung jawab usaha |
| `kategori` | String (Text) | `Olahan Laut` atau `Garam` |
| `kecamatan` | String (Text) | Nama kecamatan (Pademawu, Tlanakan, Galis, dll.) |
| `desa` | String (Text) | Nama desa / kelurahan |
| `kontak` | String (Text) | Nomor WhatsApp format internasional (`+62 812-...`) |
| `status` | String (Text) | `Aktif` atau `Nonaktif` |

### Tahap 3: Memvalidasi Geometri & Topologi Spasial
Sebelum diekspor atau disimpan, lakukan pembersihan topologi:
1. Buka menu **Vector** &rarr; **Geometry Tools** &rarr; **Check Validity...**
2. Periksa apakah terdapat geometri yang korup (*null geometries, self-intersections, duplicate nodes*).
3. Untuk batas poligon kecamatan: gunakan plugin **Topology Checker** dengan aturan:
   - *must not have overlaps* (tidak boleh saling tumpang tindih antar kecamatan).
   - *must not have gaps* (tidak boleh ada celah kosong tak berpemilik).
4. Perbaiki geometri yang error dengan alat **Fix Geometries** atau **Node Tool**.

### Tahap 4: Mengekspor GeoJSON atau Menghubungkan ke PostGIS

#### Opsi A: Koneksi Langsung QGIS ke PostgreSQL / PostGIS
1. Pada panel *Browser* QGIS di sebelah kiri, klik kanan pada **PostGIS** &rarr; pilih **New Connection...**
2. Masukkan parameter koneksi:
   - **Name:** `SIGARUM_DB`
   - **Host:** `localhost` (atau IP server produksi)
   - **Port:** `5432`
   - **Database:** `sigarum_db`
   - **Authentication:** Masukkan username dan password PostgreSQL Anda.
3. Klik **Test Connection** hingga muncul pesan sukses.
4. Layer tabel spasial `umkm` (geom Point) dan `wilayah` (geom MultiPolygon) akan langsung muncul di panel layer QGIS dan dapat diedit secara langsung (*real-time vector editing*).

#### Opsi B: Ekspor Berkas GeoJSON Terstandarisasi
1. Klik kanan pada layer di panel QGIS &rarr; pilih **Export** &rarr; **Save Features As...**
2. Format: **GeoJSON**.
3. File name: `sigarum_umkm_qgis.geojson`.
4. CRS: **EPSG:4326 - WGS 84**.
5. Pada bagian *Coordinate Precision*: isi `6` (presisi ~0.1 meter, optimal untuk web).
6. Centang *Write FeatureCollection* &rarr; Klik **OK**.

### Tahap 5: Mengimpor / Menyinkronkan Data Melalui Panel SIGARUM
1. Buka peramban web dan masuk ke Panel Admin SIGARUM: `http://localhost:5000/admin/umkm.html`.
2. Klik tombol **"Impor QGIS"** pada bilah atas.
3. Pilih berkas `sigarum_umkm_qgis.geojson` atau tempelkan teks GeoJSON ke dalam formulir modal.
4. Klik tombol **"Validasi Spasial"**. Sistem akan memindai seluruh koordinat dan memastikan tidak ada titik yang berada di luar batas valid bumi.

### Tahap 6: Validasi Server-Side Backend
Backend SIGARUM menjalankan fungsi `validateGeoJSONImport()` di server:
- Memeriksa struktur objek GeoJSON (RFC 7946).
- Memverifikasi rentang latitude (-90 hingga 90) dan longitude (-180 hingga 180).
- Memeriksa keberadaan atribut wajib (`nama_umkm`, `pemilik`, `kategori`).
- Menyinkronkan titik koordinat ke dalam kolom `latitude`, `longitude`, dan tipe geometri spasial.

### Tahap 7: Menampilkan Data pada Peta Interaktif WebGIS
Data yang lolos validasi otomatis dimasukkan ke dalam database dan langsung diterbitkan:
- Marker muncul dengan ikon kategori yang sesuai (ikan untuk Olahan Laut, kristal untuk Garam).
- Titik koordinat terhubung ke multi-basemap Leaflet (Google Satellite, Carto, Esri).

### Tahap 8: Verifikasi Hasil Visualisasi
Admin atau analis membuka `peta.html` untuk memverifikasi:
- Titik marker jatuh tepat pada kawasan tambak garam atau pesisir pendaratan ikan yang sesuai dengan citra satelit nyata.
- Popup memuat data UMKM, legalitas, dan tombol navigasi ke Google Maps.

---

## 4. CARA MEMPERBARUI DATA TANPA MERUSAK RELASI DATA YANG ADA

Ketika melakukan pembaruan berkala dari QGIS, ikuti prinsip kehati-hatian berikut:

1. **Gunakan Primary Key yang Konsisten:**
   - Jangan mengubah nilai `id_umkm` yang sudah tersimpan di basis data, karena tabel `produk` terikat dengan foreign key ke `id_umkm`.
2. **Pembaruan Koordinat (Relokasi Titik Usaha):**
   - Jika pelaku UMKM berpindah lokasi, ubah koordinat pada baris UMKM yang sama. Jangan menghapus baris lama lalu membuat baris baru, karena akan menghapus produk terkait secara *cascade*.
3. **Backup Rutin Sebelum Impor Skala Besar:**
   - Selalu lakukan backup basis data sebelum menjalankan impor pembaruan besar (lihat `PANDUAN_DEPLOYMENT.md` bagian Backup).

---

## 5. CONTOH KUERI SPASIAL POSTGIS UNTUK ANALISIS LANJUTAN

Bila menggunakan PostgreSQL + PostGIS di lingkungan produksi, berikut contoh kueri spasial analitik yang siap dijalankan:

```sql
-- 1. Menemukan UMKM dalam radius 5 kilometer dari Pelabuhan PPI Branta (-7.2140, 113.4650)
SELECT 
    nama_umkm, pemilik, kategori, kecamatan,
    ROUND((ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(113.4650, -7.2140), 4326)::geography) / 1000)::numeric, 2) AS jarak_km
FROM umkm
WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(113.4650, -7.2140), 4326)::geography, 5000)
ORDER BY jarak_km ASC;

-- 2. Menghitung Jumlah UMKM di dalam Poligon Batas Kecamatan Pademawu (ST_Contains)
SELECT 
    w.kecamatan,
    COUNT(u.id_umkm) AS jumlah_umkm_di_dalam_poligon
FROM wilayah w
JOIN umkm u ON ST_Contains(w.geom, u.geom)
WHERE w.kecamatan = 'Pademawu'
GROUP BY w.kecamatan;

-- 3. Ekspor Data UMKM Aktif Menjadi GeoJSON FeatureCollection Langsung dari SQL
SELECT json_build_object(
    'type', 'FeatureCollection',
    'features', json_agg(
        json_build_object(
            'type', 'Feature',
            'geometry', ST_AsGeoJSON(geom)::json,
            'properties', json_build_object(
                'id_umkm', id_umkm,
                'nama_umkm', nama_umkm,
                'pemilik', pemilik,
                'kategori', (SELECT nama_kategori FROM kategori WHERE id_kategori = umkm.id_kategori),
                'kecamatan', kecamatan,
                'kontak', kontak
            )
        )
    )
) FROM umkm WHERE status = 'Aktif';
```
