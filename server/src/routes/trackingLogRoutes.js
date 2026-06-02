const router = require('express').Router();
const TrackingEvent = require('../services/TrackingEvent');

router.get('/', async(req,res)=>{
    res.json(await TrackingEvent.find({ aktivitas: { $ne: null } }).sort({ createdAt: -1 }));
});

module.exports = router;