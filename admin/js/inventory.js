checkAuth();

function render() {
  const prods = getData('mch_products');
  const cat   = document.getElementById('fCat').value;
  const q     = document.getElementById('fSearch').value.toLowerCase();
  const list  = prods.filter(p=>(!cat||p.category===cat)&&(!q||p.name.toLowerCase().includes(q)||(p.sku||'').toLowerCase().includes(q)));

  document.getElementById('s-total').textContent   = prods.length;
  document.getElementById('s-buyval').textContent  = fmt(prods.reduce((s,p)=>s+ +p.buyPrice* +p.stock,0));
  document.getElementById('s-sellval').textContent = fmt(prods.reduce((s,p)=>s+ +p.sellPrice* +p.stock,0));
  const low = prods.filter(p=>+p.stock<= +(p.lowStock||5));
  document.getElementById('s-low').textContent = low.length;
  if (low.length) {
    document.getElementById('lowAlert').style.display='block';
    document.getElementById('lowList').textContent=low.map(p=>p.name+' ('+p.stock+' left)').join(', ');
  } else {
    document.getElementById('lowAlert').style.display='none';
  }

  document.getElementById('invBody').innerHTML = list.length ? list.map(p=>{
    const isLow = +p.stock<= +(p.lowStock||5);
    return `<tr>
      <td><code>${p.sku||'—'}</code></td>
      <td><strong>${p.name}</strong>${p.supplier?'<br><small style="color:#94a3b8;">'+p.supplier+'</small>':''}</td>
      <td>${p.category}</td>
      <td>${fmt(p.buyPrice)}</td>
      <td>${fmt(p.sellPrice)}</td>
      <td style="font-weight:700;color:${isLow?'#dc2626':'#0f172a'};">${p.stock}</td>
      <td>${p.unit||'Piece'}</td>
      <td><span class="badge ${isLow?'b-cancelled':'b-ready'}">${isLow?'Low Stock':'In Stock'}</span></td>
      <td style="white-space:nowrap;">
        <button class="btn btn-ghost btn-sm" onclick="openAdj('${p.id}')" title="Adjust Stock"><i class="bi bi-arrow-left-right"></i></button>
        <button class="btn btn-primary btn-sm" onclick="editP('${p.id}')"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-danger btn-sm" onclick="delP('${p.id}')"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`;
  }).join('') : '<tr><td colspan="9" style="text-align:center;padding:2rem;color:#cbd5e1;">No products found</td></tr>';
}

function openAdd() {
  document.getElementById('pId').value='';
  document.getElementById('modalTitle').textContent='Add Product';
  ['pName','pSku','pSupplier','pLoc','pDesc'].forEach(id=>document.getElementById(id).value='');
  ['pBuy','pSell','pStock'].forEach(id=>document.getElementById(id).value=0);
  document.getElementById('pLow').value=5;
  document.getElementById('modal').style.display='flex';
}
function closeModal() { document.getElementById('modal').style.display='none'; }

function saveProduct() {
  const id   = document.getElementById('pId').value;
  const name = document.getElementById('pName').value.trim();
  const buy  = parseFloat(document.getElementById('pBuy').value);
  const sell = parseFloat(document.getElementById('pSell').value);
  const stock= parseFloat(document.getElementById('pStock').value);
  if(!name||isNaN(buy)||isNaN(sell)||isNaN(stock)){ toast('Fill all required fields','warning'); return; }
  const prods = getData('mch_products');
  const entry = {
    id: id||uid(), name,
    sku: document.getElementById('pSku').value.trim()||'SKU-'+Date.now().toString(36).toUpperCase(),
    category: document.getElementById('pCat').value,
    unit: document.getElementById('pUnit').value,
    supplier: document.getElementById('pSupplier').value.trim(),
    buyPrice: buy, sellPrice: sell, stock,
    lowStock: parseFloat(document.getElementById('pLow').value)||5,
    location: document.getElementById('pLoc').value.trim(),
    description: document.getElementById('pDesc').value.trim(),
    updatedAt: new Date().toISOString()
  };
  if(id){ const i=prods.findIndex(p=>p.id===id); if(i>-1) prods[i]={...prods[i],...entry}; }
  else { entry.createdAt=new Date().toISOString(); prods.push(entry); }
  saveData('mch_products',prods); closeModal(); toast('Saved!'); render();
}

function editP(id) {
  const p=getData('mch_products').find(x=>x.id===id); if(!p) return;
  document.getElementById('pId').value=p.id;
  document.getElementById('pName').value=p.name;
  document.getElementById('pSku').value=p.sku||'';
  document.getElementById('pCat').value=p.category;
  document.getElementById('pUnit').value=p.unit||'Piece';
  document.getElementById('pSupplier').value=p.supplier||'';
  document.getElementById('pBuy').value=p.buyPrice;
  document.getElementById('pSell').value=p.sellPrice;
  document.getElementById('pStock').value=p.stock;
  document.getElementById('pLow').value=p.lowStock||5;
  document.getElementById('pLoc').value=p.location||'';
  document.getElementById('pDesc').value=p.description||'';
  document.getElementById('modalTitle').textContent='Edit Product';
  document.getElementById('modal').style.display='flex';
}

function delP(id) {
  if(!confirm('Delete this product?')) return;
  saveData('mch_products',getData('mch_products').filter(p=>p.id!==id));
  toast('Deleted','danger'); render();
}

function openAdj(id) {
  const p=getData('mch_products').find(x=>x.id===id); if(!p) return;
  document.getElementById('adjId').value=id;
  document.getElementById('adjName').textContent=p.name+' — Current: '+p.stock+' '+p.unit;
  document.getElementById('adjQty').value=1;
  document.getElementById('adjModal').style.display='flex';
}
function closeAdj() { document.getElementById('adjModal').style.display='none'; }

function applyAdj() {
  const id=document.getElementById('adjId').value, action=document.getElementById('adjAction').value, qty=parseFloat(document.getElementById('adjQty').value)||0;
  const prods=getData('mch_products'), i=prods.findIndex(p=>p.id===id); if(i===-1) return;
  if(action==='add') prods[i].stock= +prods[i].stock+qty;
  else if(action==='remove') prods[i].stock=Math.max(0, +prods[i].stock-qty);
  else prods[i].stock=qty;
  prods[i].updatedAt=new Date().toISOString();
  saveData('mch_products',prods); closeAdj(); toast('Stock updated!'); render();
}

render();
