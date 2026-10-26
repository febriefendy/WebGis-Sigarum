const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', '..', 'database', 'sigarum.sqlite');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('[SIGARUM Database] Connected to SQLite database at:', DB_PATH);
  }
});

// Enable Foreign Keys in SQLite
db.run('PRAGMA foreign_keys = ON;');

// Promisified helpers
const query = {
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  exec(sql) {
    return new Promise((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

/**
 * Initialize Tables matching PostgreSQL schema & seed initial demo data
 */
async function initDatabase() {
  try {
    // 1. Create Tables
    await query.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id_user INTEGER PRIMARY KEY AUTOINCREMENT,
        nama TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'umkm', 'penjual', 'pelanggan')),
        email TEXT,
        nomor_telepon TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS kategori (
        id_kategori INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_kategori TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        deskripsi TEXT,
        warna TEXT DEFAULT '#0284c7',
        icon TEXT DEFAULT 'box',
        badge_bg TEXT DEFAULT 'bg-sky-100',
        badge_text TEXT DEFAULT 'text-sky-800',
        border_color TEXT DEFAULT 'border-sky-500',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS wilayah (
        id_wilayah INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_wilayah TEXT NOT NULL,
        kecamatan TEXT NOT NULL,
        kabupaten TEXT NOT NULL DEFAULT 'Pamekasan',
        provinsi TEXT NOT NULL DEFAULT 'Jawa Timur',
        tipe_pesisir TEXT,
        deskripsi TEXT,
        center_lat REAL,
        center_lng REAL,
        zoom INTEGER DEFAULT 13,
        potensi_utama TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS umkm (
        id_umkm INTEGER PRIMARY KEY AUTOINCREMENT,
        id_user INTEGER,
        id_kategori INTEGER NOT NULL,
        id_wilayah INTEGER,
        nama_umkm TEXT NOT NULL,
        pemilik TEXT NOT NULL,
        alamat TEXT NOT NULL,
        desa TEXT NOT NULL,
        kecamatan TEXT NOT NULL,
        kabupaten TEXT NOT NULL DEFAULT 'Pamekasan',
        provinsi TEXT NOT NULL DEFAULT 'Jawa Timur',
        deskripsi TEXT,
        kontak TEXT NOT NULL,
        latitude REAL NOT NULL CHECK (latitude BETWEEN -90.0 AND 90.0),
        longitude REAL NOT NULL CHECK (longitude BETWEEN -180.0 AND 180.0),
        foto TEXT,
        status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Nonaktif')),
        tahun_berdiri INTEGER,
        legalitas TEXT,
        jumlah_karyawan INTEGER DEFAULT 5,
        produk_unggulan TEXT, -- JSON array of strings
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE SET NULL,
        FOREIGN KEY (id_kategori) REFERENCES kategori(id_kategori) ON DELETE RESTRICT,
        FOREIGN KEY (id_wilayah) REFERENCES wilayah(id_wilayah) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS produk (
        id_produk INTEGER PRIMARY KEY AUTOINCREMENT,
        id_umkm INTEGER NOT NULL,
        id_kategori INTEGER,
        nama_produk TEXT NOT NULL,
        kategori TEXT NOT NULL,
        harga REAL NOT NULL CHECK (harga >= 0),
        berat TEXT,
        berat_gram INTEGER DEFAULT 250,
        stok INTEGER DEFAULT 25,
        sku TEXT,
        status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Draf', 'Nonaktif', 'Menunggu_Moderasi')),
        deskripsi TEXT,
        foto TEXT,
        stok_status TEXT DEFAULT 'Tersedia',
        terjual INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_umkm) REFERENCES umkm(id_umkm) ON DELETE CASCADE,
        FOREIGN KEY (id_kategori) REFERENCES kategori(id_kategori) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS buyer_addresses (
        id_alamat INTEGER PRIMARY KEY AUTOINCREMENT,
        id_user INTEGER NOT NULL,
        label_alamat TEXT DEFAULT 'Rumah',
        nama_penerima TEXT NOT NULL,
        nomor_telepon TEXT NOT NULL,
        alamat_lengkap TEXT NOT NULL,
        kecamatan TEXT NOT NULL,
        kabupaten TEXT NOT NULL DEFAULT 'Pamekasan',
        provinsi TEXT NOT NULL DEFAULT 'Jawa Timur',
        kode_pos TEXT,
        is_utama INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS carts (
        id_cart INTEGER PRIMARY KEY AUTOINCREMENT,
        id_user INTEGER UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS cart_items (
        id_cart_item INTEGER PRIMARY KEY AUTOINCREMENT,
        id_cart INTEGER NOT NULL,
        id_produk INTEGER NOT NULL,
        kuantitas INTEGER NOT NULL DEFAULT 1 CHECK (kuantitas > 0),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_cart) REFERENCES carts(id_cart) ON DELETE CASCADE,
        FOREIGN KEY (id_produk) REFERENCES produk(id_produk) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS wishlists (
        id_wishlist INTEGER PRIMARY KEY AUTOINCREMENT,
        id_user INTEGER NOT NULL,
        id_produk INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(id_user, id_produk),
        FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE,
        FOREIGN KEY (id_produk) REFERENCES produk(id_produk) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS orders (
        id_order INTEGER PRIMARY KEY AUTOINCREMENT,
        nomor_order TEXT UNIQUE NOT NULL,
        id_pembeli INTEGER NOT NULL,
        id_alamat INTEGER,
        total_belanja REAL NOT NULL DEFAULT 0,
        total_ongkir REAL NOT NULL DEFAULT 0,
        biaya_layanan REAL NOT NULL DEFAULT 1000,
        diskon REAL NOT NULL DEFAULT 0,
        total_tagihan REAL NOT NULL DEFAULT 0,
        metode_pembayaran TEXT NOT NULL DEFAULT 'QRIS',
        status_pembayaran TEXT NOT NULL DEFAULT 'Menunggu_Pembayaran' CHECK (status_pembayaran IN ('Menunggu_Pembayaran', 'Menunggu_Verifikasi', 'Dibayar', 'Kedaluwarsa', 'Gagal', 'Dibatalkan', 'Refund')),
        status_pesanan TEXT NOT NULL DEFAULT 'Menunggu_Pembayaran' CHECK (status_pesanan IN ('Menunggu_Pembayaran', 'Diproses', 'Dalam_Pengiriman', 'Selesai', 'Dibatalkan', 'Sengketa')),
        catatan_pembeli TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_pembeli) REFERENCES users(id_user) ON DELETE RESTRICT,
        FOREIGN KEY (id_alamat) REFERENCES buyer_addresses(id_alamat) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS sub_orders (
        id_sub_order INTEGER PRIMARY KEY AUTOINCREMENT,
        id_order INTEGER NOT NULL,
        id_umkm INTEGER NOT NULL,
        nomor_sub_order TEXT UNIQUE NOT NULL,
        subtotal_produk REAL NOT NULL DEFAULT 0,
        ongkir REAL NOT NULL DEFAULT 0,
        komisi_platform REAL NOT NULL DEFAULT 0,
        pendapatan_bersih REAL NOT NULL DEFAULT 0,
        status_pesanan TEXT NOT NULL DEFAULT 'Diproses' CHECK (status_pesanan IN ('Diproses', 'Siap_Dikirim', 'Dalam_Pengiriman', 'Terkirim', 'Selesai', 'Dibatalkan', 'Pengembalian_Diajukan', 'Refund_Selesai')),
        kurir TEXT DEFAULT 'J&T Express',
        nomor_resi TEXT,
        catatan_penjual TEXT,
        alasan_pembatalan TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_order) REFERENCES orders(id_order) ON DELETE CASCADE,
        FOREIGN KEY (id_umkm) REFERENCES umkm(id_umkm) ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id_order_item INTEGER PRIMARY KEY AUTOINCREMENT,
        id_sub_order INTEGER NOT NULL,
        id_produk INTEGER NOT NULL,
        nama_produk_snapshot TEXT NOT NULL,
        harga_snapshot REAL NOT NULL,
        berat_snapshot TEXT,
        foto_snapshot TEXT,
        kuantitas INTEGER NOT NULL CHECK (kuantitas > 0),
        subtotal REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_sub_order) REFERENCES sub_orders(id_sub_order) ON DELETE CASCADE,
        FOREIGN KEY (id_produk) REFERENCES produk(id_produk) ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS payments (
        id_payment INTEGER PRIMARY KEY AUTOINCREMENT,
        id_order INTEGER NOT NULL,
        nomor_referensi TEXT UNIQUE NOT NULL,
        metode TEXT NOT NULL,
        jumlah_bayar REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'Menunggu_Verifikasi' CHECK (status IN ('Menunggu_Verifikasi', 'Berhasil', 'Ditolak', 'Kedaluwarsa')),
        bukti_transfer TEXT,
        diverifikasi_oleh INTEGER,
        diverifikasi_pada DATETIME,
        catatan_verifikasi TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_order) REFERENCES orders(id_order) ON DELETE CASCADE,
        FOREIGN KEY (diverifikasi_oleh) REFERENCES users(id_user) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id_review INTEGER PRIMARY KEY AUTOINCREMENT,
        id_produk INTEGER NOT NULL,
        id_order_item INTEGER,
        id_user INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        komentar TEXT,
        balasan_penjual TEXT,
        balasan_pada DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_produk) REFERENCES produk(id_produk) ON DELETE CASCADE,
        FOREIGN KEY (id_order_item) REFERENCES order_items(id_order_item) ON DELETE SET NULL,
        FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS coupons (
        id_coupon INTEGER PRIMARY KEY AUTOINCREMENT,
        kode_kupon TEXT UNIQUE NOT NULL,
        tipe_diskon TEXT NOT NULL DEFAULT 'persen' CHECK (tipe_diskon IN ('persen', 'nominal')),
        nilai_diskon REAL NOT NULL,
        min_belanja REAL DEFAULT 0,
        maks_diskon REAL,
        kuota INTEGER DEFAULT 100,
        terpakai INTEGER DEFAULT 0,
        is_aktif INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS platform_settings (
        key_name TEXT PRIMARY KEY,
        value_text TEXT NOT NULL,
        keterangan TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id_log INTEGER PRIMARY KEY AUTOINCREMENT,
        id_user INTEGER,
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        entity_id INTEGER,
        details TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure users table supports multi-role: 'admin', 'umkm', 'penjual', 'pelanggan'
    try {
      const tableInfo = await query.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'");
      if (tableInfo && !tableInfo.sql.includes('pelanggan')) {
        await query.exec(`
          PRAGMA foreign_keys = OFF;
          CREATE TABLE IF NOT EXISTS users_temp (
            id_user INTEGER PRIMARY KEY AUTOINCREMENT,
            nama TEXT NOT NULL,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('admin', 'umkm', 'penjual', 'pelanggan')),
            email TEXT,
            nomor_telepon TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
          INSERT INTO users_temp (id_user, nama, username, password, role, email, nomor_telepon, created_at, updated_at)
            SELECT id_user, nama, username, password, role, email, nomor_telepon, created_at, updated_at FROM users;
          DROP TABLE users;
          ALTER TABLE users_temp RENAME TO users;
          PRAGMA foreign_keys = ON;
        `);
        console.log('[SIGARUM Database] Migrated users table constraint to allow admin, umkm, penjual, and pelanggan.');
      }
    } catch (migErr) {
      console.warn('[SIGARUM Database] Schema migration warning:', migErr.message);
    }

    // Ensure produk and umkm have ecommerce columns
    const produkCols = [
      "ALTER TABLE produk ADD COLUMN stok INTEGER DEFAULT 25",
      "ALTER TABLE produk ADD COLUMN berat_gram INTEGER DEFAULT 250",
      "ALTER TABLE produk ADD COLUMN sku TEXT",
      "ALTER TABLE produk ADD COLUMN status TEXT DEFAULT 'Aktif'",
      "ALTER TABLE produk ADD COLUMN terjual INTEGER DEFAULT 0"
    ];
    for (const sql of produkCols) {
      try { await query.exec(sql); } catch {}
    }

    const userCols = [
      "ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'Aktif'",
      "ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 1"
    ];
    for (const sql of userCols) {
      try { await query.exec(sql); } catch {}
    }

    const umkmCols = [
      "ALTER TABLE umkm ADD COLUMN banner TEXT",
      "ALTER TABLE umkm ADD COLUMN verifikasi_status TEXT DEFAULT 'Disetujui'",
      "ALTER TABLE umkm ADD COLUMN saldo_tersedia REAL DEFAULT 0",
      "ALTER TABLE umkm ADD COLUMN saldo_tertahan REAL DEFAULT 0",
      "ALTER TABLE umkm ADD COLUMN rating_avg REAL DEFAULT 5.0",
      "ALTER TABLE umkm ADD COLUMN rating_count INTEGER DEFAULT 0"
    ];
    for (const sql of umkmCols) {
      try { await query.exec(sql); } catch {}
    }

    // Seed default platform settings if not present
    await query.run(`INSERT OR IGNORE INTO platform_settings (key_name, value_text, keterangan) VALUES 
      ('nama_platform', 'SIGARUM E-Commerce', 'Nama marketplace olahan laut dan garam'),
      ('komisi_persen', '2.5', 'Persentase komisi platform atas transaksi selesai (%)'),
      ('biaya_layanan', '1000', 'Biaya layanan transaksi pembeli (Rp)'),
      ('kebijakan_toko', 'Produk olahan laut dan garam diproduksi langsung dari sentra pesisir Madura.', 'Kebijakan umum toko'),
      ('kebijakan_refund', 'Pengajuan pengembalian barang atau dana maksimal 2x24 jam sejak barang tiba.', 'Ketentuan retur dan refund')
    `);

    // Seed sample coupon
    await query.run(`INSERT OR IGNORE INTO coupons (id_coupon, kode_kupon, tipe_diskon, nilai_diskon, min_belanja, maks_diskon, kuota) VALUES
      (1, 'SIGARUMHEMAT', 'persen', 10, 50000, 20000, 100),
      (2, 'GRATISONGKIR', 'nominal', 10000, 30000, 10000, 100)
    `);

    // Check if users already seeded
    const userCount = await query.get('SELECT COUNT(*) as cnt FROM users');
    if (userCount.cnt === 0) {
      console.log('[SIGARUM Database] Seeding initial data from JSON...');
      await seedInitialData();
    }
  } catch (err) {
    console.error('[SIGARUM Database] Init error:', err);
  }
}

async function ensureMultiRoleDemoUsers() {
  try {
    const salt = await bcrypt.genSalt(10);
    const passHash = await bcrypt.hash('password123', salt);

    // Check pelanggan demo
    const pelanggan = await query.get("SELECT id_user FROM users WHERE username = 'pelanggan_demo'");
    if (!pelanggan) {
      await query.run(
        `INSERT INTO users (nama, username, password, role, email, nomor_telepon)
         VALUES ('Siti Fatimah (Pelanggan Madura)', 'pelanggan_demo', ?, 'pelanggan', 'pelanggan@sigarum.id', '+62 852-3321-7789')`,
        [passHash]
      );
    }

    // Check admin credentials
    const admin = await query.get("SELECT id_user, password FROM users WHERE username = 'admin'");
    if (admin) {
      const isMatch = await bcrypt.compare('admin123', admin.password);
      if (!isMatch) {
        const adminHash = await bcrypt.hash('admin123', salt);
        await query.run("UPDATE users SET password = ?, status = 'Aktif' WHERE username = 'admin'", [adminHash]);
      }
    }
  } catch (err) {
    console.warn('[SIGARUM Database] Error ensuring demo multi-role users:', err.message);
  }
}

async function seedInitialData() {
  const dataDir = path.join(__dirname, '..', '..', 'data');

  // 1. Seed Users (with secure bcrypt hash)
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('admin123', salt);
  const umkmHash = await bcrypt.hash('password123', salt);
  const pelangganHash = await bcrypt.hash('password123', salt);
  const penjualHash = await bcrypt.hash('password123', salt);

  await query.run(
    `INSERT INTO users (id_user, nama, username, password, role, email, nomor_telepon) VALUES
     (1, 'Administrator SIGARUM', 'admin', ?, 'admin', 'admin@sigarum.id', '+62 811-3456-7890'),
     (2, 'H. Achmad Syafi''i (Garam Makmur)', 'umkm_demo', ?, 'umkm', 'umkm@sigarum.id', '+62 812-3456-7801'),
     (3, 'Siti Fatimah (Pelanggan Madura)', 'pelanggan_demo', ?, 'pelanggan', 'pelanggan@sigarum.id', '+62 852-3321-7789'),
     (4, 'Bapak Mahmudin (Penjual Laut)', 'penjual_demo', ?, 'penjual', 'penjual@sigarum.id', '+62 852-3112-9901')`,
    [adminHash, umkmHash, pelangganHash, penjualHash]
  );

  // 2. Seed Kategori
  const katPath = path.join(dataDir, 'kategori.json');
  if (fs.existsSync(katPath)) {
    const kategoris = JSON.parse(fs.readFileSync(katPath, 'utf8'));
    for (const k of kategoris) {
      await query.run(
        `INSERT OR IGNORE INTO kategori (id_kategori, nama_kategori, slug, deskripsi, warna, icon, badge_bg, badge_text, border_color)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [k.id_kategori, k.nama_kategori, k.slug, k.deskripsi, k.warna, k.icon || 'box', k.badge_bg, k.badge_text, k.border_color]
      );
    }
  }

  // 3. Seed Wilayah
  const wilPath = path.join(dataDir, 'wilayah.json');
  if (fs.existsSync(wilPath)) {
    const wilayahList = JSON.parse(fs.readFileSync(wilPath, 'utf8'));
    for (const w of wilayahList) {
      const centerLat = w.center ? w.center[0] : null;
      const centerLng = w.center ? w.center[1] : null;
      await query.run(
        `INSERT OR IGNORE INTO wilayah (id_wilayah, nama_wilayah, kecamatan, kabupaten, provinsi, tipe_pesisir, deskripsi, center_lat, center_lng, zoom, potensi_utama)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [w.id_wilayah, w.nama_wilayah, w.kecamatan, w.kabupaten, w.provinsi, w.tipe_pesisir, w.deskripsi, centerLat, centerLng, w.zoom || 13, w.potensi_utama]
      );
    }
  }

  // 4. Seed UMKM
  const umkmPath = path.join(dataDir, 'umkm.json');
  if (fs.existsSync(umkmPath)) {
    const umkmList = JSON.parse(fs.readFileSync(umkmPath, 'utf8'));
    for (const u of umkmList) {
      // Validate that id_user exists in users table (currently only users 1 and 2 exist in seed)
      const validUserId = (u.id_user === 1 || u.id_user === 2) ? u.id_user : null;
      await query.run(
        `INSERT OR IGNORE INTO umkm (
          id_umkm, id_user, id_kategori, id_wilayah, nama_umkm, pemilik, alamat, desa, kecamatan, kabupaten, provinsi,
          deskripsi, kontak, latitude, longitude, foto, status, tahun_berdiri, legalitas, jumlah_karyawan, produk_unggulan, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          u.id_umkm,
          validUserId,
          u.id_kategori,
          u.id_wilayah || null,
          u.nama_umkm,
          u.pemilik,
          u.alamat,
          u.desa,
          u.kecamatan,
          u.kabupaten || 'Pamekasan',
          u.provinsi || 'Jawa Timur',
          u.deskripsi,
          u.kontak,
          u.latitude,
          u.longitude,
          u.foto,
          u.status || 'Aktif',
          u.tahun_berdiri || null,
          u.legalitas || null,
          u.jumlah_karyawan || 5,
          JSON.stringify(u.produk_unggulan || []),
          u.created_at || new Date().toISOString()
        ]
      );
    }
  }

  // 5. Seed Produk
  const prodPath = path.join(dataDir, 'produk.json');
  if (fs.existsSync(prodPath)) {
    const prodList = JSON.parse(fs.readFileSync(prodPath, 'utf8'));
    for (const p of prodList) {
      await query.run(
        `INSERT OR IGNORE INTO produk (
          id_produk, id_umkm, id_kategori, nama_produk, kategori, harga, berat, deskripsi, foto, stok_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id_produk,
          p.id_umkm,
          p.id_kategori || null,
          p.nama_produk,
          p.kategori,
          p.harga,
          p.berat,
          p.deskripsi,
          p.foto,
          p.stok_status || 'Tersedia',
          p.created_at || new Date().toISOString()
        ]
      );
    }
  }

  console.log('[SIGARUM Database] Initial demo seed completed successfully!');
}

module.exports = {
  db,
  query,
  initDatabase,
  seedInitialData
};
