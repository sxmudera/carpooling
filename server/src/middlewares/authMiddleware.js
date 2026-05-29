const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Token tidak ada' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Format token salah, pakai Bearer <token>' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token tidak valid atau sudah expired' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Akses ditolak, hanya untuk admin' });
  }
  next();
};

module.exports = { authMiddleware, adminOnly };
