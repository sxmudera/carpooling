const API = window.API_BASE_URL || '/api';
const ADMIN_BASE_URL = window.ADMIN_BASE_URL || '/admin';

// ─── HELPERS ────────────────────────────────────────────────────────────────

function getToken() { return localStorage.getItem('token'); }
function getRole()  { return localStorage.getItem('role'); }
function getNama()  { return localStorage.getItem('nama'); }
function getUserId(){ return parseInt(localStorage.getItem('user_id') || '0'); }

function showAlert(id, msg, type = 'info') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = `alert ${type}`;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

async function apiFetch(path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  const token = getToken();
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body)  opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  const raw = await res.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch (e) {
    data = { message: raw || 'Respons server tidak valid' };
  }
  if (!res.ok) {
    return { ...data, ok: false, status: res.status };
  }
  return data;
}

function badgeHtml(status) {
  return `<span class="badge ${status}">${status}</span>`;
}

function bintangHtml(nilai) {
  return '★'.repeat(nilai) + '☆'.repeat(5 - nilai);
}

// ─── ROUTING / PAGES ─────────────────────────────────────────────────────────

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById(pageId);
  if (el) el.classList.add('active');
}

function updateNav() {
  const loggedIn = !!getToken();
  
  document.getElementById('btn-logout').style.display = loggedIn ? 'inline-block' : 'none';
  document.getElementById('nav-home').style.display = loggedIn ? 'none' : 'inline';

  if (loggedIn) {
    document.getElementById('nav-kendaraan').style.display = 'inline';
    document.getElementById('nav-booking').style.display   = 'inline';
    document.getElementById('nav-host').style.display      = 'inline';
    document.getElementById('nav-profil').style.display    = 'inline';
    document.getElementById('nav-admin').style.display     = 'none';
  } else {
    ['nav-kendaraan','nav-booking','nav-host','nav-profil','nav-admin'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email    = document.getElementById('login-email').value;
  const password = document.getElementById('login-pass').value;
  const data = await apiFetch('/auth/login', 'POST', { email, password });
  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('role',  data.role);
    localStorage.setItem('nama',  data.nama);
    localStorage.setItem('user_id', data.id ? String(data.id) : '');
    if (data.role === 'admin') {
      window.location.href = ADMIN_BASE_URL;
      return;
    }
    updateNav();
    showPage('page-kendaraan'); loadKendaraan();
  } else {
    showAlert('alert-login', data.message || 'Login gagal', 'error');
  }
});

document.getElementById('form-register').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nama     = document.getElementById('reg-nama').value;
  const email    = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-pass').value;
  const no_hp    = document.getElementById('reg-hp').value;
  const data = await apiFetch('/auth/register', 'POST', { nama, email, password, no_hp });
  if (data.message === 'Registrasi berhasil') {
    showAlert('alert-register', 'Berhasil! Silakan login sekarang.', 'success');
    document.getElementById('form-register').reset();
  } else {
    showAlert('alert-register', data.message || 'Gagal register', 'error');
  }
});

document.getElementById('btn-logout').addEventListener('click', () => {
  stopShareLocation();
  localStorage.clear();
  updateNav();
  showPage('page-home');
});

// ─── KENDARAAN (User) ────────────────────────────────────────────────────────

async function loadKendaraan() {
  const data = await apiFetch('/kendaraan');
  const container = document.getElementById('list-kendaraan');
  if (!Array.isArray(data) || data.length === 0) {
    container.innerHTML = '<p class="empty-msg">Belum ada carpooling.</p>';
    return;
  }
  container.innerHTML = data.map(k => {
    const harga = k.harga_per_kursi === 0
      ? '<span style="color:#16a34a; font-weight:700;">GRATIS 🎉</span>'
      : `Rp ${k.harga_per_kursi.toLocaleString('id-ID')}/kursi`;
    const tgl = k.tanggal_berangkat ? `<p>📅 Tanggal: <b>${k.tanggal_berangkat}</b></p>` : '';
    return `
    <div class="card">
      <h3>🚗 ${k.nama_kendaraan}</h3>
      <p>📍 Titik Kumpul: <b>${k.titik_kumpul}</b></p>
      ${tgl}
      <p>🕐 Jam Berangkat: <b>${k.jam_berangkat}</b></p>
      <p>💺 Kapasitas: ${k.kapasitas} kursi</p>
      <p>👤 Driver: ${k.User ? k.User.nama : '-'}</p>
      <p>📞 HP: ${k.User ? (k.User.no_hp || '-') : '-'}</p>
      <p>⭐ Rating: ${k.User ? (k.User.rating || '0') : '0'}/5</p>
      <p class="harga">${harga}</p>
      ${getToken() ? `
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button onclick="showFormBooking(${k.id}, ${k.harga_per_kursi}, '${k.nama_kendaraan}', '${k.jam_berangkat}', '${k.tanggal_berangkat || ''}')">Booking Sekarang</button>
          <button class="outline" onclick="pantauRute(${k.id}, '${k.nama_kendaraan}')">🗺️ Pantau Rute</button>
        </div>` : ''}
    </div>`;
  }).join('');
}

// ─── TAMBAH KENDARAAN (driver) ──────────────────────────────────────────

document.getElementById('form-kendaraan').addEventListener('submit', async (e) => {
  e.preventDefault();
  const hargaVal = document.getElementById('k-harga').value;
  const body = {
    nama_kendaraan:   document.getElementById('k-nama').value,
    plat_nomor:       document.getElementById('k-plat').value,
    kapasitas:        parseInt(document.getElementById('k-kapasitas').value),
    titik_kumpul:     document.getElementById('k-titik').value,
    tanggal_berangkat: document.getElementById('k-tanggal').value || null,
    jam_berangkat:    document.getElementById('k-jam').value,
    harga_per_kursi:  hargaVal === '' ? 0 : parseInt(hargaVal),
  };
  const data = await apiFetch('/kendaraan', 'POST', body);
  if (data.kendaraan) {
    const latVal = parseFloat(document.getElementById('lokasi-lat')?.value || '');
    const lngVal = parseFloat(document.getElementById('lokasi-lng')?.value || '');
    const namaTitik = document.getElementById('k-titik')?.value;
    if (Number.isFinite(latVal) && Number.isFinite(lngVal) && namaTitik) {
      await apiFetch('/lokasi', 'POST', {
        kendaraan_id: data.kendaraan.id,
        nama_titik: namaTitik,
        latitude: latVal,
        longitude: lngVal
      });
    }
    showAlert('alert-kendaraan', 'Kendaraan berhasil ditambahkan!', 'success');
    document.getElementById('form-kendaraan').reset();
    document.getElementById('lokasi-lat') && (document.getElementById('lokasi-lat').value = '');
    document.getElementById('lokasi-lng') && (document.getElementById('lokasi-lng').value = '');
    loadKendaraan();
    loadMyKendaraan();
  } else {
    showAlert('alert-kendaraan', data.message || 'Gagal', 'error');
  }
});

async function loadMyKendaraan() {
  const allK  = await apiFetch('/kendaraan');
  if (!Array.isArray(allK)) return;
  let myId = getUserId();
  if (!myId) {
    const me = await apiFetch('/users');
    myId = me && me.id ? parseInt(me.id) : 0;
    if (myId) localStorage.setItem('user_id', String(myId));
  }
  const myK  = allK.filter(k => k.user_id === myId);
  const tb   = document.getElementById('my-kendaraan-body');
  if (!tb) return;
  if (myK.length === 0) { tb.innerHTML = '<tr><td colspan="6" class="empty-msg">Belum ada kendaraanmu.</td></tr>'; return; }
  tb.innerHTML = myK.map(k => `
    <tr>
      <td>${k.nama_kendaraan}</td>
      <td>${k.plat_nomor}</td>
      <td>${k.titik_kumpul}</td>
      <td>${k.tanggal_berangkat || '-'}</td>
      <td>${k.jam_berangkat}</td>
      <td>
        <button class="action-btn danger" onclick="hapusKendaraan(${k.id})">Hapus</button>
      </td>
    </tr>
  `).join('');
}

async function hapusKendaraan(id) {
  if (!confirm('Yakin hapus kendaraan ini?')) return;
  const data = await apiFetch(`/kendaraan/${id}`, 'DELETE');
  alert(data.message);
  loadKendaraan();
  loadMyKendaraan();
}
window.hapusKendaraan = hapusKendaraan;

// ─── BOOKING ─────────────────────────────────────────────────────────────────

function showFormBooking(kendaraanId, harga, nama, jam, tanggal) {
  if (!getToken()) { showPage('page-home'); return; }
  document.getElementById('booking-kendaraan-id').value = kendaraanId;
  // Tanggal diambil dari data kendaraan (host), bukan input user
  document.getElementById('booking-tanggal').value = tanggal || '';
  const hargaStr = harga === 0 ? 'GRATIS' : `Rp ${harga.toLocaleString('id-ID')}/kursi`;
  document.getElementById('booking-kendaraan-nama').textContent = `Booking: ${nama} — ${hargaStr}`;
  document.getElementById('booking-jam-info').textContent = `🕐 Jam berangkat: ${jam}${tanggal ? '  📅 ' + tanggal : ''}`;
  document.getElementById('booking-form-section').style.display = 'block';
  document.getElementById('booking-form-section').scrollIntoView({ behavior: 'smooth' });
}
window.showFormBooking = showFormBooking;

document.getElementById('form-booking').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    kendaraan_id: parseInt(document.getElementById('booking-kendaraan-id').value),
    jumlah_kursi: parseInt(document.getElementById('booking-kursi').value),
  };
  const data = await apiFetch('/booking', 'POST', body);
  if (data.booking) {
    showAlert('alert-booking', 'Booking berhasil! Status: pending.', 'success');
    document.getElementById('form-booking').reset();
    document.getElementById('booking-form-section').style.display = 'none';
    loadMyBooking();
  } else {
    showAlert('alert-booking', data.message || 'Gagal booking', 'error');
  }
});

async function loadMyBooking() {
  const data = await apiFetch('/booking');
  const tb   = document.getElementById('my-booking-body');
  if (!tb) return;
  if (!Array.isArray(data) || data.length === 0) {
    tb.innerHTML = '<tr><td colspan="7" class="empty-msg">Belum ada booking.</td></tr>';
    return;
  }

  const rows = await Promise.all(data.map(async b => {
    const harga = b.total_harga === 0 ? 'GRATIS' : `Rp ${b.total_harga.toLocaleString('id-ID')}`;
    const jam = b.Kendaraan ? b.Kendaraan.jam_berangkat : '-';
    let ratingBtn = '';
    if (b.status === 'selesai') {
      const cek = await apiFetch(`/rating/check/${b.id}`);
      ratingBtn = cek.sudah_rating
        ? `<span style="color:#f59e0b;">★ Sudah dirating (${cek.rating.nilai}/5)</span>`
        : `<button class="action-btn success" onclick="showFormRating(${b.id}, ${b.Kendaraan ? b.Kendaraan.user_id : 0})">⭐ Beri Rating</button>`;
    }
    return `
      <tr>
        <td>${b.id}</td>
        <td>${b.Kendaraan ? b.Kendaraan.nama_kendaraan : '-'}</td>
        <td>${b.tanggal}</td>
        <td>${jam}</td>
        <td>${harga}</td>
        <td>${badgeHtml(b.status)}</td>
        <td style="display:flex; gap:4px; flex-wrap:wrap;">
          ${b.status === 'pending' ? `<button class="action-btn danger" onclick="batalBooking(${b.id})">Batal</button>` : ''}
          ${b.status === 'konfirmasi' && b.total_harga > 0 ? `<button class="action-btn success" onclick="bayarBooking(${b.id})">Bayar</button>` : ''}
          ${b.status === 'konfirmasi' ? `<button class="outline" onclick="pantauRute(${b.kendaraan_id}, '')">🗺️ Pantau</button>` : ''}
          ${ratingBtn}
        </td>
      </tr>`;
  }));
  tb.innerHTML = rows.join('');
}

async function batalBooking(id) {
  if (!confirm('Batalkan booking ini?')) return;
  const data = await apiFetch(`/booking/${id}/batal`, 'PUT');
  alert(data.message);
  loadMyBooking();
}
window.batalBooking = batalBooking;

async function bayarBooking(id) {
  const metode = prompt('Metode bayar? (cash / transfer / dompet_digital)', 'cash');
  if (!metode) return;
  const data = await apiFetch(`/booking/${id}/bayar`, 'POST', { metode });
  alert(data.message || 'Pembayaran berhasil');
  loadMyBooking();
}
window.bayarBooking = bayarBooking;

// ─── RATING ──────────────────────────────────────────────────────────────────

function showFormRating(bookingId, driverUserId) {
  document.getElementById('rating-booking-id').value   = bookingId;
  document.getElementById('rating-driver-id').value    = driverUserId;
  document.getElementById('rating-modal').style.display = 'flex';
}
window.showFormRating = showFormRating;

document.getElementById('btn-tutup-rating').addEventListener('click', () => {
  document.getElementById('rating-modal').style.display = 'none';
});

document.getElementById('form-rating').addEventListener('submit', async (e) => {
  e.preventDefault();
  const booking_id = parseInt(document.getElementById('rating-booking-id').value);
  const nilai      = parseInt(document.getElementById('rating-nilai').value);
  const komentar   = document.getElementById('rating-komentar').value;
  const data = await apiFetch('/rating', 'POST', { booking_id, nilai, komentar });
  if (data.rating) {
    alert('Rating berhasil dikirim! Terima kasih 🎉');
    document.getElementById('rating-modal').style.display = 'none';
    loadMyBooking();
  } else {
    alert(data.message || 'Gagal mengirim rating');
  }
});

// ─── HOST PANEL (driver) ─────────────────────────────────────────────────────

async function loadHostBooking() {
  const data = await apiFetch('/booking/sebagai-host');
  const tb   = document.getElementById('host-booking-body');
  if (!tb) return;
  if (!Array.isArray(data) || data.length === 0) {
    tb.innerHTML = '<tr><td colspan="6" class="empty-msg">Belum ada penumpang yang booking kendaraanmu.</td></tr>';
    return;
  }
  tb.innerHTML = data.map(b => {
    const harga = b.total_harga === 0 ? 'GRATIS' : `Rp ${b.total_harga.toLocaleString('id-ID')}`;
    return `
    <tr>
      <td>${b.id}</td>
      <td>${b.User ? b.User.nama : '-'} <br><small>${b.User ? (b.User.no_hp || '') : ''}</small></td>
      <td>${b.Kendaraan ? b.Kendaraan.nama_kendaraan : '-'}</td>
      <td>${b.tanggal}</td>
      <td>${harga}</td>
      <td>${badgeHtml(b.status)}</td>
      <td>
        ${b.status === 'pending' ? `<button class="action-btn success" onclick="hostKonfirmasi(${b.id})">✅ Konfirmasi</button>` : ''}
        ${b.status === 'pending' ? `<button class="action-btn danger" onclick="hostTolak(${b.id})">❌ Tolak</button>` : ''}
        ${b.status === 'konfirmasi' ? `<button class="action-btn success" onclick="hostSelesaikan(${b.id})">🏁 Selesaikan</button>` : ''}
      </td>
    </tr>`;
  }).join('');
}

async function hostKonfirmasi(id) {
  if (!confirm('Konfirmasi booking penumpang ini?')) return;
  const data = await apiFetch(`/booking/${id}/konfirmasi-host`, 'PUT');
  alert(data.message);
  loadHostBooking();
}
window.hostKonfirmasi = hostKonfirmasi;

async function hostTolak(id) {
  if (!confirm('Tolak/batalkan booking penumpang ini?')) return;
  const data = await apiFetch(`/booking/${id}/batal`, 'PUT');
  alert(data.message);
  loadHostBooking();
}
window.hostTolak = hostTolak;

async function hostSelesaikan(id) {
  if (!confirm('Tandai perjalanan ini selesai? Penumpang akan bisa memberi rating.')) return;
  const data = await apiFetch(`/booking/${id}/selesai`, 'PUT');
  alert(data.message);
  loadHostBooking();
  loadKendaraan(); // Fix 4: refresh daftar kendaraan setelah selesai
}
window.hostSelesaikan = hostSelesaikan;

// ─── LIVE TRACKING GPS ───────────────────────────────────────────────────────

let _watchId     = null;
let _trackingKId = null;
let _trackMap    = null;
let _trackMarker = null;
let _shareMap    = null;
let _shareMarker = null;

const _DESTINATION = {
  lat: -7.782079970018859,
  lng: 110.41523684571618,
  nama: 'UPN Kampus 2 Yogyakarta - Babarsari'
};
let _pickupCoords = null;
let _routePolyline = null;
let _routeProgressPolyline = null;
let _destinationMarker = null;
let _lastProgressOrigin = null;

function _distMeters(a, b) {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * (Math.sin(dLng / 2) ** 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

async function fetchRoadRouteLatLngs(from, to) {
  try {
    // OSRM public server (tanpa API key). Koordinat OSRM: lon,lat
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${from.lng},${from.lat};${to.lng},${to.lat}` +
      `?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const coords = data?.routes?.[0]?.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) return null;
    return coords.map(([lng, lat]) => [lat, lng]);
  } catch (e) {
    return null;
  }
}

// DRIVER: mulai share lokasi
async function mulaiShareLokasi(kendaraanId) {
  if (!navigator.geolocation) {
    alert('Browser kamu tidak mendukung GPS');
    return;
  }
  _trackingKId = kendaraanId;
  document.getElementById('tracking-status').textContent = '📡 Mengirim lokasi...';
  document.getElementById('btn-stop-tracking').style.display = 'inline-block';

  _watchId = navigator.geolocation.watchPosition(async (pos) => {
    const { latitude, longitude } = pos.coords;
    document.getElementById('tracking-status').textContent =
      `📍 Lokasi dikirim: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

    await apiFetch('/lokasi/live/update', 'POST', {
      kendaraan_id: kendaraanId,
      latitude, longitude,
      status: 'dalam_perjalanan'
    });

    // Update peta driver
    if (!_shareMap) {
      _shareMap = L.map('share-map').setView([latitude, longitude], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(_shareMap);
      _shareMarker = L.marker([latitude, longitude]).addTo(_shareMap)
        .bindPopup('📍 Posisi kamu (driver)').openPopup();
    } else {
      _shareMarker.setLatLng([latitude, longitude]);
      _shareMap.setView([latitude, longitude]);
    }
  }, (err) => {
    document.getElementById('tracking-status').textContent = '❌ Gagal ambil GPS: ' + err.message;
  }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 });
}
window.mulaiShareLokasi = mulaiShareLokasi;

async function stopShareLocation() {
  const kendaraanId = _trackingKId;
  if (_watchId !== null) {
    navigator.geolocation.clearWatch(_watchId);
    _watchId = null;
  }
  _trackingKId = null;
  if (kendaraanId && getToken()) {
    await apiFetch(`/lokasi/live/${kendaraanId}`, 'DELETE');
  }
  const el = document.getElementById('tracking-status');
  if (el) el.textContent = '🔴 Tracking dihentikan';
  const btn = document.getElementById('btn-stop-tracking');
  if (btn) btn.style.display = 'none';
}
window.stopShareLocation = stopShareLocation;

document.getElementById('btn-stop-tracking')?.addEventListener('click', stopShareLocation);

// PENUMPANG: pantau rute driver
async function pantauRute(kendaraanId, nama) {
  showPage('page-pantau');
  document.getElementById('pantau-nama').textContent = nama ? `🗺️ Pantau Rute: ${nama}` : '🗺️ Pantau Rute';
  document.getElementById('pantau-kendaraan-id').value = kendaraanId;

  // Init peta
  if (!_trackMap) {
    _trackMap = L.map('pantau-map').setView([-7.797, 110.370], 13); // default Yogyakarta
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(_trackMap);
  }

  _pickupCoords = null;
  if (_routePolyline) { _trackMap.removeLayer(_routePolyline); _routePolyline = null; }
  if (_routeProgressPolyline) { _trackMap.removeLayer(_routeProgressPolyline); _routeProgressPolyline = null; }
  if (_destinationMarker) { _trackMap.removeLayer(_destinationMarker); _destinationMarker = null; }
  _lastProgressOrigin = null;

  try {
    const pickup = await apiFetch(`/lokasi/${kendaraanId}`);
    if (pickup && typeof pickup.latitude === 'number' && typeof pickup.longitude === 'number') {
      _pickupCoords = { lat: pickup.latitude, lng: pickup.longitude };
      _destinationMarker = L.marker([_DESTINATION.lat, _DESTINATION.lng]).addTo(_trackMap)
        .bindPopup(`🎯 ${_DESTINATION.nama}`);

      // Garis rute mengikuti jalan; kalau gagal, fallback garis lurus tetap ditampilkan.
      const roadLatLngs = await fetchRoadRouteLatLngs(_pickupCoords, _DESTINATION);
      const latlngs = roadLatLngs || [[_pickupCoords.lat, _pickupCoords.lng], [_DESTINATION.lat, _DESTINATION.lng]];
      _routePolyline = L.polyline(latlngs, { color: '#3b82f6', weight: 4 }).addTo(_trackMap);
      _trackMap.fitBounds(_routePolyline.getBounds(), { padding: [20, 20] });
    }
  } catch (e) {}

  await refreshPantauRute(kendaraanId);
}
window.pantauRute = pantauRute;

let _pantauInterval = null;

async function refreshPantauRute(kendaraanId) {
  const el = document.getElementById('pantau-status');
  try {
    const data = await apiFetch(`/lokasi/live/${kendaraanId}`);
    if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
      const { latitude, longitude, status, updatedAt } = data;
      const waktu = new Date(updatedAt).toLocaleTimeString('id-ID');
      el.textContent = `📍 Posisi driver: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} — Status: ${status} — Update: ${waktu}`;

      if (!_trackMarker) {
        _trackMarker = L.marker([latitude, longitude]).addTo(_trackMap)
          .bindPopup('🚗 Posisi Driver').openPopup();
      } else {
        _trackMarker.setLatLng([latitude, longitude]);
      }
      _trackMap.setView([latitude, longitude], 15);

      if (_pickupCoords) {
        const origin = { lat: latitude, lng: longitude };
        const shouldRefetch =
          !_lastProgressOrigin || _distMeters(_lastProgressOrigin, origin) > 20; // refetch kalau pindah >20m

        if (shouldRefetch) {
          _lastProgressOrigin = origin;
          let roadLatLngs = null;
          try {
            roadLatLngs = await fetchRoadRouteLatLngs(origin, _DESTINATION);
          } catch (e) {}

          const latlngs = roadLatLngs || [
            [origin.lat, origin.lng],
            [_DESTINATION.lat, _DESTINATION.lng]
          ];

          if (!_routeProgressPolyline) {
            _routeProgressPolyline = L.polyline(latlngs, {
              color: '#22c55e',
              weight: 4,
              dashArray: '6, 6'
            }).addTo(_trackMap);
          } else {
            _routeProgressPolyline.setLatLngs(latlngs);
          }
        }
      }
    } else {
      el.textContent = data.message || 'Driver belum mulai tracking.';
    }
  } catch (err) {
    el.textContent = 'Gagal ambil posisi driver.';
  }
}

document.getElementById('btn-refresh-rute')?.addEventListener('click', () => {
  const id = parseInt(document.getElementById('pantau-kendaraan-id').value);
  if (id) refreshPantauRute(id);
});

document.getElementById('btn-auto-refresh')?.addEventListener('click', () => {
  const id = parseInt(document.getElementById('pantau-kendaraan-id').value);
  if (!id) return;
  if (_pantauInterval) {
    clearInterval(_pantauInterval);
    _pantauInterval = null;
    document.getElementById('btn-auto-refresh').textContent = '▶️ Auto Refresh';
  } else {
    _pantauInterval = setInterval(() => refreshPantauRute(id), 5000);
    document.getElementById('btn-auto-refresh').textContent = '⏹️ Stop Auto Refresh';
    document.getElementById('btn-auto-refresh').className = 'danger';
  }
});

// ─── PROFIL ───────────────────────────────────────────────────────────────────

async function loadProfil() {
  try {
    const data = await apiFetch('/users');
    
    localStorage.setItem('user_id', data.id || '');

    document.getElementById('profil-nama').textContent   = data.nama || '-';
    document.getElementById('profil-email').textContent  = data.email || '-';
    document.getElementById('profil-hp').textContent     = data.no_hp || '-';
    document.getElementById('profil-role').textContent   = data.role || '-';
    document.getElementById('profil-rating').textContent = data.rating ? `${data.rating}/5 ⭐` : '0/5';
    
    // === STATUS SIM ===
    const simStatusEl = document.getElementById('profil-sim-status');
    const uploadForm  = document.getElementById('form-simstnk');
    const uploadBtn   = document.querySelector('#form-simstnk button');

    if (data.sim_verified) {
      simStatusEl.innerHTML = '✅ <strong>SIM/STNK sudah terverifikasi</strong>';
      simStatusEl.style.color = '#16a34a';
      
      // Disable form upload
      if (uploadForm) uploadForm.style.opacity = '0.6';
      if (uploadForm) uploadForm.style.pointerEvents = 'none';
      if (uploadBtn) uploadBtn.disabled = true;
      if (uploadBtn) uploadBtn.textContent = '✅ Sudah Terverifikasi';
    } else {
      simStatusEl.innerHTML = '⛔ <strong>Belum terverifikasi</strong><br><small>Upload SIM/STNK untuk bisa menjadi Host Carpool</small>';
      simStatusEl.style.color = '#e11d48';
      
      if (uploadForm) uploadForm.style.opacity = '1';
      if (uploadForm) uploadForm.style.pointerEvents = 'auto';
      if (uploadBtn) uploadBtn.disabled = false;
      if (uploadBtn) uploadBtn.textContent = 'Kirim untuk Diverifikasi';
    }

    document.getElementById('edit-nama').value = data.nama || '';
    document.getElementById('edit-hp').value   = data.no_hp || '';
    window._profilId = data.id;

    // Load kendaraan untuk tracking
    const kendaraanList = await apiFetch('/kendaraan');
    const myK = Array.isArray(kendaraanList) ? kendaraanList.filter(k => k.user_id === data.id) : [];
    const select = document.getElementById('track-kendaraan-select');
    if (select) {
      select.innerHTML = myK.length === 0
        ? '<option value="">-- Belum ada kendaraan --</option>'
        : myK.map(k => `<option value="${k.id}">${k.nama_kendaraan} (${k.plat_nomor})</option>`).join('');
    }
  } catch (err) {
    console.error('Gagal load profil:', err);
  }
}
document.getElementById('form-edit-profil').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    nama:  document.getElementById('edit-nama').value,
    no_hp: document.getElementById('edit-hp').value,
  };
  const data = await apiFetch(`/users/${window._profilId}`, 'PUT', body);
  showAlert('alert-profil', data.message || 'Diupdate', 'success');
  loadProfil();
});

document.getElementById('form-simstnk').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById('ss-dokumen');
  const file = fileInput?.files?.[0];
  if (!file) {
    showAlert('alert-profil', 'Pilih foto SIM/STNK dulu', 'error');
    return;
  }

  const jenis = document.getElementById('ss-jenis').value;
  const nomor = document.getElementById('ss-nomor').value;

  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result || '';
      const parts = String(result).split(',');
      resolve(parts.length > 1 ? parts[1] : parts[0]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const data = await apiFetch('/sim-verifications', 'POST', {
    jenis,
    nomor: nomor || null,
    mimeType: file.type || null,
    filename: file.name || null,
    documentBase64: base64
  });

  showAlert('alert-profil', data.message || 'Dikirim', data.message ? 'success' : 'error');
  document.getElementById('form-simstnk').reset();
  const preview = document.getElementById('ss-preview');
  if (preview) preview.style.display = 'none';
});

document.getElementById('btn-mulai-tracking')?.addEventListener('click', () => {
  const select = document.getElementById('track-kendaraan-select');
  const kId = parseInt(select?.value);
  if (!kId) { alert('Pilih kendaraan dulu!'); return; }
  mulaiShareLokasi(kId);
});

// ─── ADMIN PANEL ─────────────────────────────────────────────────────────────

async function loadAdminData() {
  loadAdminUsers();
  loadAdminBooking();
  loadAdminSimStnk();
  loadAdminMongoData();
}

async function loadAdminUsers() {
  const data = await apiFetch('/users');
  const tb   = document.getElementById('admin-users-body');
  if (!tb || !Array.isArray(data)) return;
  tb.innerHTML = data.map(u => `
    <tr>
      <td>${u.id}</td>
      <td>${u.nama}</td>
      <td>${u.email}</td>
      <td>${badgeHtml(u.role)}</td>
      <td>${u.rating ? `${u.rating}⭐` : '-'}</td>
      <td>
        <button class="action-btn danger" onclick="adminHapusUser(${u.id})">Hapus</button>
      </td>
    </tr>
  `).join('');
}

async function adminHapusUser(id) {
  if (!confirm('Hapus user ini?')) return;
  const data = await apiFetch(`/users/${id}`, 'DELETE');
  alert(data.message);
  loadAdminUsers();
}
window.adminHapusUser = adminHapusUser;

async function loadAdminBooking() {
  const data = await apiFetch('/booking');
  const tb   = document.getElementById('admin-booking-body');
  if (!tb || !Array.isArray(data)) return;
  tb.innerHTML = data.map(b => `
    <tr>
      <td>${b.id}</td>
      <td>${b.User ? b.User.nama : '-'}</td>
      <td>${b.Kendaraan ? b.Kendaraan.nama_kendaraan : '-'}</td>
      <td>${b.tanggal}</td>
      <td>${badgeHtml(b.status)}</td>
      <td>
        ${b.status === 'pending' ? `<button class="action-btn success" onclick="adminKonfirmasi(${b.id})">Konfirmasi</button>` : ''}
        ${b.status === 'konfirmasi' ? `<button class="action-btn" onclick="adminSelesaikan(${b.id})">✅ Selesai</button>` : ''}
        ${b.status !== 'batal' && b.status !== 'selesai' ? `<button class="action-btn danger" onclick="adminBatal(${b.id})">Batal</button>` : ''}
      </td>
    </tr>
  `).join('');
}

async function adminKonfirmasi(id) {
  const data = await apiFetch(`/booking/${id}/status`, 'PUT', { status: 'konfirmasi' });
  alert(data.message); loadAdminBooking();
}
window.adminKonfirmasi = adminKonfirmasi;

async function adminSelesaikan(id) {
  const data = await apiFetch(`/booking/${id}/status`, 'PUT', { status: 'selesai' });
  alert(data.message); loadAdminBooking();
}
window.adminSelesaikan = adminSelesaikan;

async function adminBatal(id) {
  const data = await apiFetch(`/booking/${id}/status`, 'PUT', { status: 'batal' });
  alert(data.message); loadAdminBooking();
}
window.adminBatal = adminBatal;

async function loadAdminSimStnk() {
  const tb = document.getElementById('admin-simstnk-body');
  if (!tb) return;

  const docs = await apiFetch('/sim-verifications');
  if (!Array.isArray(docs) || docs.length === 0) {
    tb.innerHTML = '<tr><td colspan="6" class="empty-msg">Belum ada dokumen SIM/STNK.</td></tr>';
    return;
  }

  tb.innerHTML = docs.slice(0, 20).map(d => {
    const mime = d.mimeType || 'image/jpeg';
    const img = d.documentBase64
      ? `<img src="data:${mime};base64,${d.documentBase64}" style="max-width:90px; max-height:60px; object-fit:cover; border-radius:6px; border:1px solid #ddd;" />`
      : '-';

    const status = d.status || '-';
    const actions = status === 'pending'
      ? `
        <button class="action-btn success" onclick="adminVerifikasiSim('${d._id}', 'terverifikasi')">✅ Terima</button>
        <button class="action-btn danger" onclick="adminVerifikasiSim('${d._id}', 'ditolak')">❌ Tolak</button>
      `
      : `<span style="font-weight:600;">${status}</span>`;

    return `
      <tr>
        <td>${d._id}</td>
        <td>${d.user_id}</td>
        <td>${d.jenis}</td>
        <td>${img}</td>
        <td>${badgeHtml(status)}</td>
        <td style="white-space:nowrap;">${actions}</td>
      </tr>
    `;
  }).join('');
}

async function adminVerifikasiSim(docId, status_verifikasi) {
  const data = await apiFetch(`/sim-verifications/${docId}/verifikasi`, 'PUT', { status_verifikasi });
  alert(data.message || 'Berhasil');
  loadAdminSimStnk();
}
window.adminVerifikasiSim = adminVerifikasiSim;

async function loadRiwayatLokasi(
    kendaraanId
){
    return await apiFetch(
        `/riwayat/${kendaraanId}`
    );
}

async function loadTrackingLog(){
    return await apiFetch(
        '/tracking-log'
    );
}

async function loadAllLokasi() {
  return await apiFetch('/lokasi');
}

async function loadAllLiveTracking() {
  return await apiFetch('/lokasi/live');
}

function fmtDateTime(value) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('id-ID');
  } catch (e) {
    return '-';
  }
}

async function loadAdminMongoData() {
  const [
    lokasis,
    liveTrackings,
    riwayatLokasis,
    trackingLogs
  ] = await Promise.all([
    loadAllLokasi(),
    loadAllLiveTracking(),
    apiFetch('/riwayat-lokasi'),
    loadTrackingLog(),
  ]);

  const tbLokasi = document.getElementById('admin-lokasi-body');
  if (tbLokasi) {
    if (!Array.isArray(lokasis) || lokasis.length === 0) {
      tbLokasi.innerHTML = '<tr><td colspan="5" class="empty-msg">Belum ada data lokasi.</td></tr>';
    } else {
      tbLokasi.innerHTML = lokasis.map(l => `
        <tr>
          <td>${l.kendaraan_id}</td>
          <td>${l.nama_titik || '-'}</td>
          <td>${typeof l.latitude === 'number' ? l.latitude.toFixed(6) : '-'}</td>
          <td>${typeof l.longitude === 'number' ? l.longitude.toFixed(6) : '-'}</td>
          <td>${fmtDateTime(l.updatedAt)}</td>
        </tr>
      `).join('');
    }
  }

  const tbLive = document.getElementById('admin-live-tracking-body');
  if (tbLive) {
    if (!Array.isArray(liveTrackings) || liveTrackings.length === 0) {
      tbLive.innerHTML = '<tr><td colspan="5" class="empty-msg">Belum ada data live tracking.</td></tr>';
    } else {
      tbLive.innerHTML = liveTrackings.map(t => `
        <tr>
          <td>${t.kendaraan_id}</td>
          <td>${t.status || '-'}</td>
          <td>${typeof t.latitude === 'number' ? t.latitude.toFixed(6) : '-'}</td>
          <td>${typeof t.longitude === 'number' ? t.longitude.toFixed(6) : '-'}</td>
          <td>${fmtDateTime(t.updatedAt)}</td>
        </tr>
      `).join('');
    }
  }

  const tbRiwayat = document.getElementById('admin-riwayat-lokasi-body');
  if (tbRiwayat) {
    if (!Array.isArray(riwayatLokasis) || riwayatLokasis.length === 0) {
      tbRiwayat.innerHTML = '<tr><td colspan="4" class="empty-msg">Belum ada data riwayat lokasi.</td></tr>';
    } else {
      tbRiwayat.innerHTML = riwayatLokasis.slice(0, 20).map(r => `
        <tr>
          <td>${r.kendaraan_id}</td>
          <td>${typeof r.latitude === 'number' ? r.latitude.toFixed(6) : '-'}</td>
          <td>${typeof r.longitude === 'number' ? r.longitude.toFixed(6) : '-'}</td>
          <td>${fmtDateTime(r.createdAt)}</td>
        </tr>
      `).join('');
    }
  }

  const tbLog = document.getElementById('admin-tracking-log-body');
  if (tbLog) {
    if (!Array.isArray(trackingLogs) || trackingLogs.length === 0) {
      tbLog.innerHTML = '<tr><td colspan="3" class="empty-msg">Belum ada data tracking log.</td></tr>';
    } else {
      tbLog.innerHTML = trackingLogs.slice(0, 20).map(log => `
        <tr>
          <td>${log.kendaraan_id}</td>
          <td>${log.aktivitas || '-'}</td>
          <td>${fmtDateTime(log.createdAt)}</td>
        </tr>
      `).join('');
    }
  }
}

document.getElementById('form-verif').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id     = document.getElementById('verif-id').value;
  const status = document.getElementById('verif-status').value;
  const data   = await apiFetch(`/sim-verifications/${id}/verifikasi`, 'PUT', { status_verifikasi: status });
  showAlert('alert-admin', data.message || 'Selesai', 'success');
  document.getElementById('form-verif').reset();
});

// ─── TAB SWITCHING ────────────────────────────────────────────────────────────

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const group = btn.dataset.group;
    const target = btn.dataset.tab;
    document.querySelectorAll(`[data-group="${group}"]`).forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll(`[data-tabcontent="${group}"]`).forEach(tc => {
      tc.style.display = tc.dataset.tab === target ? 'block' : 'none';
    });
    if (group === 'kendaraan' && target === 'tambah') initLokasiForm();
    if (target === 'my-kendaraan') loadMyKendaraan();
    if (target === 'my-booking')   loadMyBooking();
    if (target === 'profil-info')  loadProfil();
    if (target === 'host-booking') loadHostBooking();
    if (target === 'admin-mongo')  loadAdminMongoData();
  });
});

let _lokasiMap = null;
let _lokasiMarker = null;

async function initLokasiForm() {
  if (!_lokasiMap) {
    const latEl = document.getElementById('lokasi-lat');
    const lngEl = document.getElementById('lokasi-lng');
    const latVal = parseFloat(latEl?.value || '');
    const lngVal = parseFloat(lngEl?.value || '');
    const hasCoord = Number.isFinite(latVal) && Number.isFinite(lngVal);

    _lokasiMap = L.map('lokasi-map').setView(
      hasCoord ? [latVal, lngVal] : [-7.797, 110.370],
      hasCoord ? 16 : 13
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(_lokasiMap);
    _lokasiMap.on('click', (e) => {
      const { lat, lng } = e.latlng;
      if (latEl) latEl.value = String(lat);
      if (lngEl) lngEl.value = String(lng);
      if (!_lokasiMarker) {
        _lokasiMarker = L.marker([lat, lng]).addTo(_lokasiMap);
      } else {
        _lokasiMarker.setLatLng([lat, lng]);
      }
    });
    if (hasCoord) {
      _lokasiMarker = L.marker([latVal, lngVal]).addTo(_lokasiMap);
    }
  }
}

document.getElementById('btn-lokasi-gps')?.addEventListener('click', () => {
  if (!navigator.geolocation) {
    showAlert('alert-lokasi', 'Browser tidak mendukung GPS', 'error');
    return;
  }
  if (!_lokasiMap) initLokasiForm();
  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude, longitude } = pos.coords;
    const latEl = document.getElementById('lokasi-lat');
    const lngEl = document.getElementById('lokasi-lng');
    if (latEl) latEl.value = String(latitude);
    if (lngEl) lngEl.value = String(longitude);
    if (_lokasiMap) {
      _lokasiMap.setView([latitude, longitude], 16);
      if (!_lokasiMarker) {
        _lokasiMarker = L.marker([latitude, longitude]).addTo(_lokasiMap);
      } else {
        _lokasiMarker.setLatLng([latitude, longitude]);
      }
    }
  }, (err) => {
    showAlert('alert-lokasi', err.message || 'Gagal ambil GPS', 'error');
  }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 });
});

// ─── NAVBAR LINKS ─────────────────────────────────────────────────────────────

document.getElementById('nav-home').addEventListener('click', () => showPage('page-home'));
document.getElementById('nav-kendaraan').addEventListener('click', () => { showPage('page-kendaraan'); loadKendaraan(); });
document.getElementById('nav-booking').addEventListener('click', () => { showPage('page-booking'); loadMyBooking(); });
document.getElementById('nav-host').addEventListener('click', () => { showPage('page-host'); loadHostBooking(); });
document.getElementById('nav-profil').addEventListener('click', () => { showPage('page-profil'); loadProfil(); });
document.getElementById('nav-admin').addEventListener('click', () => { showPage('page-admin'); loadAdminData(); });

document.getElementById('btn-go-login').addEventListener('click', () => showPage('page-login'));
document.getElementById('btn-go-register').addEventListener('click', () => showPage('page-register'));
document.getElementById('link-to-register').addEventListener('click', (e) => { e.preventDefault(); showPage('page-register'); });
document.getElementById('link-to-login').addEventListener('click', (e) => { e.preventDefault(); showPage('page-login'); });
document.getElementById('btn-kembali-pantau').addEventListener('click', () => {
  if (_pantauInterval) { clearInterval(_pantauInterval); _pantauInterval = null; }
  showPage('page-kendaraan'); loadKendaraan();
});

// ─── INIT ─────────────────────────────────────────────────────────────────────

updateNav();
if (getToken()) {
  if (getRole() === 'admin') {
    window.location.href = ADMIN_BASE_URL;
  } else {
    showPage('page-kendaraan'); loadKendaraan();
  }
} else {
  showPage('page-home');
}