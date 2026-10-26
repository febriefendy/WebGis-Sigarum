-- =========================================================================
-- SIGARUM (Sistem Informasi Geografis UMKM Olahan Laut dan Garam)
-- Database Seed Data & Sample PostGIS Spatial Queries
-- =========================================================================

-- 1. Insert Data Users (Password bcrypt hash demo)
INSERT INTO users (id_user, nama, username, password, role, email, nomor_telepon) VALUES
(1, 'Administrator SIGARUM', 'admin', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHe9h3Dk8aK.pP0fP5o7dE3QY7G5v5oOvy', 'admin', 'admin@sigarum.pamekasankab.go.id', '+62 811-3456-7890'),
(2, 'H. Achmad Syafi''i (Garam Makmur)', 'umkm_garammakmur', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHe9h3Dk8aK.pP0fP5o7dE3QY7G5v5oOvy', 'umkm', 'syafii@garammakmur.id', '+62 812-3456-7801'),
(3, 'Hj. Siti Aminah (Mina Jaya)', 'umkm_minajaya', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHe9h3Dk8aK.pP0fP5o7dE3QY7G5v5oOvy', 'umkm', 'aminah@minajayabahari.id', '+62 821-4098-1234');

-- 2. Insert Kategori
INSERT INTO kategori (id_kategori, nama_kategori, slug, deskripsi, warna, icon) VALUES
(1, 'Olahan Laut', 'olahan-laut', 'Produk pangan dan olahan berbasis hasil tangkapan laut (ikan asin, teri, kerupuk ikan, terasi, petis, abon).', '#0284c7', 'fish'),
(2, 'Garam', 'garam', 'Produk garam tambak kristal, garam konsumsi beryodium, garam dapur, garam spa, dan pakan ternak.', '#d97706', 'sparkles');

-- 3. Insert Master Wilayah (PostGIS Polygon MultiPolygon approximation for Pamekasan coastal subdistricts)
INSERT INTO wilayah (id_wilayah, nama_wilayah, kecamatan, kabupaten, provinsi, tipe_pesisir, deskripsi, geom) VALUES
(1, 'Pademawu', 'Pademawu', 'Pamekasan', 'Jawa Timur', 'Pantai Selatan & Sentra Garam', 'Sentra garam rakyat terbesar di Pamekasan (Bunder, Majungan, Dasok).',
 ST_Multi(ST_GeomFromText('POLYGON((113.5150 -7.1850, 113.5550 -7.1820, 113.5700 -7.2080, 113.5650 -7.2350, 113.5350 -7.2450, 113.5080 -7.2280, 113.5100 -7.2000, 113.5150 -7.1850))', 4326))),
(2, 'Tlanakan', 'Tlanakan', 'Pamekasan', 'Jawa Timur', 'Pantai Selatan & Pelabuhan PPI', 'Pusat lelang ikan PPI Branta Pesisir, produsen terasi rebon asli dan petis Madura.',
 ST_Multi(ST_GeomFromText('POLYGON((113.4450 -7.1800, 113.4900 -7.1850, 113.5080 -7.2280, 113.4850 -7.2400, 113.4420 -7.2350, 113.4350 -7.2050, 113.4450 -7.1800))', 4326))),
(3, 'Galis', 'Galis', 'Pamekasan', 'Jawa Timur', 'Pesisir Tenggara & Tambak Kristal', 'Kawasan kristalisasi garam tradisional dan industri serta pengeringan ikan asin.',
 ST_Multi(ST_GeomFromText('POLYGON((113.5550 -7.1820, 113.5950 -7.1750, 113.6120 -7.2100, 113.5900 -7.2380, 113.5650 -7.2350, 113.5700 -7.2080, 113.5550 -7.1820))', 4326))),
(4, 'Larangan', 'Larangan', 'Pamekasan', 'Jawa Timur', 'Pesisir Timur & Pengeringan Ikan', 'Kawasan wisata Talang Siring, sentra ikan asap dan pengolahan hasil budidaya pesisir timur.',
 ST_Multi(ST_GeomFromText('POLYGON((113.5500 -7.1350, 113.6050 -7.1300, 113.6180 -7.1700, 113.5950 -7.1750, 113.5550 -7.1550, 113.5500 -7.1350))', 4326))),
(5, 'Pasean', 'Pasean', 'Pamekasan', 'Jawa Timur', 'Pantai Utara & Ikan Kering', 'Sentra penangkapan ikan pelagis Laut Jawa, produsen abon tongkol, cumi kering, dan ikan asin teri belah.',
 ST_Multi(ST_GeomFromText('POLYGON((113.5200 -6.9150, 113.5780 -6.9100, 113.5850 -6.8750, 113.5250 -6.8780, 113.5200 -6.9150))', 4326))),
(6, 'Batumarmar', 'Batumarmar', 'Pamekasan', 'Jawa Timur', 'Pesisir Karang & Kerupuk Ikan', 'Kawasan pesisir utara berkarang, produsen kerupuk ikan payus renyah dan olahan rumput laut.',
 ST_Multi(ST_GeomFromText('POLYGON((113.4500 -6.9250, 113.5200 -6.9150, 113.5250 -6.8780, 113.4550 -6.8850, 113.4500 -6.9250))', 4326)));

-- 4. Insert Data UMKM dengan Titik Spasial Point
INSERT INTO umkm (id_umkm, id_user, id_kategori, id_wilayah, nama_umkm, pemilik, alamat, desa, kecamatan, kabupaten, provinsi, deskripsi, kontak, latitude, longitude, geom, foto, status, tahun_berdiri, legalitas) VALUES
(1, 2, 2, 1, 'Garam Makmur Bunder', 'H. Achmad Syafi''i', 'Jl. Tambak Garam No. 14, Dusun Bunder Barat', 'Bunder', 'Pademawu', 'Pamekasan', 'Jawa Timur', 'Sentra produsen garam konsumsi beryodium dan garam krosok kualitas super kristalisasi geomembran.', '+62 812-3456-7801', -7.2195000, 113.5410000, ST_SetSRID(ST_MakePoint(113.5410000, -7.2195000), 4326), 'https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=800&q=80', 'Aktif', 2014, 'NIB: 9120003410291 | P-IRT | Halal MUI'),
(2, 3, 1, 2, 'Mina Jaya Bahari', 'Hj. Siti Aminah', 'Jl. Pelabuhan PPI Branta Pesisir No. 05', 'Branta Pesisir', 'Tlanakan', 'Pamekasan', 'Jawa Timur', 'Pengolah ikan asin kualitas ekspor, spesialis teri nasi kering tawar dan tongkol asap bumbu rempah.', '+62 821-4098-1234', -7.2140000, 113.4650000, ST_SetSRID(ST_MakePoint(113.4650000, -7.2140000), 4326), 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=800&q=80', 'Aktif', 2011, 'NIB: 9120008821034 | P-IRT No. 202352801045'),
(3, NULL, 1, 1, 'Laut Sejahtera Majungan', 'Bapak Mahmudin', 'Jl. Raya Majungan Pesisir Km 3', 'Majungan', 'Pademawu', 'Pamekasan', 'Jawa Timur', 'Sentra kerupuk ikan tradisional Madura berbahan ikan payus dan terung laut segar tanpa pengawet.', '+62 852-3112-9901', -7.2310000, 113.5510000, ST_SetSRID(ST_MakePoint(113.5510000, -7.2310000), 4326), 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80', 'Aktif', 2016, 'NIB: 0220005519821 | P-IRT | Halal'),
(4, NULL, 2, 3, 'Sari Garam Kristal Galis', 'H. Moh. Fadli', 'Jl. Sentra Tambak Garam No. 22', 'Ponteh', 'Galis', 'Pamekasan', 'Jawa Timur', 'Pabrikasi garam meja dapur beryodium tinggi dan garam kasar kualitas standar industri makanan.', '+62 813-5789-2234', -7.1980000, 113.5760000, ST_SetSRID(ST_MakePoint(113.5760000, -7.1980000), 4326), 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80', 'Aktif', 2015, 'SNI 3556:2016 | BPOM RI MD'),
(5, NULL, 1, 2, 'Samudra Rasa Kramat', 'Ibu Nurul Qomariyah', 'Dusun Kramat Tengah RT 02/RW 01', 'Kramat', 'Tlanakan', 'Pamekasan', 'Jawa Timur', 'Produsen terasi udang rebon asli 100% tanpa pewarna dan petis ikan cakalang khas Madura gurih legit.', '+62 878-5002-3344', -7.2180000, 113.4560000, ST_SetSRID(ST_MakePoint(113.4560000, -7.2180000), 4326), 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?auto=format&fit=crop&w=800&q=80', 'Aktif', 2008, 'P-IRT No. 202352802099 | Sertifikat Halal'),
(17, NULL, 1, 4, 'Bahari Talang Siring', 'Bapak H. Fathorrahman', 'Jl. Raya Pamekasan-Sumenep Km 14', 'Montok', 'Larangan', 'Pamekasan', 'Jawa Timur', 'Sentra olahan ikan cucut asap khas pesisir timur, terasi bakar harum, dan ikan kembung asin kering.', '+62 823-3456-9120', -7.1520000, 113.5870000, ST_SetSRID(ST_MakePoint(113.5870000, -7.1520000), 4326), 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=800&q=80', 'Aktif', 2016, 'NIB: 1209000958102 | P-IRT | Halal'),
(18, NULL, 2, 4, 'Garam Pesisir Tanjung Mas', 'Ibu Hj. Halimah', 'Jl. Pesisir Tambak Garam No. 08', 'Tanjung', 'Larangan', 'Pamekasan', 'Jawa Timur', 'Produksi garam kristal krosok berkualitas tinggi dari tambak pesisir timur dengan metode penguapan bertingkat.', '+62 819-3788-2301', -7.1610000, 113.5930000, ST_SetSRID(ST_MakePoint(113.5930000, -7.1610000), 4326), 'https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=800&q=80', 'Aktif', 2018, 'NIB: 9120007234190 | P-IRT | SNI');

-- 5. Insert Data Produk
INSERT INTO produk (id_produk, id_umkm, id_kategori, nama_produk, kategori, harga, berat, deskripsi, foto, stok_status) VALUES
(1, 1, 2, 'Garam Konsumsi Beryodium 250gr', 'Garam', 4500.00, '250 gram', 'Garam halus putih beryodium tinggi minimal 30 ppm KIO3 ber-SNI 3556:2016.', 'https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=600&q=80', 'Tersedia'),
(2, 1, 2, 'Garam Krosok Kristal Putih 50kg', 'Garam', 115000.00, '50 kg', 'Garam krosok tambak geomembran kristal putih bersih NaCl > 94%.', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', 'Tersedia'),
(3, 2, 1, 'Ikan Teri Nasi Kering Super (Tawar)', 'Olahan Laut', 45000.00, '250 gram', 'Teri nasi tawar ekspor tanpa formalin, putih alami dan gurih manis.', 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=600&q=80', 'Tersedia'),
(4, 2, 1, 'Ikan Tongkol Asap Bumbu Rempah', 'Olahan Laut', 32000.00, '500 gram', 'Ikan tongkol segar diasap dengan sabut kelapa dan bumbu khas Madura.', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80', 'Tersedia'),
(5, 5, 1, 'Terasi Udang Rebon Asli Madura', 'Olahan Laut', 18000.00, '150 gram', 'Terasi Kramat Tlanakan dari 100% udang rebon asli tanpa zat pewarna.', 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?auto=format&fit=crop&w=600&q=80', 'Tersedia'),
(29, 17, 1, 'Ikan Cucut Asap Talang Siring', 'Olahan Laut', 30000.00, '400 gram', 'Ikan cucut segar pilihan diasap tradisional Talang Siring.', 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=600&q=80', 'Tersedia'),
(31, 18, 2, 'Garam Tambak Kristal Tanjung Mas 50kg', 'Garam', 115000.00, '50 kg', 'Garam krosok tambak pesisir timur kristal putih jernih.', 'https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=600&q=80', 'Tersedia');

-- =========================================================================
-- CONTOH SPATIAL QUERIES POSTGIS UNTUK PRESENTASI & ANALISIS
-- =========================================================================

-- CONTOH 1: Menghitung UMKM di dalam Polygon Batas Kecamatan (Spatial Join / ST_Contains)
SELECT 
    w.kecamatan, 
    COUNT(u.id_umkm) AS jumlah_umkm
FROM wilayah w
LEFT JOIN umkm u ON ST_Contains(w.geom, u.geom)
GROUP BY w.kecamatan
ORDER BY jumlah_umkm DESC;

-- CONTOH 2: Mencari UMKM dalam radius 5 KM dari Titik Tertentu (ST_DWithin pada Geografi)
-- Titik uji: Alun-Alun Pamekasan (-7.1583, 113.4750)
SELECT 
    nama_umkm, 
    kategori, 
    kecamatan,
    ROUND((ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(113.4750, -7.1583), 4326)::geography) / 1000)::numeric, 2) AS jarak_km
FROM umkm
WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(113.4750, -7.1583), 4326)::geography, 5000)
ORDER BY jarak_km ASC;

-- CONTOH 3: Ekspor Data Titik UMKM Menjadi FeatureCollection GeoJSON Langsung dari SQL
SELECT json_build_object(
    'type', 'FeatureCollection',
    'features', json_agg(
        json_build_object(
            'type', 'Feature',
            'geometry', ST_AsGeoJSON(geom)::json,
            'properties', json_build_object(
                'id_umkm', id_umkm,
                'nama_umkm', nama_umkm,
                'kategori', kategori,
                'kecamatan', kecamatan,
                'kontak', kontak,
                'status', status
            )
        )
    )
) AS geojson_output
FROM umkm
WHERE status = 'Aktif';
