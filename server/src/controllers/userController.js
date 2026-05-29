const User = require('../services/User');
const SimStnk = require('../services/SimStnk');

const getUsers = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const users = await User.findAll({ attributes: { exclude: ['password'] } });
      return res.json(users);
    }
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users/:id — admin only
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/:id — update profil sendiri
const updateUser = async (req, res) => {
  try {
    const { nama, no_hp } = req.body;
    // user hanya boleh update diri sendiri, kecuali admin
    if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ message: 'Tidak boleh update user lain' });
    }
    await User.update({ nama, no_hp }, { where: { id: req.params.id } });
    res.json({ message: 'Profil diupdate' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/users/:id — admin only
const deleteUser = async (req, res) => {
  try {
    await User.destroy({ where: { id: req.params.id } });
    res.json({ message: 'User dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const uploadSimStnk = async (req, res) => {
  try {
    const { jenis, nomor } = req.body;
    if (!jenis || !nomor) return res.status(400).json({ message: 'Jenis dan nomor wajib' });

    const doc = await SimStnk.create({ user_id: req.user.id, jenis, nomor });
    res.status(201).json({ message: 'Dokumen SIM/STNK dikirim, menunggu verifikasi admin', doc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/sim-stnk/:id/verifikasi (Admin)
const verifikasiSimStnk = async (req, res) => {
  try {
    const { status_verifikasi } = req.body;
    if (!['terverifikasi', 'ditolak'].includes(status_verifikasi)) {
      return res.status(400).json({ message: 'Status harus terverifikasi atau ditolak' });
    }

    const sim = await SimStnk.findByPk(req.params.id);
    if (!sim) return res.status(404).json({ message: 'Dokumen tidak ditemukan' });

    await sim.update({ status_verifikasi });

    // Jika terverifikasi → update user
    if (status_verifikasi === 'terverifikasi') {
      await User.update({ sim_verified: true }, { where: { id: sim.user_id } });
    }

    res.json({ message: `Dokumen ${status_verifikasi}. Status SIM user telah diupdate.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getUsers, getUserById, updateUser, deleteUser, uploadSimStnk, verifikasiSimStnk };
