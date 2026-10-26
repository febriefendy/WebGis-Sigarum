const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

/**
 * GET /api/payments/order/:orderId
 * Get payment information and instructions
 */
router.get('/order/:orderId', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await query.get('SELECT * FROM orders WHERE id_order = ?', [orderId]);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan.' });
    }

    // Ownership check
    if (req.user.role === 'pelanggan' && order.id_pembeli !== req.user.id_user) {
      return res.status(403).json({ success: false, error: 'Akses ditolak.' });
    }

    const payment = await query.get('SELECT * FROM payments WHERE id_order = ? ORDER BY id_payment DESC LIMIT 1', [orderId]);

    res.json({
      success: true,
      data: {
        order,
        payment,
        instructions: {
          qris_qr_image: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=600&q=80',
          rekening_bank: [
            { bank: 'Bank Mandiri', no_rek: '144-00-1928374-1', atas_nama: 'SIGARUM E-Commerce Pamekasan' },
            { bank: 'Bank BRI', no_rek: '0061-01-098765-53-2', atas_nama: 'SIGARUM E-Commerce Pamekasan' },
            { bank: 'Bank Jatim', no_rek: '028-100-29384', atas_nama: 'SIGARUM Pesisir Madura' }
          ]
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal mengambil data pembayaran.' });
  }
});

/**
 * POST /api/payments/upload-receipt
 * Buyer uploads transfer receipt slip
 */
const handleUploadReceipt = async (req, res) => {
  try {
    const id_order = req.body.id_order || req.params.orderId;

    if (!id_order) {
      return res.status(400).json({ success: false, error: 'ID pesanan wajib disertakan.' });
    }
    const { catatan } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Berkas bukti transfer wajib diunggah.' });
    }

    const order = await query.get('SELECT id_order, id_pembeli, status_pembayaran FROM orders WHERE id_order = ?', [id_order]);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan.' });
    }

    if (order.id_pembeli !== req.user.id_user && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Akses ditolak.' });
    }

    const receiptUrl = `/uploads/${req.file.filename}`;

    await query.run(`
      UPDATE payments
      SET bukti_transfer = ?,
          status = 'Menunggu_Verifikasi',
          catatan_verifikasi = ?
      WHERE id_order = ?
    `, [receiptUrl, catatan || 'Bukti transfer diunggah oleh pembeli.', id_order]);

    await query.run('UPDATE orders SET status_pembayaran = "Menunggu_Verifikasi", updated_at = CURRENT_TIMESTAMP WHERE id_order = ?', [id_order]);

    res.json({
      success: true,
      message: 'Bukti pembayaran berhasil diunggah. Tim Administrator akan segera memverifikasi transaksi Anda.',
      receipt_url: receiptUrl
    });
  } catch (err) {
    console.error('Upload receipt error:', err);
    res.status(500).json({ success: false, error: 'Gagal mengunggah bukti pembayaran.' });
  }
};

router.post('/upload-receipt', authenticateToken, upload.single('bukti'), handleUploadReceipt);
router.post('/upload-receipt/:orderId', authenticateToken, upload.single('bukti'), handleUploadReceipt);

/**
 * POST /api/payments/verify/:paymentId
 * Admin strictly verifies manual payment and marks order as Dibayar
 */
router.post('/verify/:paymentId', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { action, catatan } = req.body; // 'setujui' atau 'tolak'
    const paymentId = req.params.paymentId;

    const payment = await query.get('SELECT * FROM payments WHERE id_payment = ?', [paymentId]);
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Data pembayaran tidak ditemukan.' });
    }

    if (action === 'setujui') {
      // 1. Update Payment status
      await query.run(`
        UPDATE payments
        SET status = 'Berhasil',
            diverifikasi_oleh = ?,
            diverifikasi_pada = CURRENT_TIMESTAMP,
            catatan_verifikasi = ?
        WHERE id_payment = ?
      `, [req.user.id_user, catatan || 'Pembayaran telah diverifikasi valid oleh Admin.', paymentId]);

      // 2. Update Master Order to Dibayar & Diproses
      await query.run(`
        UPDATE orders
        SET status_pembayaran = 'Dibayar',
            status_pesanan = 'Diproses',
            updated_at = CURRENT_TIMESTAMP
        WHERE id_order = ?
      `, [payment.id_order]);

      // 3. Update all Sub-Orders for sellers to start processing
      await query.run(`
        UPDATE sub_orders
        SET status_pesanan = 'Diproses',
            updated_at = CURRENT_TIMESTAMP
        WHERE id_order = ?
      `, [payment.id_order]);

      // Audit log
      await query.run(`
        INSERT INTO audit_logs (id_user, action, entity, entity_id, details)
        VALUES (?, 'VERIFY_PAYMENT', 'payments', ?, ?)
      `, [req.user.id_user, paymentId, `Disetujui. Order ID: ${payment.id_order}, Nominal: ${payment.jumlah_bayar}`]);

      return res.json({
        success: true,
        message: 'Pembayaran berhasil diverifikasi. Pesanan kini diteruskan ke masing-masing penjual untuk diproses.'
      });
    } else {
      // Tolak Pembayaran
      await query.run(`
        UPDATE payments
        SET status = 'Ditolak',
            diverifikasi_oleh = ?,
            diverifikasi_pada = CURRENT_TIMESTAMP,
            catatan_verifikasi = ?
        WHERE id_payment = ?
      `, [req.user.id_user, catatan || 'Bukti transfer tidak valid atau dana belum masuk.', paymentId]);

      await query.run(`
        UPDATE orders
        SET status_pembayaran = 'Gagal',
            updated_at = CURRENT_TIMESTAMP
        WHERE id_order = ?
      `, [payment.id_order]);

      return res.json({
        success: true,
        message: 'Pembayaran ditolak dengan catatan yang tercatat.'
      });
    }
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ success: false, error: 'Gagal memproses verifikasi pembayaran.' });
  }
});

/**
 * POST /api/payments/webhook
 * Automated Idempotent Payment Gateway Webhook
 */
router.post('/webhook', async (req, res) => {
  try {
    const { nomor_referensi, status, signature, amount } = req.body;

    if (!nomor_referensi) {
      return res.status(400).json({ success: false, error: 'Nomor referensi pembayaran wajib disertakan.' });
    }

    const payment = await query.get('SELECT * FROM payments WHERE nomor_referensi = ?', [nomor_referensi]);
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Transaksi tidak ditemukan.' });
    }

    // Idempotency check: if already settled, return 200 immediately
    if (payment.status === 'Berhasil') {
      return res.json({ success: true, message: 'Transaksi telah diproses sebelumnya (Idempotent).' });
    }

    if (status === 'settlement' || status === 'paid' || status === 'success') {
      await query.run(`
        UPDATE payments
        SET status = 'Berhasil',
            diverifikasi_pada = CURRENT_TIMESTAMP,
            catatan_verifikasi = 'Notifikasi Gateway Berhasil (Auto Webhook)'
        WHERE id_payment = ?
      `, [payment.id_payment]);

      await query.run(`
        UPDATE orders
        SET status_pembayaran = 'Dibayar',
            status_pesanan = 'Diproses',
            updated_at = CURRENT_TIMESTAMP
        WHERE id_order = ?
      `, [payment.id_order]);

      await query.run(`
        UPDATE sub_orders
        SET status_pesanan = 'Diproses',
            updated_at = CURRENT_TIMESTAMP
        WHERE id_order = ?
      `, [payment.id_order]);
    }

    res.json({ success: true, message: 'Webhook transaksi berhasil diproses.' });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ success: false, error: 'Gagal memproses notifikasi pembayaran.' });
  }
});

module.exports = router;
