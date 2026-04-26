// ── STORE DATA BRIDGE ─────────────────────────────────────────────────────────
// Real-time Firestore sync — auto-updates on all devices without page refresh.

(async function () {
  const WA = '923004260700';

  // ── HELPERS ────────────────────────────────────────────────────────────────
  function getData(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
  }

  function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function fmt(n) {
    return 'Rs. ' + Number(n || 0).toLocaleString('en-PK');
  }

  function waMsg(name, price) {
    const msg = encodeURIComponent(
      `Assalam o Alaikum! I'm interested in "${name}"${price ? ' (Price: ' + fmt(price) + ')' : ''}. Please share details.`
    );
    return `https://wa.me/${WA}?text=${msg}`;
  }

  // ── PRODUCTS ────────────────────────────────────────────────────────────────
  function renderShop() {
    const grid = document.getElementById('shopGrid');
    if (!grid) return;

    const products = getData('mch_products').filter(p => p.isActive && parseInt(p.stock || 0) > 0);
    if (!products.length) return; // keep hardcoded fallback

    const cats   = getData('mch_categories');
    const brands = getData('mch_brands');

    grid.innerHTML = products.slice(0, 8).map(p => {
      const cat   = cats.find(c => c.id === p.categoryId);
      const brand = brands.find(b => b.id === p.brandId);
      const saleP = p.discount ? Math.round(p.price * (1 - p.discount / 100)) : p.price;
      const imgHtml = p.image
        ? `<img src="${p.image}" alt="${escHtml(p.name)}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy">`
        : `<div class="w-full h-full flex items-center justify-center" style="background:linear-gradient(135deg,#0a234215,#c9a96e25);"><i class="bi bi-bag" style="font-size:3rem;color:#c9a96e;opacity:.5;"></i></div>`;

      const subtitle = [p.gender, cat?.name].filter(Boolean).join(' · ');
      const tags = [
        p.fabric   ? `<span class="tag-sm">${escHtml(p.fabric)}</span>` : '',
        p.discount ? `<span class="tag-sm" style="background:#dcfce7;color:#166534;">${p.discount}% OFF</span>` : '',
        brand      ? `<span class="tag-sm">${escHtml(brand.name)}</span>` : ''
      ].filter(Boolean).join('');

      return `
      <div class="product-card card-float card-gold-border rounded-2xl bg-white shadow-sm reveal-up group overflow-hidden">
        <div class="relative overflow-hidden h-56">
          ${imgHtml}
          <div class="product-overlay">
            <a href="${waMsg(p.name, saleP)}" target="_blank" class="wa-enquire-btn">
              <i class="bi bi-whatsapp"></i> Ask on WhatsApp
            </a>
          </div>
          ${p.discount ? `<div style="position:absolute;top:10px;left:10px;background:#c9a96e;color:#fff;font-size:.7rem;font-weight:700;padding:.2rem .55rem;border-radius:20px;">${p.discount}% OFF</div>` : ''}
        </div>
        <div class="p-5">
          <p class="text-xs uppercase tracking-[.2em] mb-1" style="color:var(--muted);">${escHtml(subtitle)}</p>
          <h5 class="font-semibold text-lg" style="color:var(--navy);">${escHtml(p.name)}</h5>
          <div class="flex flex-wrap gap-1.5 mt-2">${tags}</div>
          ${p.description ? `<p class="text-sm mt-2" style="color:var(--muted);">${escHtml(p.description.substring(0,80))}${p.description.length>80?'…':''}</p>` : ''}
          <div class="flex items-center justify-between mt-3">
            <div>
              <span class="font-bold text-base" style="color:var(--navy);">${fmt(saleP)}</span>
              ${p.discount ? `<del class="text-xs ml-1" style="color:var(--muted);">${fmt(p.price)}</del>` : ''}
            </div>
          </div>
          <a href="${waMsg(p.name, saleP)}" target="_blank" class="wa-card-btn mt-4">
            <i class="bi bi-whatsapp"></i> Enquire Now
          </a>
        </div>
      </div>`;
    }).join('');
  }

  // ── BRANDS ──────────────────────────────────────────────────────────────────
  function renderBrands() {
    const grid = document.getElementById('brandsGrid');
    if (!grid) return;

    const brands   = getData('mch_brands').filter(b => b.isActive);
    if (!brands.length) return; // keep hardcoded fallback

    const products = getData('mch_products');

    grid.innerHTML = brands.map(b => {
      const pcount   = products.filter(p => p.brandId === b.id).length;
      const initials = b.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

      const imgHtml = b.image
        ? `<img src="${b.image}" alt="${escHtml(b.name)}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy">`
        : `<div class="w-full h-full flex items-center justify-center" style="background:rgba(201,169,110,.15);">
             <span style="font-size:2.5rem;font-weight:800;color:#c9a96e;font-family:'Playfair Display',serif;">${escHtml(initials)}</span>
           </div>`;

      return `
      <div class="brand-card-dark reveal-up overflow-hidden group">
        <div class="overflow-hidden h-44 bg-white/5">
          ${imgHtml}
        </div>
        <div class="p-4">
          <h5 class="font-semibold text-base">${escHtml(b.name)}</h5>
          <p class="text-xs mt-1">${escHtml(b.origin || '')}${b.origin && pcount ? ' · ' : ''}${pcount ? pcount + ' products' : ''}</p>
          ${b.description ? `<p class="text-xs mt-1" style="color:rgba(255,255,255,.45);">${escHtml(b.description.substring(0,60))}${b.description.length>60?'…':''}</p>` : ''}
        </div>
      </div>`;
    }).join('');
  }

  // ── GALLERY ─────────────────────────────────────────────────────────────────
  function renderGallery() {
    const grid = document.getElementById('storeGallery');
    if (!grid) return;

    const items = getData('mch_gallery').filter(g => g.visible !== false);
    if (!items.length) return; // keep hardcoded fallback

    grid.innerHTML = items.map(g => `
      <div class="gallery-item" onclick="openLightbox(this)">
        <img src="${g.image}" alt="${escHtml(g.label||'')}" loading="lazy">
        <div class="gallery-label">${escHtml(g.label||'')}</div>
      </div>`).join('');
  }

  function renderAll() {
    renderShop();
    renderBrands();
    renderGallery();
  }

  // ── REAL-TIME FIREBASE SYNC ────────────────────────────────────────────────
  // onSnapshot keeps a live connection — any admin change reflects instantly
  // on every open browser/device without a page refresh.

  const STORE_KEYS = ['mch_products', 'mch_brands', 'mch_categories', 'mch_gallery'];
  // Script loads at bottom of body — DOM is already ready by the time this runs
  let domReady         = document.readyState !== 'loading';
  let fullyInitialized = false;
  const loadedKeys     = new Set();

  if (!domReady) {
    document.addEventListener('DOMContentLoaded', () => {
      domReady = true;
      if (fullyInitialized) renderAll();
    });
  }

  try {
    const [{ initializeApp, getApps }, { getFirestore, doc, onSnapshot }] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js'),
    ]);

    const config = {
      apiKey:            "AIzaSyDpYmD6FrOLfPMKdvnX5DoNLdzLYh2vFaM",
      authDomain:        "mz-projects-6f5a9.firebaseapp.com",
      projectId:         "mz-projects-6f5a9",
      storageBucket:     "mz-projects-6f5a9.firebasestorage.app",
      messagingSenderId: "454812915813",
      appId:             "1:454812915813:web:8d8e6b955011273c148e8c",
    };

    const app = getApps().find(a => a.name === 'mch-store') || initializeApp(config, 'mch-store');
    const db  = getFirestore(app);

    STORE_KEYS.forEach(key => {
      onSnapshot(
        doc(db, 'clothhouse', key),
        (snap) => {
          if (snap.exists() && snap.data().items !== undefined) {
            localStorage.setItem(key, JSON.stringify(snap.data().items));
          }
          loadedKeys.add(key);

          if (!fullyInitialized) {
            // Wait for all 4 keys to arrive before first render
            if (loadedKeys.size >= STORE_KEYS.length) {
              fullyInitialized = true;
              if (domReady) renderAll();
            }
          } else if (domReady) {
            // Subsequent real-time update from admin — re-render immediately
            renderAll();
          }
        },
        (err) => {
          console.warn(`[MCH Store] Snapshot error for ${key}:`, err);
          loadedKeys.add(key);
          if (!fullyInitialized && loadedKeys.size >= STORE_KEYS.length) {
            fullyInitialized = true;
            if (domReady) renderAll();
          }
        }
      );
    });

  } catch (e) {
    console.warn('[MCH Store] Firebase init failed, using local data.', e);
    document.addEventListener('DOMContentLoaded', renderAll);
  }

})();
