// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderBrandStats();
  renderBrands();
});

// ── STATS ─────────────────────────────────────────────────────────────────────
function renderBrandStats() {
  const brands   = getData('mch_brands');
  const products = getData('mch_products');
  const active   = brands.filter(b => b.isActive).length;
  const inactive = brands.length - active;

  document.getElementById('brandStats').innerHTML = [
    { label:'Total Brands', value: brands.length,   icon:'bi-award',          color:'#2563eb' },
    { label:'Active',        value: active,           icon:'bi-check-circle',   color:'#16a34a' },
    { label:'Inactive',      value: inactive,         icon:'bi-x-circle',       color:'#dc2626' },
    { label:'Total Products',value: products.length, icon:'bi-bag',            color:'#d97706' },
  ].map(s => `
    <div class="stat-card" style="--accent:${s.color};">
      <div class="stat-icon" style="background:${s.color}22;color:${s.color};"><i class="bi ${s.icon}"></i></div>
      <p class="stat-val">${s.value}</p>
      <p class="stat-lbl">${s.label}</p>
    </div>`).join('');
}

// ── RENDER ────────────────────────────────────────────────────────────────────
function renderBrands() {
  const q      = (document.getElementById('brandSearch').value || '').toLowerCase();
  const status = document.getElementById('filterStatus').value;
  const brands  = getData('mch_brands');
  const products = getData('mch_products');

  let list = brands.filter(b => {
    const matchQ = !q || b.name.toLowerCase().includes(q) || (b.origin||'').toLowerCase().includes(q);
    const matchS = !status || (status === 'active' ? b.isActive : !b.isActive);
    return matchQ && matchS;
  });

  document.getElementById('brandCount').textContent = `(${list.length} of ${brands.length})`;

  // Grid
  document.getElementById('brandGrid').innerHTML = list.length ? list.map(b => {
    const pcount = products.filter(p => p.brandId === b.id).length;
    const initials = b.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
    const avatarHtml = b.image
      ? `<div class="brand-avatar" style="background:none;padding:0;overflow:hidden;"><img src="${b.image}" alt="${escHtml(b.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>`
      : `<div class="brand-avatar">${escHtml(initials)}</div>`;
    return `
    <div class="brand-card">
      ${avatarHtml}
      <div class="brand-name">${escHtml(b.name)}</div>
      <div class="brand-origin"><i class="bi bi-geo-alt"></i> ${escHtml(b.origin||'—')}</div>
      <div class="brand-desc text-muted" style="font-size:.78rem;margin:.35rem 0 .6rem;line-height:1.4;">${escHtml(b.description||'')}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem;">
        <span class="badge b-${b.isActive?'active':'inactive'}">${b.isActive?'Active':'Inactive'}</span>
        <span class="text-muted" style="font-size:.75rem;"><i class="bi bi-bag"></i> ${pcount} products</span>
      </div>
      <div class="brand-actions">
        <button class="btn btn-ghost btn-sm" onclick="editBrand('${b.id}')"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-danger btn-sm" onclick="deleteBrand('${b.id}')"><i class="bi bi-trash"></i></button>
      </div>
    </div>`;
  }).join('') : `<div class="text-muted" style="padding:2rem;grid-column:1/-1;text-align:center;">No brands found.</div>`;

  // Table
  document.getElementById('brandTbl').innerHTML = list.length ? list.map((b, i) => {
    const pcount = products.filter(p => p.brandId === b.id).length;
    return `<tr>
      <td>${i+1}</td>
      <td><strong>${escHtml(b.name)}</strong></td>
      <td>${escHtml(b.origin||'—')}</td>
      <td style="max-width:220px;white-space:normal;font-size:.8rem;">${escHtml(b.description||'—')}</td>
      <td><span class="badge" style="background:#e0e7ef;color:#0a2342;">${pcount}</span></td>
      <td><span class="badge b-${b.isActive?'active':'inactive'}">${b.isActive?'Active':'Inactive'}</span></td>
      <td>${fmtD(b.createdAt)}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="editBrand('${b.id}')"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-danger btn-sm" onclick="deleteBrand('${b.id}')"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`;
  }).join('') : `<tr><td colspan="8" class="text-muted" style="text-align:center;padding:2rem;">No brands found.</td></tr>`;
}

// ── SAVE ──────────────────────────────────────────────────────────────────────
function saveBrand() {
  const name = document.getElementById('brandName').value.trim();
  if (!name) { toast('Brand name is required','warning'); return; }

  const brands = getData('mch_brands');
  const id     = document.getElementById('brandId').value;
  const img = document.getElementById('brandImg').value;
  const obj    = {
    name,
    origin:      document.getElementById('brandOrigin').value.trim(),
    description: document.getElementById('brandDesc').value.trim(),
    isActive:    document.getElementById('brandStatus').value === 'true',
    image:       img || ''
  };

  if (id) {
    const idx = brands.findIndex(b => b.id === id);
    if (idx > -1) brands[idx] = { ...brands[idx], ...obj };
    toast('Brand updated successfully');
  } else {
    const dup = brands.find(b => b.name.toLowerCase() === name.toLowerCase());
    if (dup) { toast('Brand name already exists','warning'); return; }
    brands.push({ id: 'br_' + uid(), createdAt: today(), ...obj });
    toast('Brand added successfully');
  }

  saveData('mch_brands', brands);
  closeModal('brandModal');
  renderBrandStats();
  renderBrands();
}

// ── EDIT ──────────────────────────────────────────────────────────────────────
function editBrand(id) {
  const b = getData('mch_brands').find(b => b.id === id);
  if (!b) return;
  document.getElementById('brandModalTitle').textContent = 'Edit Brand';
  document.getElementById('brandId').value     = b.id;
  document.getElementById('brandName').value   = b.name;
  document.getElementById('brandOrigin').value = b.origin || '';
  document.getElementById('brandDesc').value   = b.description || '';
  document.getElementById('brandStatus').value = b.isActive ? 'true' : 'false';
  document.getElementById('brandImg').value    = b.image || '';
  const box = document.getElementById('brandImgBox');
  if (b.image) {
    box.style.backgroundImage = `url(${b.image})`;
    box.classList.add('has-img');
  } else {
    box.style.backgroundImage = '';
    box.classList.remove('has-img');
  }
  openModal('brandModal');
}

// ── DELETE ────────────────────────────────────────────────────────────────────
function deleteBrand(id) {
  confirmDelete('Delete this brand? Products using it will not be deleted.', () => {
    const brands = getData('mch_brands').filter(b => b.id !== id);
    saveData('mch_brands', brands);
    toast('Brand deleted','danger');
    renderBrandStats();
    renderBrands();
  });
}

// ── EXPORT ────────────────────────────────────────────────────────────────────
function exportBrands() {
  const brands   = getData('mch_brands');
  const products = getData('mch_products');
  const rows = brands.map(b => ({
    Name:        b.name,
    Origin:      b.origin || '',
    Description: b.description || '',
    Products:    products.filter(p => p.brandId === b.id).length,
    Status:      b.isActive ? 'Active' : 'Inactive',
    Added:       b.createdAt || ''
  }));
  exportCSV(rows, 'brands', ['Name','Origin','Description','Products','Status','Added']);
}

// ── IMAGE UPLOAD ──────────────────────────────────────────────────────────────
function handleBrandImg(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const b64 = ev.target.result;
    document.getElementById('brandImg').value = b64;
    const box = document.getElementById('brandImgBox');
    box.style.backgroundImage = `url(${b64})`;
    box.classList.add('has-img');
  };
  reader.readAsDataURL(file);
}

// ── MODAL RESET ON OPEN ───────────────────────────────────────────────────────
const _origOpenModal = window.openModal;
window.openModal = function(id) {
  if (id === 'brandModal') {
    const title = document.getElementById('brandModalTitle');
    if (title && title.textContent !== 'Edit Brand') {
      document.getElementById('brandId').value     = '';
      document.getElementById('brandName').value   = '';
      document.getElementById('brandOrigin').value = '';
      document.getElementById('brandDesc').value   = '';
      document.getElementById('brandStatus').value = 'true';
      document.getElementById('brandImg').value    = '';
      document.getElementById('brandImgInput').value = '';
      const box = document.getElementById('brandImgBox');
      box.style.backgroundImage = '';
      box.classList.remove('has-img');
      title.textContent = 'Add Brand';
    }
  }
  _origOpenModal(id);
};
