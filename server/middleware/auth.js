const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sigarum_secret_key_pamekasan_2026_salt_and_marine_gis';

/**
 * Generate a signed JWT token
 */
function generateToken(user) {
  return jwt.sign(
    {
      id_user: user.id_user,
      username: user.username,
      nama: user.nama,
      role: user.role,
      id_umkm: user.id_umkm || null,
      nama_umkm: user.nama_umkm || null
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Middleware: Require valid JWT token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Akses ditolak. Token otentikasi tidak disediakan.'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Token otentikasi tidak valid atau telah kedaluwarsa.'
      });
    }
    req.user = decodedUser;
    next();
  });
}

/**
 * Middleware: Optional token extraction
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
      if (!err) {
        req.user = decodedUser;
      }
      next();
    });
  } else {
    next();
  }
}

/**
 * Middleware: Require specific role(s) (BR-09, BR-10, BR-11)
 * @param  {...string} allowedRoles ('admin', 'umkm')
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Harap masuk ke sistem terlebih dahulu.'
      });
    }

    const userRole = req.user.role;
    const isAllowed = allowedRoles.includes(userRole) ||
      (allowedRoles.includes('umkm') && userRole === 'penjual') ||
      (allowedRoles.includes('penjual') && userRole === 'umkm');

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        error: `Akses ditolak. Tindakan ini memerlukan peran: [${allowedRoles.join(', ')}]. Peran Anda saat ini: ${req.user.role}.`
      });
    }

    next();
  };
}

module.exports = {
  JWT_SECRET,
  generateToken,
  authenticateToken,
  optionalAuth,
  requireRole
};
