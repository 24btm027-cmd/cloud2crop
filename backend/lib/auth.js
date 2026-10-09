/**
 * JWT auth middleware – reads Authorization: Bearer <token>
 * Falls back to cookie 'c2c_token' for httpOnly cookie sessions.
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = () => process.env.JWT_SECRET || 'dev-secret-change-me';

function signToken(payload, expiresIn = '30d') {
  return jwt.sign(payload, JWT_SECRET(), { expiresIn });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET());
}

/**
 * Express middleware – attaches req.user or returns 401.
 */
function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    const cookie = req.cookies?.c2c_token;
    const token = (header && header.startsWith('Bearer ') ? header.slice(7) : null) || cookie;
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session. Please log in again.' });
  }
}

/**
 * Middleware – requires admin role.
 */
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
    next();
  });
}

/**
 * Ownership check helper – returns 403 if userId doesn't match req.user.id
 */
function checkOwnership(req, userId) {
  const uid = String(userId);
  const rid = String(req.user.id || req.user._id);
  if (uid !== rid && req.user.role !== 'admin') {
    return false;
  }
  return true;
}

module.exports = { signToken, verifyToken, requireAuth, requireAdmin, checkOwnership };
