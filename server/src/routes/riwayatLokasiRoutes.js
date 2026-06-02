const router = require('express').Router();
const RiwayatLokasi = require('../services/RiwayatLokasi');

router.get('/', async (req, res) => {
  try {
    const data = await RiwayatLokasi.find({ latitude: { $ne: null }, longitude: { $ne: null } })
      .sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:kendaraanId', async (req, res) => {
  try {
    const data = await RiwayatLokasi.find({
      kendaraan_id: parseInt(req.params.kendaraanId, 10),
      latitude: { $ne: null },
      longitude: { $ne: null }
    }).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;