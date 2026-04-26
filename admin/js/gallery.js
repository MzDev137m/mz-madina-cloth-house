// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  mchWaitForSync(() => {
    renderGalleryStats();
    renderGallery();
  });
});

// ── STATS ─────────────────────────────────────────────────────────────────────
function renderGalleryStats() {
  const items   = getData('mch_gallery');
  const visible = items.filter(g => g.visible !== false).length;
  const cats    = [...new Set(items.map(g => g.category))].length;

  document.getElementById('galleryStats').innerHTML = [
    { label:'Total Photos',   value: items.length,  icon:'bi-images',          color:'#2563eb' },
    { label:'Visible on Store', value: visible,      icon:'bi-eye',             color:'#16a34a' },
    { label:'Hidden',         value: items.length - visible, icon:'bi-eye-slash', color:'#dc2626' },
    { label:'Categories',     value: cats,           icon:'bi-grid',            color:'#d97706' },
  ].map(s => `
    <div class="stat-card" style="--accent:${s.color};">
      <div class="stat-icon" style="background:${s.color}22;color:${s.color};"><i class="bi ${s.icon}"></i></div>
      <p class="stat-val">${s.value}</p>
      <p class="stat-lbl">${s.label}</p>
    </div>`).join('');
}

// ── RENDER ────────────────────────────────────────────────────────────────────
function renderGallery() {
  const q      = (document.getElementById('galSearch').value || '').toLowerCase();
  const filter = document.getElementById('galFilter').value;
  let   items  = getData('mch_gallery');

  if (q)      items = items.filter(g => (g.label||'').toLowerCase().includes(q));
  if (filter) items = items.filter(g => g.category === filter);

  const wrap = document.getElementById('galleryWrap');
  if (!items.length) {
    wrap.innerHTML = `
      <div class="acard">
        <div class="acard-body" style="text-align:center;padding:3rem;color:#94a3b8;">
          <i class="bi bi-images" style="font-size:3rem;display:block;margin-bottom:1rem;opacity:.4;"></i>
          <p>No photos yet. Click <strong>Add Photos</strong> to upload images.</p>
        </div>
      </div>`;
    return;
  }

  wrap.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;">
    ${items.map(g => `
    <div class="gal-card" style="border-radius:12px;overflow:hidden;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.07);position:relative;group;">
      <div style="height:160px;overflow:hidden;background:#f1f5f9;">
        <img src="${g.image}" alt="${escHtml(g.label||'')}" style="width:100%;height:100%;object-fit:cover;transition:transform .3s;" onmouseover="this.style.transform='scale(1.07)'" onmouseout="this.style.transform='scale(1)'">
      </div>
      ${g.visible===false ? `<div style="position:absolute;top:8px;left:8px;background:rgba(0,0,0,.6);color:#fff;font-size:.65rem;padding:.2rem .5rem;border-radius:6px;"><i class="bi bi-eye-slash"></i> Hidden</div>` : ''}
      <div style="position:absolute;top:8px;right:8px;display:flex;gap:.3rem;">
        <button onclick="editGal('${g.id}')" style="width:28px;height:28px;border:none;border-radius:7px;background:rgba(255,255,255,.9);cursor:pointer;display:flex;align-items:center;justify-content:center;" title="Edit"><i class="bi bi-pencil" style="font-size:.75rem;color:#0a2342;"></i></button>
        <button onclick="deleteGal('${g.id}')" style="width:28px;height:28px;border:none;border-radius:7px;background:rgba(220,38,38,.85);cursor:pointer;display:flex;align-items:center;justify-content:center;" title="Delete"><i class="bi bi-trash" style="font-size:.75rem;color:#fff;"></i></button>
      </div>
      <div style="padding:.6rem .8rem;">
        <div style="font-size:.78rem;font-weight:600;color:#0a2342;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(g.label||'Untitled')}</div>
        <div style="font-size:.68rem;color:#94a3b8;margin-top:.15rem;text-transform:capitalize;">${g.category||'other'}</div>
      </div>
    </div>`).join('')}
  </div>`;
}

// ── BULK UPLOAD ───────────────────────────────────────────────────────────────
function handleBulkUpload(e) {
  const files = Array.from(e.target.files);
  if (!files.length) return;

  const gallery = getData('mch_gallery');
  let   done    = 0;

  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      gallery.push({
        id:       'gal_' + uid(),
        image:    ev.target.result,
        label:    file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
        category: 'other',
        visible:  true,
        addedAt:  today()
      });
      done++;
      if (done === files.length) {
        saveData('mch_gallery', gallery);
        toast(`${files.length} photo${files.length>1?'s':''} uploaded`, 'success');
        renderGalleryStats();
        renderGallery();
      }
    };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
}

// ── EDIT ──────────────────────────────────────────────────────────────────────
function editGal(id) {
  const g = getData('mch_gallery').find(x => x.id === id);
  if (!g) return;
  document.getElementById('galEditId').value       = g.id;
  document.getElementById('galEditPreview').src    = g.image;
  document.getElementById('galLabel').value        = g.label || '';
  document.getElementById('galCat').value          = g.category || 'other';
  document.getElementById('galVisible').value      = g.visible === false ? 'false' : 'true';
  openModal('galModal');
}

function saveGalEdit() {
  const id      = document.getElementById('galEditId').value;
  const gallery = getData('mch_gallery');
  const idx     = gallery.findIndex(g => g.id === id);
  if (idx < 0) return;
  gallery[idx].label    = document.getElementById('galLabel').value.trim();
  gallery[idx].category = document.getElementById('galCat').value;
  gallery[idx].visible  = document.getElementById('galVisible').value === 'true';
  saveData('mch_gallery', gallery);
  closeModal('galModal');
  toast('Photo updated');
  renderGalleryStats();
  renderGallery();
}

// ── DELETE ────────────────────────────────────────────────────────────────────
function deleteGal(id) {
  confirmDelete('Delete this photo from gallery?', () => {
    saveData('mch_gallery', getData('mch_gallery').filter(g => g.id !== id));
    toast('Photo deleted', 'danger');
    renderGalleryStats();
    renderGallery();
  });
}

// ── CLEAR ALL ─────────────────────────────────────────────────────────────────
function clearAll() {
  confirmDelete('Clear ALL photos from gallery? This cannot be undone.', () => {
    saveData('mch_gallery', []);
    toast('Gallery cleared', 'danger');
    renderGalleryStats();
    renderGallery();
  });
}

// ── EXPORT ────────────────────────────────────────────────────────────────────
function exportGallery() {
  const rows = getData('mch_gallery').map(g => ({
    Label:    g.label || '',
    Category: g.category || '',
    Visible:  g.visible !== false ? 'Yes' : 'No',
    Added:    g.addedAt || ''
  }));
  exportCSV(rows, 'gallery', ['Label','Category','Visible','Added']);
}
