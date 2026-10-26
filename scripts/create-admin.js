/**
 * SIGARUM Admin Provisioning CLI Tool
 * Digunakan untuk membuat akun Administrator pertama atau mengelola akun Admin secara aman.
 * Penggunaan:
 *   node scripts/create-admin.js --nama "Admin Sistem" --username "admin_utama" --password "PasswordKuat123!" --email "admin@sigarum.id"
 */

const path = require('path');
const bcrypt = require('bcryptjs');
const { initDatabase, query } = require('../server/config/db');

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      params[key] = val;
    }
  }
  return params;
}

async function main() {
  try {
    await initDatabase();
    const args = parseArgs();

    const nama = args.nama || 'Administrator SIGARUM';
    const username = args.username || 'admin';
    const password = args.password || 'admin123';
    const email = args.email || 'admin@sigarum.id';
    const telepon = args.telepon || '+62 811-3456-7890';

    if (password.length < 6) {
      console.error('❌ Error: Password minimal harus 6 karakter.');
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const existing = await query.get('SELECT id_user, username, role FROM users WHERE username = ?', [username.trim()]);

    if (existing) {
      await query.run(
        'UPDATE users SET nama = ?, password = ?, role = "admin", email = ?, nomor_telepon = ?, updated_at = CURRENT_TIMESTAMP WHERE id_user = ?',
        [nama.trim(), hashedPassword, email.trim(), telepon.trim(), existing.id_user]
      );
      console.log(`✅ Sukses: Akun admin '${username}' berhasil diperbarui dengan kredensial baru.`);
    } else {
      const result = await query.run(
        'INSERT INTO users (nama, username, password, role, email, nomor_telepon) VALUES (?, ?, ?, "admin", ?, ?)',
        [nama.trim(), username.trim(), hashedPassword, email.trim(), telepon.trim()]
      );
      console.log(`✅ Sukses: Akun admin baru berhasil dibuat dengan ID [${result.lastID}] dan username '${username}'.`);
    }

    console.log(`\nDetail Akun Admin:`);
    console.log(`- Nama:     ${nama}`);
    console.log(`- Username: ${username}`);
    console.log(`- Role:     admin (Administrator Penuh Marketplace)`);
    console.log(`- Email:    ${email}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Gagal membuat akun admin:', err.message);
    process.exit(1);
  }
}

main();
