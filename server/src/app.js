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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend statis
app.use(express.static(path.join(__dirname, '../../..', 'client')));

app.use(express.static(path.resolve(__dirname, '../../client')));
// API Routes
app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/users',     require('./routes/userRoutes'));
app.use('/api/kendaraan', require('./routes/kendaraanRoutes'));
app.use('/api/booking',   require('./routes/bookingRoutes'));
app.use('/api/lokasi',    require('./routes/lokasiRoutes'));
app.use('/api/rating',    require('./routes/ratingRoutes'));

// Semua route non-api → frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../..', 'client', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error di server', error: err.message });
});

module.exports = app;