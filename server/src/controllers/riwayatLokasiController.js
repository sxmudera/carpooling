const RiwayatLokasi =
require('../services/RiwayatLokasi');

const getAll = async (req, res) => {
  try {
    const data =
      await RiwayatLokasi.find()
      .sort({ mulai: -1 });

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

module.exports = {
  getAll
};