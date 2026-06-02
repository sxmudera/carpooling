const router = require('express').Router();
const TrackingEvent = require('../services/TrackingEvent');

router.get('/:kendaraanId', async (req,res)=>{
    const data = await TrackingEvent.find({
        kendaraan_id: parseInt(req.params.kendaraanId, 10),
        latitude: { $ne: null },
        longitude: { $ne: null }
    }).sort({createdAt:-1});

    res.json(data);
});

module.exports = router;