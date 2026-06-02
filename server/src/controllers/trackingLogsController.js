const TrackingLog =
require('../services/TrackingLog');

const getAll = async (req, res) => {
  try {
    const data =
      await TrackingLog.find()
      .sort({ createdAt: -1 });

    res.json(data);
  }
  catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

module.exports = {
  getAll
};