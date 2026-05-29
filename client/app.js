const API = '/api';

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
  return res.json();
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
    if (getRole() === 'admin') {
      document.getElementById('nav-booking').style.display   = 'none';
      document.getElementById('nav-host').style.display      = 'none';
      document.getElementById('nav-profil').style.display    = 'none';
      document.getElementById('nav-admin').style.display     = 'inline';
    } else {
      document.getElementById('nav-booking').style.display   = 'inline';
      document.getElementById('nav-host').style.display      = 'inline';
      document.getElementById('nav-profil').style.display    = 'inline';
      document.getElementById('nav-admin').style.display     = 'none';
    }
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
    localStorage.setItem('user_id', data.id || '');
    updateNav();
    if (data.role === 'admin') {
      showPage('page-admin'); loadAdminData();
    } else {
      showPage('page-kendaraan'); loadKendaraan();
    }
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
    showAlert('alert-kendaraan', 'Kendaraan berhasil ditambahkan!', 'success');
    document.getElementById('form-kendaraan').reset();
    loadKendaraan();
    loadMyKendaraan();
  } else {
    showAlert('alert-kendaraan', data.message || 'Gagal', 'error');
  }
});

async function loadMyKendaraan() {
  const users = await apiFetch('/users');
  const allK  = await apiFetch('/kendaraan');
  if (!Array.isArray(allK)) return;
  const myId = users.id;
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

function stopShareLocation() {
  if (_watchId !== null) {
    navigator.geolocation.clearWatch(_watchId);
    _watchId = null;
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

  await refreshPantauRute(kendaraanId);
}
window.pantauRute = pantauRute;

let _pantauInterval = null;

async function refreshPantauRute(kendaraanId) {
  const el = document.getElementById('pantau-status');
  try {
    const data = await apiFetch(`/lokasi/live/${kendaraanId}`);
    if (data.latitude) {
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
  const body = {
    jenis: document.getElementById('ss-jenis').value,
    nomor: document.getElementById('ss-nomor').value,
  };
  const data = await apiFetch('/users/sim-stnk', 'POST', body);
  showAlert('alert-profil', data.message || 'Dikirim', data.message ? 'success' : 'error');
  document.getElementById('form-simstnk').reset();
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
  tb.innerHTML = '<tr><td colspan="4" class="empty-msg">Masukkan ID dokumen untuk verifikasi di bawah.</td></tr>';
}

document.getElementById('form-verif').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id     = document.getElementById('verif-id').value;
  const status = document.getElementById('verif-status').value;
  const data   = await apiFetch(`/users/sim-stnk/${id}/verifikasi`, 'PUT', { status_verifikasi: status });
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
    if (target === 'my-kendaraan') loadMyKendaraan();
    if (target === 'my-booking')   loadMyBooking();
    if (target === 'profil-info')  loadProfil();
    if (target === 'host-booking') loadHostBooking();
  });
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
    showPage('page-admin'); loadAdminData();
  } else {
    showPage('page-kendaraan'); loadKendaraan();
  }
} else {
  showPage('page-home');
}