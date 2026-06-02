const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectMySQL } = require('./config/database');
const connectMongo = require('./config/mongo');

const app = express();
const isDev = process.env.NODE_ENV !== 'production';

// Koneksi DB
connectMySQL();
connectMongo();

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/sim-verifications', require('./routes/simVerificationRoutes'));
app.use('/api/kendaraan', require('./routes/kendaraanRoutes'));
app.use('/api/booking', require('./routes/bookingRoutes'));
app.use('/api/lokasi', require('./routes/lokasiRoutes'));
app.use('/api/rating', require('./routes/ratingRoutes'));
app.use('/api/riwayat-lokasi', require('./routes/riwayatLokasiRoutes'));
app.use('/api/tracking-log', require('./routes/trackingLogRoutes'));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'carpooling-api' });
});

// Lokal saja: serve frontend dari folder client-* (Cloud Run tidak pakai ini)
if (isDev) {
  const userClientDir = path.join(__dirname, '../..', 'client-user');
  const adminClientDir = path.join(__dirname, '../..', 'client-admin');
  app.use('/admin', express.static(adminClientDir));
  app.use(express.static(userClientDir));
  app.get('/admin', (req, res) => {
    res.sendFile(path.join(adminClientDir, 'index.html'));
  });
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: 'Endpoint API tidak ditemukan' });
    }
    res.sendFile(path.join(userClientDir, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      message: 'Carpooling API. Frontend di App Engine (user & admin).',
      health: '/api/health',
    });
  });
  app.use((req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: 'Endpoint API tidak ditemukan' });
    }
    res.status(404).json({
      message: 'Halaman tidak ditemukan. Gunakan URL App Engine untuk frontend.',
    });
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error di server', error: err.message });
});

module.exports = app;
