// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderCatStats();
  renderCategories();
});

// ── STATS ─────────────────────────────────────────────────────────────────────
function renderCatStats() {
  const cats = getData('mch_categories');
  const byCat = g => cats.filter(c => c.gender === g).length;
  document.getElementById('catStats').innerHTML = [
    { label:'Total Categories', value: cats.length,    icon:'bi-grid-3x3-gap', color:'#2563eb' },
    { label:'Men',              value: byCat('Men'),   icon:'bi-person',       color:'#0a2342' },
    { label:'Women',            value: byCat('Women'), icon:'bi-person-heart', color:'#ec4899' },
    { label:'Kids',             value: byCat('Kids'),  icon:'bi-emoji-smile',  color:'#16a34a' },
  ].map(s => `
    <div class="stat-card" style="--accent:${s.color};">
      <div class="stat-icon" style="background:${s.color}22;color:${s.color};"><i class="bi ${s.icon}"></i></div>
      <p class="stat-val">${s.value}</p>
      <p class="stat-lbl">${s.label}</p>
    </div>`).join('');
}

// ── RENDER ────────────────────────────────────────────────────────────────────
function renderCategories() {
  const q      = (document.getElementById('catSearch').value || '').toLowerCase();
  const gender = document.getElementById('filterGender').value;
  const status = document.getElementById('filterCatStatus').value;
  const cats   = getData('mch_categories');
  const prods  = getData('mch_products');

  let list = cats.filter(c => {
    const matchQ = !q || c.name.toLowerCase().includes(q) || (c.description||'').toLowerCase().includes(q);
    const matchG = !gender || c.gender === gender;
    const matchS = !status || (status === 'active' ? c.isActive : !c.isActive);
    return matchQ && matchG && matchS;
  });

  document.getElementById('catCount').textContent = `(${list.length} of ${cats.length})`;

  document.getElementById('catTbl').innerHTML = list.length ? list.map((c, i) => {
    const pcount = prods.filter(p => p.categoryId === c.id).length;
    return `<tr>
      <td>${i+1}</td>
      <td><strong>${escHtml(c.name)}</strong></td>
      <td>${genderBadge(c.gender)}</td>
      <td style="max-width:240px;white-space:normal;font-size:.8rem;">${escHtml(c.description||'—')}</td>
      <td><span class="badge" style="background:#e0e7ef;color:#0a2342;">${pcount}</span></td>
      <td><span class="badge b-${c.isActive?'active':'inactive'}">${c.isActive?'Active':'Inactive'}</span></td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="editCategory('${c.id}')"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-danger btn-sm" onclick="deleteCategory('${c.id}')"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`;
  }).join('') : `<tr><td colspan="7" class="text-muted" style="text-align:center;padding:2rem;">No categories found.</td></tr>`;
}

// ── SAVE ──────────────────────────────────────────────────────────────────────
function saveCategory() {
  const name   = document.getElementById('catName').value.trim();
  const gender = document.getElementById('catGender').value;
  if (!name)   { toast('Category name is required','warning'); return; }
  if (!gender) { toast('Please select a gender','warning'); return; }

  const cats = getData('mch_categories');
  const id   = document.getElementById('catId').value;
  const obj  = {
    name, gender,
    description: document.getElementById('catDesc').value.trim(),
    isActive:    document.getElementById('catStatus').value === 'true'
  };

  if (id) {
    const idx = cats.findIndex(c => c.id === id);
    if (idx > -1) cats[idx] = { ...cats[idx], ...obj };
    toast('Category updated successfully');
  } else {
    const dup = cats.find(c => c.name.toLowerCase() === name.toLowerCase() && c.gender === gender);
    if (dup) { toast('Category already exists for this gender','warning'); return; }
    cats.push({ id: 'cat_' + uid(), ...obj });
    toast('Category added successfully');
  }

  saveData('mch_categories', cats);
  closeModal('catModal');
  renderCatStats();
  renderCategories();
}

// ── EDIT ──────────────────────────────────────────────────────────────────────
function editCategory(id) {
  const c = getData('mch_categories').find(c => c.id === id);
  if (!c) return;
  document.getElementById('catModalTitle').textContent = 'Edit Category';
  document.getElementById('catId').value     = c.id;
  document.getElementById('catName').value   = c.name;
  document.getElementById('catGender').value = c.gender || '';
  document.getElementById('catDesc').value   = c.description || '';
  document.getElementById('catStatus').value = c.isActive ? 'true' : 'false';
  openModal('catModal');
}

// ── DELETE ────────────────────────────────────────────────────────────────────
function deleteCategory(id) {
  confirmDelete('Delete this category? Products using it will not be deleted.', () => {
    const cats = getData('mch_categories').filter(c => c.id !== id);
    saveData('mch_categories', cats);
    toast('Category deleted','danger');
    renderCatStats();
    renderCategories();
  });
}

// ── EXPORT ────────────────────────────────────────────────────────────────────
function exportCategories() {
  const cats  = getData('mch_categories');
  const prods = getData('mch_products');
  const rows  = cats.map(c => ({
    Name:        c.name,
    Gender:      c.gender || '',
    Description: c.description || '',
    Products:    prods.filter(p => p.categoryId === c.id).length,
    Status:      c.isActive ? 'Active' : 'Inactive'
  }));
  exportCSV(rows, 'categories', ['Name','Gender','Description','Products','Status']);
}

// ── MODAL RESET ───────────────────────────────────────────────────────────────
const _origOpenModal = window.openModal;
window.openModal = function(id) {
  if (id === 'catModal') {
    const title = document.getElementById('catModalTitle');
    if (title && title.textContent !== 'Edit Category') {
      document.getElementById('catId').value     = '';
      document.getElementById('catName').value   = '';
      document.getElementById('catGender').value = '';
      document.getElementById('catDesc').value   = '';
      document.getElementById('catStatus').value = 'true';
      title.textContent = 'Add Category';
    }
  }
  _origOpenModal(id);
};
