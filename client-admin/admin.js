const API = window.API_BASE_URL || '/api';
const USER_BASE_URL = window.USER_BASE_URL || '/';

function getToken() { return localStorage.getItem('token'); }
function getRole() { return localStorage.getItem('role'); }

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
  if (token) opts.headers.Authorization = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  const raw = await res.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch (e) {
    data = { message: raw || 'Respons server tidak valid' };
  }
  if (!res.ok) return { ...data, ok: false, status: res.status };
  return data;
}

function badgeHtml(status) {
  return `<span class="badge ${status}">${status}</span>`;
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
  const el = document.getElementById(pageId);
  if (el) el.classList.add('active');
}

function updateNav() {
  const loggedInAdmin = !!getToken() && getRole() === 'admin';
  const navAdmin = document.getElementById('nav-admin');
  const btnLogout = document.getElementById('btn-logout');
  if (navAdmin) navAdmin.style.display = loggedInAdmin ? 'inline' : 'none';
  if (btnLogout) btnLogout.style.display = loggedInAdmin ? 'inline-block' : 'none';
}

function fmtDateTime(value) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('id-ID');
  } catch (e) {
    return '-';
  }
}

async function loadAdminUsers() {
  const data = await apiFetch('/users');
  const tb = document.getElementById('admin-users-body');
  if (!tb || !Array.isArray(data)) return;
  tb.innerHTML = data.map((u) => `
    <tr>
      <td>${u.id}</td>
      <td>${u.nama}</td>
      <td>${u.email}</td>
      <td>${badgeHtml(u.role)}</td>
      <td>${u.rating ? `${u.rating}⭐` : '-'}</td>
      <td><button class="action-btn danger" onclick="adminHapusUser(${u.id})">Hapus</button></td>
    </tr>
  `).join('');
}

async function adminHapusUser(id) {
  if (!confirm('Hapus user ini?')) return;
  const data = await apiFetch(`/users/${id}`, 'DELETE');
  alert(data.message || 'Selesai');
  loadAdminUsers();
}
window.adminHapusUser = adminHapusUser;

async function loadAdminBooking() {
  const data = await apiFetch('/booking');
  const tb = document.getElementById('admin-booking-body');
  if (!tb || !Array.isArray(data)) return;
  tb.innerHTML = data.map((b) => `
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
  alert(data.message || 'Selesai');
  loadAdminBooking();
}
window.adminKonfirmasi = adminKonfirmasi;

async function adminSelesaikan(id) {
  const data = await apiFetch(`/booking/${id}/status`, 'PUT', { status: 'selesai' });
  alert(data.message || 'Selesai');
  loadAdminBooking();
}
window.adminSelesaikan = adminSelesaikan;

async function adminBatal(id) {
  const data = await apiFetch(`/booking/${id}/status`, 'PUT', { status: 'batal' });
  alert(data.message || 'Selesai');
  loadAdminBooking();
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
  tb.innerHTML = docs.slice(0, 20).map((d) => {
    const mime = d.mimeType || 'image/jpeg';
    const img = d.documentBase64
      ? `<img src="data:${mime};base64,${d.documentBase64}" style="max-width:90px; max-height:60px; object-fit:cover; border-radius:6px; border:1px solid #ddd;" />`
      : '-';
    const actions = d.status === 'pending'
      ? `
      <button class="action-btn success" onclick="adminVerifikasiSim('${d._id}', 'terverifikasi')">✅ Terima</button>
      <button class="action-btn danger" onclick="adminVerifikasiSim('${d._id}', 'ditolak')">❌ Tolak</button>
      `
      : `<span style="font-weight:600;">${d.status || '-'}</span>`;
    return `
      <tr>
        <td>${d.user_id}</td>
        <td>${d.jenis}</td>
        <td>${img}</td>
        <td>${badgeHtml(d.status || '-')}</td>
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

async function loadAdminMongoData() {
  const [lokasis, liveTrackings, riwayatLokasis, trackingLogs] = await Promise.all([
    apiFetch('/lokasi'),
    apiFetch('/lokasi/live'),
    apiFetch('/riwayat-lokasi'),
    apiFetch('/tracking-log'),
  ]);

  const tbLokasi = document.getElementById('admin-lokasi-body');
  if (tbLokasi) {
    if (!Array.isArray(lokasis) || lokasis.length === 0) {
      tbLokasi.innerHTML = '<tr><td colspan="5" class="empty-msg">Belum ada data lokasi.</td></tr>';
    } else {
      tbLokasi.innerHTML = lokasis.map((l) => `
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
      tbLive.innerHTML = liveTrackings.map((t) => `
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
      tbRiwayat.innerHTML = riwayatLokasis.slice(0, 20).map((r) => `
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
      tbLog.innerHTML = trackingLogs.slice(0, 20).map((log) => `
        <tr>
          <td>${log.kendaraan_id}</td>
          <td>${log.aktivitas || '-'}</td>
          <td>${fmtDateTime(log.createdAt)}</td>
        </tr>
      `).join('');
    }
  }
}

async function loadAdminData() {
  await Promise.all([
    loadAdminUsers(),
    loadAdminBooking(),
    loadAdminSimStnk(),
    loadAdminMongoData(),
  ]);
}

document.getElementById('form-login')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-pass').value;
  const data = await apiFetch('/auth/login', 'POST', { email, password });
  if (!data.token) {
    showAlert('alert-login', data.message || 'Login gagal', 'error');
    return;
  }
  if (data.role !== 'admin') {
    showAlert('alert-login', 'Akun ini bukan admin. Silakan login di platform user.', 'error');
    setTimeout(() => { window.location.href = USER_BASE_URL; }, 800);
    return;
  }
  localStorage.setItem('token', data.token);
  localStorage.setItem('role', data.role);
  localStorage.setItem('nama', data.nama);
  localStorage.setItem('user_id', data.id ? String(data.id) : '');
  updateNav();
  showPage('page-admin');
  loadAdminData();
});

document.getElementById('btn-logout')?.addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.clear();
  updateNav();
  showPage('page-login');
});

document.getElementById('nav-admin')?.addEventListener('click', (e) => {
  e.preventDefault();
  showPage('page-admin');
  loadAdminData();
});

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const group = btn.dataset.group;
    const target = btn.dataset.tab;
    document.querySelectorAll(`[data-group="${group}"]`).forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll(`[data-tabcontent="${group}"]`).forEach((tc) => {
      tc.style.display = tc.dataset.tab === target ? 'block' : 'none';
    });
    if (target === 'admin-mongo') loadAdminMongoData();
  });
});

updateNav();
if (getToken() && getRole() === 'admin') {
  showPage('page-admin');
  loadAdminData();
} else {
  showPage('page-login');
}
