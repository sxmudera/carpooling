const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../services/User');

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { nama, email, password, no_hp } = req.body;
    if (!nama || !email || !password) {
      return res.status(400).json({ message: 'Nama, email, dan password wajib diisi' });
    }

    const sudahAda = await User.findOne({ where: { email } });
    if (sudahAda) return res.status(400).json({ message: 'Email sudah terdaftar' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ nama, email, password: hash, no_hp });

    res.status(201).json({ message: 'Registrasi berhasil', user: { id: user.id, nama: user.nama, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Gagal register', error: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email dan password wajib' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    const cocok = await bcrypt.compare(password, user.password);
    if (!cocok) return res.status(401).json({ message: 'Password salah' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({ message: 'Login berhasil', token, role: user.role, nama: user.nama });
  } catch (err) {
    res.status(500).json({ message: 'Gagal login', error: err.message });
  }
};

module.exports = { register, login };
