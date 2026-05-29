const Kendaraan = require('../services/Kendaraan');
const User = require('../services/User');

// GET /api/kendaraan — semua kendaraan aktif
const getAll = async (req, res) => {
  try {
    const data = await Kendaraan.findAll({
      where: { status: 'aktif' },
      include: [{ model: User, attributes: ['id', 'nama', 'no_hp', 'rating'] }],
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/kendaraan/:id
const getById = async (req, res) => {
  try {
    const data = await Kendaraan.findByPk(req.params.id, {
      include: [{ model: User, attributes: ['id', 'nama', 'no_hp', 'rating'] }],
    });
    if (!data) return res.status(404).json({ message: 'Kendaraan tidak ditemukan' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/kendaraan — tambah kendaraan
const create = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user.sim_verified) {
      return res.status(403).json({ 
        message: 'Anda belum bisa menjadi host. Harap verifikasi SIM/STNK terlebih dahulu.' 
      });
    }

    const { nama_kendaraan, plat_nomor, kapasitas, titik_kumpul, tanggal_berangkat, jam_berangkat, harga_per_kursi } = req.body;
    
    if (!nama_kendaraan || !plat_nomor || !kapasitas || !titik_kumpul || !jam_berangkat) {
      return res.status(400).json({ message: 'Semua field wajib diisi kecuali tanggal' });
    }

    const harga = harga_per_kursi !== undefined ? parseInt(harga_per_kursi) : 0;
    const kendaraan = await Kendaraan.create({
      user_id: req.user.id,
      nama_kendaraan, 
      plat_nomor, 
      kapasitas, 
      titik_kumpul, 
      tanggal_berangkat, 
      jam_berangkat, 
      harga_per_kursi: harga
    });

    res.status(201).json({ 
      message: 'Berhasil menjadi Host Carpool!', 
      kendaraan 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/kendaraan/:id
const update = async (req, res) => {
  try {
    const kendaraan = await Kendaraan.findByPk(req.params.id);
    if (!kendaraan) return res.status(404).json({ message: 'Tidak ditemukan' });
    if (req.user.role !== 'admin' && kendaraan.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Bukan kendaraan kamu' });
    }
    await kendaraan.update(req.body);
    res.json({ message: 'Kendaraan diupdate', kendaraan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/kendaraan/:id
const remove = async (req, res) => {
  try {
    const kendaraan = await Kendaraan.findByPk(req.params.id);
    if (!kendaraan) return res.status(404).json({ message: 'Tidak ditemukan' });
    if (req.user.role !== 'admin' && kendaraan.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Bukan kendaraan kamu' });
    }
    await kendaraan.destroy();
    res.json({ message: 'Kendaraan dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAll, getById, create, update, remove };