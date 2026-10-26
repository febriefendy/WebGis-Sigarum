const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * GET /api/settings
 * Public platform settings and policies
 */
router.get('/', async (req, res) => {
  try {
    const rows = await query.all('SELECT key_name, value_text, keterangan FROM platform_settings');
    const settings = {};
    rows.forEach(r => { settings[r.key_name] = r.value_text; });
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal mengambil pengaturan aplikasi.' });
  }
});

/**
 * GET /api/settings/admin
 * Admin list all settings and audit logs
 */
router.get('/admin', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const settings = await query.all('SELECT * FROM platform_settings ORDER BY key_name ASC');
    const logs = await query.all(`
      SELECT al.*, u.nama as nama_user, u.username
      FROM audit_logs al
      LEFT JOIN users u ON al.id_user = u.id_user
      ORDER BY al.id_log DESC LIMIT 50
    `);

    res.json({ success: true, settings, audit_logs: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal memuat pengaturan admin.' });
  }
});

/**
 * PUT /api/settings/:key
 * Admin update setting value
 */
router.put('/:key', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { value_text, keterangan } = req.body;
    const key = req.params.key;

    await query.run(`
      INSERT INTO platform_settings (key_name, value_text, keterangan, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key_name) DO UPDATE SET
        value_text = excluded.value_text,
        keterangan = COALESCE(excluded.keterangan, platform_settings.keterangan),
        updated_at = CURRENT_TIMESTAMP
    `, [key, value_text, keterangan || null]);

    // Record in audit log
    await query.run(`
      INSERT INTO audit_logs (id_user, action, entity, details)
      VALUES (?, 'UPDATE_SETTING', 'platform_settings', ?)
    `, [req.user.id_user, `Key: ${key}, Value: ${value_text}`]);

    res.json({ success: true, message: `Pengaturan '${key}' berhasil diperbarui.` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal memperbarui pengaturan.' });
  }
});

module.exports = router;
