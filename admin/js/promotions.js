// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  populateBrandFilter();
  renderPromoStats();
  renderPromos();
});

function populateBrandFilter() {
  const brands = getData('mch_brands');
  document.getElementById('promoBrand').innerHTML =
    `<option value="">All Brands</option>` +
    brands.map(b => `<option value="${b.id}">${escHtml(b.name)}</option>`).join('');
}

// ── STATS ─────────────────────────────────────────────────────────────────────
function renderPromoStats() {
  const promos  = getData('mch_promotions');
  const td      = today();
  const active  = promos.filter(p => p.isActive && (!p.endDate || p.endDate >= td)).length;
  const expired = promos.filter(p => p.endDate && p.endDate < td).length;

  document.getElementById('promoStats').innerHTML = [
    { label:'Total Promotions', value: promos.length, icon:'bi-megaphone',    color:'#2563eb' },
    { label:'Active Now',        value: active,         icon:'bi-lightning',   color:'#16a34a' },
    { label:'Inactive',          value: promos.filter(p=>!p.isActive).length, icon:'bi-pause-circle', color:'#64748b' },
    { label:'Expired',           value: expired,        icon:'bi-clock-history', color:'#dc2626' },
  ].map(s => `
    <div class="stat-card" style="--accent:${s.color};">
      <div class="stat-icon" style="background:${s.color}22;color:${s.color};"><i class="bi ${s.icon}"></i></div>
      <p class="stat-val">${s.value}</p>
      <p class="stat-lbl">${s.label}</p>
    </div>`).join('');
}

// ── RENDER ────────────────────────────────────────────────────────────────────
function renderPromos() {
  const q      = (document.getElementById('promoSearch').value || '').toLowerCase();
  const status = document.getElementById('filterPromoStatus').value;
  const td     = today();
  const promos = getData('mch_promotions');

  let list = promos.filter(p => {
    const matchQ = !q || p.title.toLowerCase().includes(q) || (p.description||'').toLowerCase().includes(q);
    const expired = p.endDate && p.endDate < td;
    const matchS = !status
      || (status === 'active'   && p.isActive && !expired)
      || (status === 'inactive' && !p.isActive)
      || (status === 'expired'  && expired);
    return matchQ && matchS;
  });

  document.getElementById('promoCount').textContent = `(${list.length} of ${promos.length})`;

  // Cards
  document.getElementById('promoGrid').innerHTML = list.length ? list.map(p => {
    const brand   = p.brandId ? getBrand(p.brandId) : null;
    const expired = p.endDate && p.endDate < td;
    const statusClass = expired ? 'b-cancelled' : p.isActive ? 'b-ready' : 'b-inactive';
    const statusLabel = expired ? 'Expired' : p.isActive ? 'Active' : 'Inactive';
    const valLabel    = p.type === 'percent' ? `${p.value}% OFF` : `Rs. ${p.value} OFF`;
    return `
    <div class="acard" style="border-top:3px solid ${p.isActive&&!expired?'var(--gold)':'#e2e8f0'};">
      <div class="acard-body">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.5rem;">
          <div style="font-size:1.5rem;font-weight:800;color:var(--navy);">${escHtml(valLabel)}</div>
          <span class="badge ${statusClass}">${statusLabel}</span>
        </div>
        <div style="font-weight:700;font-size:.95rem;color:var(--navy);margin-bottom:.25rem;">${escHtml(p.title)}</div>
        <div style="font-size:.78rem;color:#64748b;margin-bottom:.5rem;">${escHtml(p.description||'')}</div>
        <div style="font-size:.75rem;color:#94a3b8;display:flex;gap:.75rem;flex-wrap:wrap;">
          ${p.gender?`<span><i class="bi bi-person"></i> ${p.gender}</span>`:''}
          ${brand?`<span><i class="bi bi-award"></i> ${brand.name}</span>`:''}
          ${p.startDate?`<span><i class="bi bi-calendar"></i> ${fmtD(p.startDate)} – ${fmtD(p.endDate)||'∞'}</span>`:''}
        </div>
        <div style="display:flex;gap:.4rem;margin-top:.75rem;">
          <button class="btn btn-ghost btn-sm" onclick="editPromo('${p.id}')"><i class="bi bi-pencil"></i> Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deletePromo('${p.id}')"><i class="bi bi-trash"></i></button>
        </div>
      </div>
    </div>`;
  }).join('') : `<div class="text-muted" style="padding:1rem;grid-column:1/-1;text-align:center;">No promotions found.</div>`;

  // Table
  document.getElementById('promoTbl').innerHTML = list.length ? list.map((p, i) => {
    const brand   = p.brandId ? getBrand(p.brandId) : null;
    const expired = p.endDate && p.endDate < td;
    const statusLabel = expired ? 'Expired' : p.isActive ? 'Active' : 'Inactive';
    const statusClass = expired ? 'b-cancelled' : p.isActive ? 'b-ready' : 'b-inactive';
    return `<tr>
      <td>${i+1}</td>
      <td><strong>${escHtml(p.title)}</strong></td>
      <td><span class="badge b-income">${p.type==='percent'?'Percent':'Fixed'}</span></td>
      <td><strong>${p.type==='percent'?p.value+'%':'Rs. '+p.value}</strong></td>
      <td>${escHtml(p.gender||'All')} / ${escHtml(brand?.name||'All Brands')}</td>
      <td>${fmtD(p.startDate)||'—'}</td>
      <td>${fmtD(p.endDate)||'—'}</td>
      <td><span class="badge ${statusClass}">${statusLabel}</span></td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="editPromo('${p.id}')"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-danger btn-sm" onclick="deletePromo('${p.id}')"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`;
  }).join('') : `<tr><td colspan="9" class="text-muted" style="text-align:center;padding:2rem;">No promotions found.</td></tr>`;
}

// ── SAVE ──────────────────────────────────────────────────────────────────────
function savePromo() {
  const title = document.getElementById('promoTitle').value.trim();
  const value = parseFloat(document.getElementById('promoValue').value);
  if (!title)       { toast('Promotion title is required','warning'); return; }
  if (isNaN(value) || value <= 0) { toast('Enter a valid discount value','warning'); return; }

  const promos = getData('mch_promotions');
  const id     = document.getElementById('promoId').value;
  const obj    = {
    title,
    type:        document.getElementById('promoType').value,
    value,
    gender:      document.getElementById('promoGender').value,
    brandId:     document.getElementById('promoBrand').value,
    startDate:   document.getElementById('promoStart').value,
    endDate:     document.getElementById('promoEnd').value,
    description: document.getElementById('promoDesc').value.trim(),
    isActive:    document.getElementById('promoStatus').value === 'true'
  };

  if (id) {
    const idx = promos.findIndex(p => p.id === id);
    if (idx > -1) promos[idx] = { ...promos[idx], ...obj };
    toast('Promotion updated');
  } else {
    promos.push({ id: 'promo_' + uid(), createdAt: today(), ...obj });
    toast('Promotion added successfully');
  }

  saveData('mch_promotions', promos);
  closeModal('promoModal');
  renderPromoStats();
  renderPromos();
}

// ── EDIT ──────────────────────────────────────────────────────────────────────
function editPromo(id) {
  const p = getData('mch_promotions').find(x => x.id === id);
  if (!p) return;
  document.getElementById('promoModalTitle').textContent = 'Edit Promotion';
  document.getElementById('promoId').value      = p.id;
  document.getElementById('promoTitle').value   = p.title;
  document.getElementById('promoType').value    = p.type || 'percent';
  document.getElementById('promoValue').value   = p.value || '';
  document.getElementById('promoGender').value  = p.gender || '';
  document.getElementById('promoBrand').value   = p.brandId || '';
  document.getElementById('promoStart').value   = p.startDate || '';
  document.getElementById('promoEnd').value     = p.endDate || '';
  document.getElementById('promoDesc').value    = p.description || '';
  document.getElementById('promoStatus').value  = p.isActive ? 'true' : 'false';
  openModal('promoModal');
}

// ── DELETE ────────────────────────────────────────────────────────────────────
function deletePromo(id) {
  confirmDelete('Delete this promotion?', () => {
    const promos = getData('mch_promotions').filter(p => p.id !== id);
    saveData('mch_promotions', promos);
    toast('Promotion deleted','danger');
    renderPromoStats();
    renderPromos();
  });
}

// ── MODAL RESET ───────────────────────────────────────────────────────────────
const _origOpenModal = window.openModal;
window.openModal = function(id) {
  if (id === 'promoModal') {
    const title = document.getElementById('promoModalTitle');
    if (title && title.textContent !== 'Edit Promotion') {
      ['promoId','promoTitle','promoValue','promoStart','promoEnd','promoDesc'].forEach(x => {
        const el = document.getElementById(x); if(el) el.value='';
      });
      document.getElementById('promoType').value   = 'percent';
      document.getElementById('promoGender').value = '';
      document.getElementById('promoBrand').value  = '';
      document.getElementById('promoStatus').value = 'true';
      title.textContent = 'Add Promotion';
    }
  }
  _origOpenModal(id);
};
