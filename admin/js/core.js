// ── SWEETALERT2 ───────────────────────────────────────────────────────────────
(function loadSwal() {
  if (window.Swal) return;
  const lnk = document.createElement('link');
  lnk.rel = 'stylesheet';
  lnk.href = 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css';
  document.head.appendChild(lnk);
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
  document.head.appendChild(s);
})();

// ── AUTH ──────────────────────────────────────────────────────────────────────
const DEFAULT_PIN = '1234';
function checkAuth() {
  if (localStorage.getItem('mch_auth') !== 'true') window.location.href = 'login.html';
}
function logout() {
  Swal.fire({
    title: 'Logout?',
    text: 'You will be returned to the login screen.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, logout',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#0a2342',
    cancelButtonColor: '#94a3b8'
  }).then(r => {
    if (r.isConfirmed) {
      localStorage.removeItem('mch_auth');
      window.location.href = 'login.html';
    }
  });
}

// ── SPLASH ─────────────────────────────────────────────────────────────────────
// Show once per session — first admin page after login
(function initSplash() {
  const isLogin = location.pathname.includes('login');
  if (isLogin) return;
  if (sessionStorage.getItem('mch_splashed')) return;
  sessionStorage.setItem('mch_splashed', '1');

  const splash = document.createElement('div');
  splash.id = 'adminSplash';
  splash.innerHTML = `
    <div class="spl-blob b1"></div>
    <div class="spl-blob b2"></div>
    <div class="spl-blob b3"></div>
    <div class="spl-card">
      <div class="spl-icon-wrap">
        <div class="spl-ring-3d"></div>
        <div class="spl-ring-outer"></div>
        <div class="spl-ring-inner"></div>
        <div class="spl-icon"><i class="bi bi-bag-fill"></i></div>
      </div>
      <h1 class="spl-title">Madina Cloth House</h1>
      <div class="spl-badge"><i class="bi bi-shield-check"></i> Admin Panel</div>
      <p class="spl-tagline">Smart Retail Management System</p>
      <div class="spl-prog-wrap">
        <div class="spl-prog-track"><div class="spl-prog-fill"></div></div>
        <p class="spl-status" id="adminSplStatus">Initializing...</p>
      </div>
    </div>
    <div class="spl-footer">
      <span class="spl-sep"></span>
      <span>Developed by <strong>MZ Corporations</strong></span>
      <span class="spl-sep"></span>
    </div>`;
  document.body.prepend(splash);

  const _msgs = ['Initializing...','Loading modules...','Syncing data...','Ready'];
  let _mi = 0;
  const _tick = setInterval(() => {
    const el = document.getElementById('adminSplStatus');
    if (el && _mi < _msgs.length) { el.textContent = _msgs[_mi++]; }
    else clearInterval(_tick);
  }, 520);

  window.addEventListener('load', () => {
    setTimeout(() => {
      clearInterval(_tick);
      splash.classList.add('hide');
      setTimeout(() => splash.remove(), 700);
    }, 2400);
  });
})();

// ── DATA HELPERS ──────────────────────────────────────────────────────────────
function getData(key)        { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
function saveData(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
function getObj(key, id)     { return getData(key).find(x => x.id === id) || null; }

// ── CATALOGUE LOOKUPS ─────────────────────────────────────────────────────────
function getBrand(id)    { return getData('mch_brands').find(b => b.id === id); }
function getCategory(id) { return getData('mch_categories').find(c => c.id === id); }
function getProduct(id)  { return getData('mch_products').find(p => p.id === id); }
function getCustomer(id) { return getData('mch_customers').find(c => c.id === id); }

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const SIZES    = ['XS','S','M','L','XL','XXL','3XL','4XL'];
const GENDERS  = ['Men','Women','Kids','Unisex'];
const FABRICS  = ['Cotton','Lawn','Wash & Wear','Khaddar','Linen','Silk','Chiffon','Organza','Net','Velvet','Denim','Wool','Fleece','Other'];
const ORDER_STATUSES  = ['pending','processing','ready','delivered','cancelled'];
const TAILOR_STATUSES = ['pending','in-progress','ready','delivered','cancelled'];

const COLORS_MAP = {
  White:'#ffffff', Black:'#1a1a1a', Navy:'#0a2342', Blue:'#2563eb',
  Red:'#dc2626', Green:'#16a34a', Yellow:'#eab308', Orange:'#ea580c',
  Pink:'#ec4899', Purple:'#7c3aed', Brown:'#92400e', Grey:'#64748b',
  Beige:'#d4b896', Maroon:'#7f1d1d', Teal:'#0d9488', Olive:'#65a30d',
  Cream:'#fef9ef', Mustard:'#ca8a04', Turquoise:'#06b6d4', Lavender:'#a78bfa'
};

// ── FORMAT HELPERS ────────────────────────────────────────────────────────────
function fmt(n)    { return 'Rs. ' + parseFloat(n||0).toLocaleString('en-PK'); }
function fmtD(d)   { if(!d) return '—'; return new Date(d).toLocaleDateString('en-PK',{day:'2-digit',month:'short',year:'numeric'}); }
function uid()     { return Date.now().toString(36) + Math.random().toString(36).substr(2,5); }
function today()   { return new Date().toISOString().split('T')[0]; }
function escHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ── GENDER / STATUS / STOCK BADGES ───────────────────────────────────────────
function genderBadge(g) {
  const map = { Men:'b-men', Women:'b-women', Kids:'b-kids', Unisex:'b-unisex' };
  return `<span class="badge ${map[g]||'b-unisex'}">${g||'—'}</span>`;
}
function statusBadge(s) { return `<span class="badge b-${s}">${s}</span>`; }
function stockBadge(qty, low) {
  low = parseInt(low||5);
  if(parseInt(qty)<=0)   return `<span class="stock-badge out"><i class="bi bi-x-circle-fill"></i> Out</span>`;
  if(parseInt(qty)<=low) return `<span class="stock-badge low"><i class="bi bi-exclamation-triangle-fill"></i> Low (${qty})</span>`;
  return `<span class="stock-badge ok"><i class="bi bi-check-circle-fill"></i> ${qty}</span>`;
}

// ── TOAST (SweetAlert2 mixin) ──────────────────────────────────────────────────
function toast(msg, type='success') {
  const icons  = { success:'success', danger:'error', warning:'warning', info:'info' };
  const colors = { success:'#16a34a', danger:'#dc2626', warning:'#d97706', info:'#2563eb' };
  function fire() {
    Swal.mixin({
      toast: true, position: 'top-end', showConfirmButton: false,
      timer: 3000, timerProgressBar: true,
      didOpen: t => { t.addEventListener('mouseenter', Swal.stopTimer); t.addEventListener('mouseleave', Swal.resumeTimer); }
    }).fire({ icon: icons[type]||'success', title: msg });
  }
  if (window.Swal) { fire(); }
  else { setTimeout(fire, 800); }
}

// ── CONFIRM DIALOG (SweetAlert2) ──────────────────────────────────────────────
function confirmDelete(msg, cb) {
  function fire() {
    Swal.fire({
      title: 'Are you sure?',
      text: msg || 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-trash"></i> Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      customClass: { popup: 'swal-custom-popup' }
    }).then(r => { if (r.isConfirmed) cb(); });
  }
  if (window.Swal) { fire(); }
  else { setTimeout(fire, 800); }
}

// ── EXPORT CSV ────────────────────────────────────────────────────────────────
function exportCSV(data, filename, cols) {
  const rows = [cols, ...data.map(r => cols.map(c => `"${String(r[c]??'').replace(/"/g,'""')}"`))];
  const csv  = rows.map(r => Array.isArray(r) ? r.join(',') : r).join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'})),
    download: filename+'_'+today()+'.csv'
  });
  a.click();
}

// ── MODAL HELPERS ─────────────────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
});

// ── POPULATE SELECT ───────────────────────────────────────────────────────────
function populateSelect(selectEl, items, valueFn, textFn, placeholder='Select...') {
  selectEl.innerHTML = `<option value="">${placeholder}</option>` +
    items.map(i => `<option value="${valueFn(i)}">${escHtml(textFn(i))}</option>`).join('');
}

// ── PROFILE SECTION ───────────────────────────────────────────────────────────
function _injectProfile() {
  const creds    = JSON.parse(localStorage.getItem('mch_credentials') || '{"username":"admin"}');
  const username = creds.username || 'Admin';
  const initial  = username.charAt(0).toUpperCase();

  // Find the topbar's right-side div (last child of .topbar) — works on ALL pages
  const topbar = document.querySelector('.topbar');
  if (!topbar) return;
  const topbarRight = topbar.querySelector('div:last-child');
  if (!topbarRight) return;

  // Append profile avatar button (don't remove or change anything existing)
  const profileWrap = document.createElement('div');
  profileWrap.className = 'profile-btn-wrap';
  profileWrap.innerHTML = `
    <button class="profile-avatar-btn" onclick="toggleProfileDrop()">
      <span class="profile-avatar-init">${initial}</span>
      <i class="bi bi-chevron-down" style="font-size:.62rem;opacity:.55;"></i>
    </button>
    <div class="profile-drop" id="profileDrop">
      <div class="profile-drop-head">
        <div class="profile-drop-avatar">${initial}</div>
        <div>
          <div class="profile-drop-name">${escHtml(username)}</div>
          <div class="profile-drop-role">Administrator</div>
        </div>
      </div>
      <div class="profile-drop-divider"></div>
      <a class="profile-drop-item" onclick="closeProfileDrop();openProfileModal()">
        <i class="bi bi-person-circle"></i> My Profile
      </a>
      <a class="profile-drop-item" href="settings.html">
        <i class="bi bi-gear"></i> Settings
      </a>
      <div class="profile-drop-divider"></div>
      <button class="profile-drop-item profile-drop-logout" onclick="closeProfileDrop();logout()">
        <i class="bi bi-box-arrow-left"></i> Logout
      </button>
    </div>`;
  topbarRight.appendChild(profileWrap);

  // Inject profile modal
  const modal = document.createElement('div');
  modal.id = 'profileModal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal modal-sm" style="max-width:420px;">
      <div class="modal-head">
        <h3>My Profile</h3>
        <button class="modal-close" onclick="closeModal('profileModal')"><i class="bi bi-x"></i></button>
      </div>
      <div class="modal-body">
        <div class="profile-modal-avatar-wrap">
          <div class="profile-modal-avatar">${initial}</div>
          <div>
            <div class="profile-modal-name">${escHtml(username)}</div>
            <div class="profile-modal-role">Administrator · Madina Cloth House</div>
          </div>
        </div>
        <div class="profile-modal-stats" id="pmStats"></div>
        <div class="profile-drop-divider" style="margin:1rem 0;"></div>
        <div class="fgroup">
          <label class="flabel">New Username</label>
          <input class="finput" id="pmNewUser" placeholder="Leave blank to keep current">
        </div>
        <div class="fgroup">
          <label class="flabel">Current Password *</label>
          <input class="finput" type="password" id="pmCurPass" placeholder="Required to save changes">
        </div>
        <div class="frow fcol2">
          <div class="fgroup">
            <label class="flabel">New Password</label>
            <input class="finput" type="password" id="pmNewPass" placeholder="Optional">
          </div>
          <div class="fgroup">
            <label class="flabel">Confirm Password</label>
            <input class="finput" type="password" id="pmConPass" placeholder="Optional">
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" onclick="closeModal('profileModal')">Cancel</button>
        <button class="btn btn-gold" onclick="saveProfile()"><i class="bi bi-check2"></i> Save Changes</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  // Click outside → close dropdown
  document.addEventListener('click', e => {
    if (!profileWrap.contains(e.target)) closeProfileDrop();
  });
}

window.toggleProfileDrop = function() {
  document.getElementById('profileDrop')?.classList.toggle('open');
};
window.closeProfileDrop = function() {
  document.getElementById('profileDrop')?.classList.remove('open');
};
window.openProfileModal = function() {
  // populate stats
  const orders   = getData('mch_orders').length;
  const products = getData('mch_products').length;
  const customers= getData('mch_customers').length;
  document.getElementById('pmStats').innerHTML = `
    <div class="pm-stat"><span>${orders}</span><p>Orders</p></div>
    <div class="pm-stat"><span>${products}</span><p>Products</p></div>
    <div class="pm-stat"><span>${customers}</span><p>Customers</p></div>`;
  ['pmNewUser','pmCurPass','pmNewPass','pmConPass'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  openModal('profileModal');
};
window.saveProfile = function() {
  const curPass  = document.getElementById('pmCurPass').value;
  const newUser  = document.getElementById('pmNewUser').value.trim();
  const newPass  = document.getElementById('pmNewPass').value;
  const conPass  = document.getElementById('pmConPass').value;
  const creds    = JSON.parse(localStorage.getItem('mch_credentials') || '{"username":"admin","password":"admin123"}');
  if (!curPass) { toast('Current password is required','warning'); return; }
  if (curPass !== creds.password) { toast('Current password is incorrect','danger'); return; }
  if (newPass && newPass.length < 6) { toast('Password must be at least 6 characters','warning'); return; }
  if (newPass && newPass !== conPass) { toast('New passwords do not match','warning'); return; }
  if (newUser) creds.username = newUser;
  if (newPass) creds.password = newPass;
  localStorage.setItem('mch_credentials', JSON.stringify(creds));
  closeModal('profileModal');
  toast('Profile updated! Please refresh.','success');
};

// ── SIDEBAR & TOPBAR INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();

  // Active sidebar link
  const cur = location.pathname.split('/').pop();
  document.querySelectorAll('.s-link').forEach(a => {
    if (a.getAttribute('href') === cur) a.classList.add('active');
  });

  // Inject profile
  _injectProfile();

  // Add Gallery link to sidebar nav if not present
  const nav = document.querySelector('.s-nav');
  if (nav && !nav.querySelector('a[href="gallery.html"]')) {
    const galleryLink = document.createElement('a');
    galleryLink.className = 's-link' + (cur === 'gallery.html' ? ' active' : '');
    galleryLink.href = 'gallery.html';
    galleryLink.innerHTML = '<i class="bi bi-images"></i> Gallery';
    // Insert after promotions link
    const promoLink = nav.querySelector('a[href="promotions.html"]');
    promoLink ? promoLink.after(galleryLink) : nav.appendChild(galleryLink);
  }

  // Sidebar logout button
  document.getElementById('logoutBtn')?.addEventListener('click', e => { e.preventDefault(); logout(); });

  // Mobile sidebar toggle
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sOverlay');
  window.toggleSidebar = () => {
    sidebar?.classList.toggle('open');
    overlay?.classList.toggle('show');
  };
  overlay?.addEventListener('click', toggleSidebar);
});

// ── SEED CREDENTIALS ─────────────────────────────────────────────────────────
(function seedCredentials() {
  if (!localStorage.getItem('mch_credentials')) {
    localStorage.setItem('mch_credentials', JSON.stringify({ username: 'admin', password: 'admin123' }));
  }
})();

// ── SEED DEFAULT BRANDS & CATEGORIES ─────────────────────────────────────────
(function seedDefaults() {
  if (!getData('mch_brands').length) {
    saveData('mch_brands', [
      { id:'br_1', name:'Gul Ahmed',      origin:'Pakistan', description:'Premium lawn & fabric brand', isActive:true, createdAt:today() },
      { id:'br_2', name:'Junaid Jamshed', origin:'Pakistan', description:'Unstitched suits & formal wear', isActive:true, createdAt:today() },
      { id:'br_3', name:'Khaadi',         origin:'Pakistan', description:'Winter & premium collections', isActive:true, createdAt:today() },
      { id:'br_4', name:'Sapphire',       origin:'Pakistan', description:'Ladies printed suits', isActive:true, createdAt:today() },
      { id:'br_5', name:'Local',          origin:'Pakistan', description:'Local quality cloth', isActive:true, createdAt:today() }
    ]);
  }
  if (!getData('mch_categories').length) {
    saveData('mch_categories', [
      { id:'cat_1', name:'Wash & Wear',    gender:'Men',    description:'Daily & office wear fabric', isActive:true },
      { id:'cat_2', name:'Kurta',          gender:'Men',    description:'Traditional cotton kurta', isActive:true },
      { id:'cat_3', name:'Waistcoat',      gender:'Men',    description:'Formal waistcoat', isActive:true },
      { id:'cat_4', name:'Sherwani',       gender:'Men',    description:'Wedding & event sherwani', isActive:true },
      { id:'cat_5', name:'Lawn Suit',      gender:'Women',  description:'3-piece lawn suits', isActive:true },
      { id:'cat_6', name:'Embroidered',    gender:'Women',  description:'Embroidered & fancy suits', isActive:true },
      { id:'cat_7', name:'Abaya / Maxi',   gender:'Women',  description:'Modest fashion abayas', isActive:true },
      { id:'cat_8', name:'Bridal Wear',    gender:'Women',  description:'Heavy embroidery bridal', isActive:true },
      { id:'cat_9', name:'Shawl / Stole',  gender:'Unisex', description:'Winter shawls & stoles', isActive:true },
      { id:'cat_10',name:'Kids Suit',      gender:'Kids',   description:'Kids formal & casual suits', isActive:true }
    ]);
  }
})();
