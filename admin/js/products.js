// ── STATE ─────────────────────────────────────────────────────────────────────
let _viewMode = 'grid'; // 'grid' | 'table'
let _selSizes  = [];
let _selColors = [];

// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  mchWaitForSync(() => {
    populateFabricSelect();
    populateFilterDropdowns();
    renderProdStats();
    renderProducts();
  });
});

function populateFabricSelect() {
  const el = document.getElementById('prodFabric');
  el.innerHTML = `<option value="">Select Fabric</option>` +
    FABRICS.map(f => `<option value="${f}">${f}</option>`).join('');
}

function populateFilterDropdowns() {
  const brands = getData('mch_brands');
  const cats   = getData('mch_categories');
  const fb = document.getElementById('filterBrand');
  const fc = document.getElementById('filterCat');
  fb.innerHTML = `<option value="">All Brands</option>` +
    brands.map(b => `<option value="${b.id}">${escHtml(b.name)}</option>`).join('');
  fc.innerHTML = `<option value="">All Categories</option>` +
    cats.map(c => `<option value="${c.id}">${escHtml(c.name)}</option>`).join('');
}

function populateModalDropdowns() {
  const brands = getData('mch_brands').filter(b => b.isActive);
  const cats   = getData('mch_categories').filter(c => c.isActive);
  document.getElementById('prodBrand').innerHTML =
    `<option value="">Select Brand</option>` +
    brands.map(b => `<option value="${b.id}">${escHtml(b.name)}</option>`).join('');
  document.getElementById('prodCategory').innerHTML =
    `<option value="">Select Category</option>` +
    cats.map(c => `<option value="${c.id}">${escHtml(c.name)} (${c.gender})</option>`).join('');
}

// ── STATS ─────────────────────────────────────────────────────────────────────
function renderProdStats() {
  const prods  = getData('mch_products');
  const active = prods.filter(p => p.isActive).length;
  const low    = prods.filter(p => parseInt(p.stock||0) <= parseInt(p.lowStock||5) && parseInt(p.stock||0) > 0).length;
  const out    = prods.filter(p => parseInt(p.stock||0) <= 0).length;

  document.getElementById('prodStats').innerHTML = [
    { label:'Total Products', value: prods.length, icon:'bi-bag',                   color:'#2563eb' },
    { label:'Active',          value: active,        icon:'bi-check-circle',           color:'#16a34a' },
    { label:'Low Stock',       value: low,           icon:'bi-exclamation-triangle',   color:'#d97706' },
    { label:'Out of Stock',    value: out,           icon:'bi-x-circle',               color:'#dc2626' },
  ].map(s => `
    <div class="stat-card" style="--accent:${s.color};">
      <div class="stat-icon" style="background:${s.color}22;color:${s.color};"><i class="bi ${s.icon}"></i></div>
      <p class="stat-val">${s.value}</p>
      <p class="stat-lbl">${s.label}</p>
    </div>`).join('');
}

// ── RENDER ────────────────────────────────────────────────────────────────────
function renderProducts() {
  const q      = (document.getElementById('prodSearch').value || '').toLowerCase();
  const brand  = document.getElementById('filterBrand').value;
  const cat    = document.getElementById('filterCat').value;
  const gender = document.getElementById('filterProdGender').value;
  const status = document.getElementById('filterProdStatus').value;
  const prods  = getData('mch_products');

  let list = prods.filter(p => {
    const matchQ = !q || p.name.toLowerCase().includes(q) || (p.sku||'').toLowerCase().includes(q);
    const matchB = !brand  || p.brandId === brand;
    const matchC = !cat    || p.categoryId === cat;
    const matchG = !gender || p.gender === gender;
    const matchS = !status || (status === 'active' ? p.isActive : !p.isActive);
    return matchQ && matchB && matchC && matchG && matchS;
  });

  const countEl = document.getElementById('prodCount');
  if (countEl) countEl.textContent = `(${list.length} of ${prods.length})`;

  if (_viewMode === 'grid') {
    document.getElementById('prodGrid').innerHTML = list.length ? list.map(p => {
      const brand = getBrand(p.brandId);
      const saleP = p.discount ? Math.round(p.price * (1 - p.discount / 100)) : p.price;
      const imgContent = p.image
        ? `<img src="${p.image}" alt="${escHtml(p.name)}" style="width:100%;height:100%;object-fit:cover;">`
        : `<i class="bi bi-bag" style="font-size:2.5rem;color:var(--gold);opacity:.5;"></i>`;
      return `
      <div class="p-card" onclick="viewProduct('${p.id}')">
        <div class="p-card-img" style="${p.image?'':'background:linear-gradient(135deg,#0a234215,#c9a96e15);'}cursor:pointer;">
          ${imgContent}
          ${parseInt(p.stock||0)<=0?'<span class="badge b-inactive" style="position:absolute;top:8px;left:8px;">Out of Stock</span>':
            parseInt(p.stock||0)<=parseInt(p.lowStock||5)?'<span class="badge" style="position:absolute;top:8px;left:8px;background:#fef3c7;color:#92400e;">Low Stock</span>':''}
          ${p.discount?`<span class="badge b-active" style="position:absolute;top:8px;right:8px;">${p.discount}% OFF</span>`:''}
        </div>
        <div class="p-card-body">
          <div class="p-card-brand">${escHtml(brand?.name||'—')}</div>
          <div class="p-card-name">${escHtml(p.name)}</div>
          <div class="p-card-price">
            ${fmt(saleP)}
            ${p.discount?`<del style="font-size:.75rem;color:#94a3b8;margin-left:.3rem;">${fmt(p.price)}</del>`:''}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:.4rem;">
            ${genderBadge(p.gender)}
            ${stockBadge(p.stock, p.lowStock)}
          </div>
          <div style="display:flex;gap:.4rem;margin-top:.6rem;" onclick="event.stopPropagation()">
            <button class="btn btn-ghost btn-sm" style="flex:1;" onclick="openProductModal('${p.id}')"><i class="bi bi-pencil"></i> Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')"><i class="bi bi-trash"></i></button>
          </div>
        </div>
      </div>`;
    }).join('') : `<div class="text-muted" style="padding:2rem;grid-column:1/-1;text-align:center;">No products found.</div>`;
  } else {
    document.getElementById('prodTbl').innerHTML = list.length ? list.map((p, i) => {
      const brand = getBrand(p.brandId);
      const cat   = getCategory(p.categoryId);
      const saleP = p.discount ? Math.round(p.price * (1 - p.discount / 100)) : p.price;
      return `<tr>
        <td>${i+1}</td>
        <td style="font-size:.75rem;color:#64748b;">${escHtml(p.sku||'—')}</td>
        <td><strong style="cursor:pointer;" onclick="viewProduct('${p.id}')">${escHtml(p.name)}</strong></td>
        <td>${escHtml(brand?.name||'—')}</td>
        <td>${escHtml(cat?.name||'—')}</td>
        <td>${genderBadge(p.gender)}</td>
        <td>${fmt(saleP)}${p.discount?` <span style="font-size:.7rem;color:#16a34a;">(${p.discount}%off)</span>`:''}</td>
        <td>${stockBadge(p.stock, p.lowStock)}</td>
        <td><span class="badge b-${p.isActive?'active':'inactive'}">${p.isActive?'Active':'Inactive'}</span></td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="openProductModal('${p.id}')"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`;
    }).join('') : `<tr><td colspan="10" class="text-muted" style="text-align:center;padding:2rem;">No products found.</td></tr>`;
  }
}

// ── VIEW TOGGLE ───────────────────────────────────────────────────────────────
function toggleView() {
  _viewMode = _viewMode === 'grid' ? 'table' : 'grid';
  const btn = document.getElementById('viewToggleBtn');
  btn.innerHTML = _viewMode === 'grid'
    ? '<i class="bi bi-grid"></i>'
    : '<i class="bi bi-list-ul"></i>';
  document.getElementById('prodGridWrap').style.display  = _viewMode === 'grid'  ? '' : 'none';
  document.getElementById('prodTableWrap').style.display = _viewMode === 'table' ? '' : 'none';
  renderProducts();
}

// ── OPEN PRODUCT MODAL ────────────────────────────────────────────────────────
function openProductModal(editId) {
  populateModalDropdowns();
  buildSizePicker([]);
  buildColorPicker([]);
  _selSizes  = [];
  _selColors = [];

  if (editId) {
    const p = getData('mch_products').find(x => x.id === editId);
    if (!p) return;
    document.getElementById('prodModalTitle').textContent = 'Edit Product';
    document.getElementById('prodId').value        = p.id;
    document.getElementById('prodName').value      = p.name;
    document.getElementById('prodSKU').value       = p.sku || '';
    document.getElementById('prodPrice').value     = p.price || '';
    document.getElementById('prodCost').value      = p.costPrice || '';
    document.getElementById('prodDiscount').value  = p.discount || '';
    document.getElementById('prodStock').value     = p.stock || '';
    document.getElementById('prodLowStock').value  = p.lowStock || '';
    document.getElementById('prodDesc').value      = p.description || '';
    document.getElementById('prodStatus').value    = p.isActive ? 'true' : 'false';
    document.getElementById('prodGender').value    = p.gender || '';
    document.getElementById('prodFabric').value    = p.fabric || '';
    document.getElementById('prodImg').value       = p.image || '';
    const ibox = document.getElementById('prodImgBox');
    if (p.image) { ibox.style.backgroundImage = `url(${p.image})`; ibox.classList.add('has-img'); }
    else { ibox.style.backgroundImage = ''; ibox.classList.remove('has-img'); }
    _selSizes  = p.sizes  || [];
    _selColors = p.colors || [];
    buildSizePicker(_selSizes);
    buildColorPicker(_selColors);
    setTimeout(() => {
      document.getElementById('prodBrand').value    = p.brandId || '';
      document.getElementById('prodCategory').value = p.categoryId || '';
    }, 50);
  } else {
    document.getElementById('prodModalTitle').textContent = 'Add Product';
    document.getElementById('prodId').value        = '';
    document.getElementById('prodName').value      = '';
    document.getElementById('prodSKU').value       = '';
    document.getElementById('prodPrice').value     = '';
    document.getElementById('prodCost').value      = '';
    document.getElementById('prodDiscount').value  = '';
    document.getElementById('prodStock').value     = '';
    document.getElementById('prodLowStock').value  = '';
    document.getElementById('prodDesc').value      = '';
    document.getElementById('prodStatus').value    = 'true';
    document.getElementById('prodGender').value    = '';
    document.getElementById('prodFabric').value    = '';
    document.getElementById('prodImg').value       = '';
    document.getElementById('prodImgInput').value  = '';
    const ibox = document.getElementById('prodImgBox');
    ibox.style.backgroundImage = '';
    ibox.classList.remove('has-img');
  }
  openModal('productModal');
}

// ── SIZE / COLOR PICKERS ──────────────────────────────────────────────────────
function buildSizePicker(selected) {
  document.getElementById('sizePicker').innerHTML = SIZES.map(s => `
    <span class="chip-size${selected.includes(s)?' selected':''}" onclick="toggleSize('${s}',this)">${s}</span>`).join('');
}

function toggleSize(s, el) {
  if (_selSizes.includes(s)) { _selSizes = _selSizes.filter(x => x !== s); el.classList.remove('selected'); }
  else { _selSizes.push(s); el.classList.add('selected'); }
}

function buildColorPicker(selected) {
  document.getElementById('colorPicker').innerHTML = Object.entries(COLORS_MAP).map(([name, hex]) => `
    <span class="chip-color${selected.includes(name)?' selected':''}"
      style="background:${hex};${name==='White'?'border:1.5px solid #ddd;':''}"
      title="${name}" onclick="toggleColor('${name}',this)">
      ${selected.includes(name)?'<i class="bi bi-check" style="color:'+(name==='White'||name==='Cream'||name==='Beige'?'#333':'#fff')+'"></i>':''}
    </span>`).join('');
}

function toggleColor(name, el) {
  if (_selColors.includes(name)) {
    _selColors = _selColors.filter(x => x !== name);
    el.classList.remove('selected');
    el.innerHTML = '';
  } else {
    _selColors.push(name);
    el.classList.add('selected');
    const light = ['White','Cream','Beige','Yellow'];
    el.innerHTML = `<i class="bi bi-check" style="color:${light.includes(name)?'#333':'#fff'}"></i>`;
  }
}

// ── IMAGE UPLOAD ──────────────────────────────────────────────────────────────
function handleProductImg(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const b64 = ev.target.result;
    document.getElementById('prodImg').value = b64;
    const box = document.getElementById('prodImgBox');
    box.style.backgroundImage = `url(${b64})`;
    box.classList.add('has-img');
  };
  reader.readAsDataURL(file);
}

// ── SAVE ──────────────────────────────────────────────────────────────────────
function saveProduct() {
  const name     = document.getElementById('prodName').value.trim();
  const brandId  = document.getElementById('prodBrand').value;
  const catId    = document.getElementById('prodCategory').value;
  const gender   = document.getElementById('prodGender').value;
  const price    = parseFloat(document.getElementById('prodPrice').value);
  const stock    = parseInt(document.getElementById('prodStock').value);

  if (!name)    { toast('Product name is required','warning'); return; }
  if (!brandId) { toast('Please select a brand','warning'); return; }
  if (!catId)   { toast('Please select a category','warning'); return; }
  if (!gender)  { toast('Please select a gender','warning'); return; }
  if (isNaN(price) || price < 0) { toast('Enter a valid price','warning'); return; }
  if (isNaN(stock) || stock < 0) { toast('Enter a valid stock quantity','warning'); return; }

  const products = getData('mch_products');
  const id       = document.getElementById('prodId').value;
  let   sku      = document.getElementById('prodSKU').value.trim();
  if (!sku) sku  = 'MCH-' + uid().toUpperCase().slice(0,6);

  const obj = {
    name, brandId, categoryId: catId, gender,
    image:       document.getElementById('prodImg').value || '',
    fabric:      document.getElementById('prodFabric').value,
    price,
    costPrice:   parseFloat(document.getElementById('prodCost').value) || 0,
    discount:    parseFloat(document.getElementById('prodDiscount').value) || 0,
    stock,
    lowStock:    parseInt(document.getElementById('prodLowStock').value) || 5,
    sizes:       [..._selSizes],
    colors:      [..._selColors],
    description: document.getElementById('prodDesc').value.trim(),
    isActive:    document.getElementById('prodStatus').value === 'true',
    sku
  };

  if (id) {
    const idx = products.findIndex(p => p.id === id);
    if (idx > -1) products[idx] = { ...products[idx], ...obj };
    toast('Product updated successfully');
  } else {
    products.push({ id: 'prd_' + uid(), createdAt: today(), ...obj });
    toast('Product added successfully');
  }

  saveData('mch_products', products);
  closeModal('productModal');
  renderProdStats();
  renderProducts();
}

// ── VIEW PRODUCT ──────────────────────────────────────────────────────────────
function viewProduct(id) {
  const p = getData('mch_products').find(x => x.id === id);
  if (!p) return;
  const brand = getBrand(p.brandId);
  const cat   = getCategory(p.categoryId);
  const saleP = p.discount ? Math.round(p.price * (1 - p.discount / 100)) : p.price;

  document.getElementById('viewProductBody').innerHTML = `
    <div class="frow fcol2" style="gap:1.5rem;">
      <div>
        <div style="${p.image?'':'background:linear-gradient(135deg,#0a234215,#c9a96e15);'}height:200px;border-radius:10px;display:flex;align-items:center;justify-content:center;overflow:hidden;">
          ${p.image
            ? `<img src="${p.image}" alt="${escHtml(p.name)}" style="width:100%;height:100%;object-fit:cover;">`
            : `<i class="bi bi-bag" style="font-size:4rem;color:var(--gold);opacity:.4;"></i>`}
        </div>
      </div>
      <div>
        <div style="font-size:.75rem;color:#64748b;margin-bottom:.25rem;">${escHtml(p.sku||'—')}</div>
        <h3 style="margin:0 0 .5rem;color:var(--navy);">${escHtml(p.name)}</h3>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.75rem;">
          ${genderBadge(p.gender)}
          <span class="badge b-${p.isActive?'active':'inactive'}">${p.isActive?'Active':'Inactive'}</span>
        </div>
        <table style="font-size:.83rem;width:100%;border-collapse:collapse;">
          <tr><td style="padding:.3rem .5rem .3rem 0;color:#64748b;white-space:nowrap;">Brand</td><td><strong>${escHtml(brand?.name||'—')}</strong></td></tr>
          <tr><td style="padding:.3rem .5rem .3rem 0;color:#64748b;">Category</td><td><strong>${escHtml(cat?.name||'—')}</strong></td></tr>
          <tr><td style="padding:.3rem .5rem .3rem 0;color:#64748b;">Fabric</td><td>${escHtml(p.fabric||'—')}</td></tr>
          <tr><td style="padding:.3rem .5rem .3rem 0;color:#64748b;">Price</td><td><strong style="color:var(--navy);">${fmt(saleP)}</strong>${p.discount?` <del style="font-size:.75rem;color:#94a3b8;">${fmt(p.price)}</del> <span style="color:#16a34a;font-size:.75rem;">${p.discount}% off</span>`:''}</td></tr>
          <tr><td style="padding:.3rem .5rem .3rem 0;color:#64748b;">Cost Price</td><td>${fmt(p.costPrice||0)}</td></tr>
          <tr><td style="padding:.3rem .5rem .3rem 0;color:#64748b;">Stock</td><td>${stockBadge(p.stock,p.lowStock)}</td></tr>
        </table>
      </div>
    </div>
    ${p.sizes?.length?`<div class="fgroup" style="margin-top:1rem;"><label class="flabel">Available Sizes</label><div>${p.sizes.map(s=>`<span class="chip-size-sm">${s}</span>`).join('')}</div></div>`:''}
    ${p.colors?.length?`<div class="fgroup"><label class="flabel">Available Colors</label><div style="display:flex;gap:.4rem;flex-wrap:wrap;">${p.colors.map(c=>`<span style="display:inline-flex;align-items:center;gap:.3rem;font-size:.78rem;"><span style="width:14px;height:14px;border-radius:50%;background:${COLORS_MAP[c]||'#ccc'};border:1px solid #ddd;display:inline-block;"></span>${c}</span>`).join('')}</div></div>`:''}
    ${p.description?`<div class="fgroup"><label class="flabel">Description</label><p style="font-size:.83rem;color:#475569;margin:0;">${escHtml(p.description)}</p></div>`:''}
    <div style="margin-top:1rem;display:flex;gap:.5rem;">
      <button class="btn btn-gold btn-sm" onclick="closeModal('viewProductModal');openProductModal('${p.id}')"><i class="bi bi-pencil"></i> Edit</button>
    </div>`;
  openModal('viewProductModal');
}

// ── DELETE ────────────────────────────────────────────────────────────────────
function deleteProduct(id) {
  confirmDelete('Delete this product? This cannot be undone.', () => {
    const products = getData('mch_products').filter(p => p.id !== id);
    saveData('mch_products', products);
    toast('Product deleted','danger');
    renderProdStats();
    renderProducts();
  });
}

// ── EXPORT ────────────────────────────────────────────────────────────────────
function exportProducts() {
  const prods = getData('mch_products');
  const rows  = prods.map(p => {
    const brand = getBrand(p.brandId);
    const cat   = getCategory(p.categoryId);
    return {
      SKU: p.sku||'', Name: p.name, Brand: brand?.name||'', Category: cat?.name||'',
      Gender: p.gender||'', Fabric: p.fabric||'', Price: p.price||0,
      CostPrice: p.costPrice||0, Discount: p.discount||0, Stock: p.stock||0,
      Sizes: (p.sizes||[]).join(';'), Colors: (p.colors||[]).join(';'),
      Status: p.isActive?'Active':'Inactive'
    };
  });
  exportCSV(rows, 'products', ['SKU','Name','Brand','Category','Gender','Fabric','Price','CostPrice','Discount','Stock','Sizes','Colors','Status']);
}
