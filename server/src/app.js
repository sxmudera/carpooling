const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectMySQL } = require('./config/database');
const connectMongo = require('./config/mongo');


const app = express();

// Koneksi DB
connectMySQL();
connectMongo();

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

const userClientDir = path.join(__dirname, '../..', 'client-user');
const adminClientDir = path.join(__dirname, '../..', 'client-admin');

// Serve frontend statis terpisah (user vs admin).
app.use('/admin', express.static(adminClientDir));
app.use(express.static(userClientDir));
// API Routes
app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/users',     require('./routes/userRoutes'));
app.use('/api/sim-verifications', require('./routes/simVerificationRoutes'));
app.use('/api/kendaraan', require('./routes/kendaraanRoutes'));
app.use('/api/booking',   require('./routes/bookingRoutes'));
app.use('/api/lokasi',    require('./routes/lokasiRoutes'));
app.use('/api/rating',    require('./routes/ratingRoutes'));
app.use('/api/riwayat-lokasi', require('./routes/riwayatLokasiRoutes'));
app.use('/api/tracking-log', require('./routes/trackingLogRoutes'));

app.get('/admin', (req, res) => {
  res.sendFile(path.join(adminClientDir, 'index.html'));
});

// Semua route non-api → frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(userClientDir, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error di server', error: err.message });
});

module.exports = app;