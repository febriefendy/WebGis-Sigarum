require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { initDatabase, seedInitialData, query } = require('./config/db');
const upload = require('./middleware/upload');
const { authenticateToken, requireRole } = require('./middleware/auth');

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files: Serve uploads and web frontend files
const rootDir = path.join(__dirname, '..');
const uploadsDir = path.join(rootDir, 'uploads');
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(rootDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'SIGARUM WebGIS Full-Stack Backend Engine',
    version: '2.0.0',
    spatial_engine: 'SQLite3 / PostGIS compatible',
    srid: 4326,
    timestamp: new Date().toISOString()
  });
});

// Mount Modular API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/umkm', require('./routes/umkm'));
app.use('/api/produk', require('./routes/produk'));
app.use('/api/kategori', require('./routes/kategori'));
app.use('/api/wilayah', require('./routes/wilayah'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/spatial', require('./routes/spatial'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/seller', require('./routes/seller'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/settings', require('./routes/settings'));

// Upload File Endpoint
app.post('/api/upload', upload.single('foto'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Tidak ada berkas yang diunggah.' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      message: 'Berkas berhasil diunggah.',
      filename: req.file.filename,
      url: fileUrl,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal mengunggah berkas.' });
  }
});

// Reset Demo Data Endpoint
app.post('/api/demo/reset', async (req, res) => {
  try {
    console.log('[SIGARUM API] Resetting database to default demo seed state...');
    await query.exec(`
      DELETE FROM produk;
      DELETE FROM umkm;
      DELETE FROM wilayah;
      DELETE FROM kategori;
      DELETE FROM users;
      DELETE FROM audit_logs;
    `);
    await seedInitialData();
    res.json({
      success: true,
      message: 'Seluruh data demo SIGARUM berhasil dikembalikan ke kondisi awal pabrikan.'
    });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ success: false, error: 'Gagal mereset data demo.' });
  }
});

// Fallback 404 for unhandled API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: `Endpoint API "${req.originalUrl}" tidak ditemukan.` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Terjadi kesalahan internal pada server SIGARUM.'
  });
});

// Start Server after Database Initialization
async function startServer() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🌊 SIGARUM WebGIS Full-Stack Server Running!`);
    console.log(`🌐 Local Web Server & API: http://localhost:${PORT}`);
    console.log(`📍 WebGIS Interactive Map: http://localhost:${PORT}/peta.html`);
    console.log(`🛡️ Admin Dashboard:        http://localhost:${PORT}/admin/dashboard.html`);
    console.log(`📊 API Health Endpoint:   http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
