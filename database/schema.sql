-- =========================================================================
-- SIGARUM (Sistem Informasi Geografis UMKM Olahan Laut dan Garam)
-- Database Schema: PostgreSQL 14+ with PostGIS 3.0+ Extension
-- =========================================================================

-- 1. Aktifkan Ekstensi Spasial PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Bersihkan tabel jika sudah ada (Reverse order of dependencies)
DROP TABLE IF EXISTS produk CASCADE;
DROP TABLE IF EXISTS umkm CASCADE;
DROP TABLE IF EXISTS wilayah CASCADE;
DROP TABLE IF EXISTS kategori CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =========================================================================
-- TABEL: USERS
-- Menyimpan kredensial pengguna dan role (Admin & Pelaku UMKM)
-- Memenuhi Aturan Bisnis BR-09, BR-10, BR-15
-- =========================================================================
CREATE TABLE users (
    id_user SERIAL PRIMARY KEY,
    nama VARCHAR(150) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Disimpan dalam format bcrypt / Argon2 hash
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'umkm')),
    email VARCHAR(100),
    nomor_telepon VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- TABEL: KATEGORI
-- Menyimpan kategori usaha UMKM (Olahan Laut, Garam, dan dinamis oleh admin)
-- Memenuhi Aturan Bisnis BR-03
-- =========================================================================
CREATE TABLE kategori (
    id_kategori SERIAL PRIMARY KEY,
    nama_kategori VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    deskripsi TEXT,
    warna VARCHAR(10) DEFAULT '#0284c7',
    icon VARCHAR(50) DEFAULT 'box',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- TABEL: WILAYAH
-- Menyimpan batas administratif kecamatan dan polygon PostGIS
-- Tipe geometri: MULTIPOLYGON SRID 4326 (WGS 84)
-- =========================================================================
CREATE TABLE wilayah (
    id_wilayah SERIAL PRIMARY KEY,
    nama_wilayah VARCHAR(100) NOT NULL,
    kecamatan VARCHAR(100) NOT NULL,
    kabupaten VARCHAR(100) NOT NULL DEFAULT 'Pamekasan',
    provinsi VARCHAR(100) NOT NULL DEFAULT 'Jawa Timur',
    tipe_pesisir VARCHAR(100),
    deskripsi TEXT,
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index spasial untuk batas wilayah
CREATE INDEX idx_wilayah_geom ON wilayah USING GIST (geom);

-- =========================================================================
-- TABEL: UMKM
-- Menyimpan data profil UMKM dan koordinat spasial
-- Tipe geometri: POINT SRID 4326 (WGS 84)
-- Memenuhi Aturan Bisnis BR-01, BR-02, BR-03, BR-04, BR-07, BR-08, BR-12
-- =========================================================================
CREATE TABLE umkm (
    id_umkm SERIAL PRIMARY KEY,
    id_user INT REFERENCES users(id_user) ON DELETE SET NULL,
    id_kategori INT NOT NULL REFERENCES kategori(id_kategori) ON DELETE RESTRICT,
    id_wilayah INT REFERENCES wilayah(id_wilayah) ON DELETE SET NULL,
    nama_umkm VARCHAR(200) NOT NULL,
    pemilik VARCHAR(150) NOT NULL,
    alamat TEXT NOT NULL,
    desa VARCHAR(100) NOT NULL,
    kecamatan VARCHAR(100) NOT NULL,
    kabupaten VARCHAR(100) NOT NULL DEFAULT 'Pamekasan',
    provinsi VARCHAR(100) NOT NULL DEFAULT 'Jawa Timur',
    deskripsi TEXT,
    kontak VARCHAR(50) NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL CHECK (latitude BETWEEN -90.0 AND 90.0),
    longitude NUMERIC(10, 7) NOT NULL CHECK (longitude BETWEEN -180.0 AND 180.0),
    geom GEOMETRY(Point, 4326),
    foto VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Nonaktif')),
    tahun_berdiri INT,
    legalitas VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index spasial GiST untuk titik UMKM
CREATE INDEX idx_umkm_geom ON umkm USING GIST (geom);
CREATE INDEX idx_umkm_status ON umkm (status);
CREATE INDEX idx_umkm_kecamatan ON umkm (kecamatan);

-- =========================================================================
-- TABEL: PRODUK
-- Menyimpan produk yang dihasilkan oleh UMKM
-- Memenuhi Aturan Bisnis BR-05, BR-06, BR-13, BR-14
-- =========================================================================
CREATE TABLE produk (
    id_produk SERIAL PRIMARY KEY,
    id_umkm INT NOT NULL REFERENCES umkm(id_umkm) ON DELETE CASCADE,
    id_kategori INT REFERENCES kategori(id_kategori) ON DELETE SET NULL,
    nama_produk VARCHAR(200) NOT NULL,
    kategori VARCHAR(100) NOT NULL,
    harga NUMERIC(12, 2) NOT NULL CHECK (harga >= 0),
    berat VARCHAR(50),
    deskripsi TEXT,
    foto VARCHAR(255),
    stok_status VARCHAR(50) DEFAULT 'Tersedia',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_produk_umkm ON produk (id_umkm);

-- =========================================================================
-- TRIGGER OTOMATIS: SINKRONISASI KOORDINAT LAT/LONG DENGAN POSTGIS POINT
-- =========================================================================
CREATE OR REPLACE FUNCTION sync_umkm_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_umkm_geom
BEFORE INSERT OR UPDATE OF latitude, longitude ON umkm
FOR EACH ROW
EXECUTE FUNCTION sync_umkm_geom();

-- =========================================================================
-- VIEW ANALISIS SPASIAL UNTUK DASHBOARD & API
-- =========================================================================

-- View 1: UMKM Aktif Publik Lengkap dengan GeoJSON
CREATE OR REPLACE VIEW v_umkm_aktif_geojson AS
SELECT 
    u.id_umkm,
    u.nama_umkm,
    u.pemilik,
    k.nama_kategori,
    k.warna AS warna_kategori,
    u.kecamatan,
    u.desa,
    u.alamat,
    u.kontak,
    u.status,
    u.latitude,
    u.longitude,
    u.foto,
    ST_AsGeoJSON(u.geom)::json AS geojson,
    COUNT(p.id_produk) AS total_produk
FROM umkm u
JOIN kategori k ON u.id_kategori = k.id_kategori
LEFT JOIN produk p ON u.id_umkm = p.id_umkm
WHERE u.status = 'Aktif'
GROUP BY u.id_umkm, k.nama_kategori, k.warna;

-- View 2: Agregasi UMKM Berdasarkan Kecamatan
CREATE OR REPLACE VIEW v_statistik_kecamatan AS
SELECT 
    u.kecamatan,
    COUNT(u.id_umkm) AS total_umkm,
    SUM(CASE WHEN k.slug = 'olahan-laut' THEN 1 ELSE 0 END) AS total_olahan_laut,
    SUM(CASE WHEN k.slug = 'garam' THEN 1 ELSE 0 END) AS total_garam,
    SUM(CASE WHEN u.status = 'Aktif' THEN 1 ELSE 0 END) AS total_aktif,
    SUM(CASE WHEN u.status = 'Nonaktif' THEN 1 ELSE 0 END) AS total_nonaktif
FROM umkm u
JOIN kategori k ON u.id_kategori = k.id_kategori
GROUP BY u.kecamatan
ORDER BY total_umkm DESC;
