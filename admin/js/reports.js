// ── INIT ──────────────────────────────────────────────────────────────────────
let _charts = {};

document.addEventListener('DOMContentLoaded', () => {
  const monthEl = document.getElementById('reportMonth');
  monthEl.value = today().slice(0, 7);
  renderReports();
});

// ── MAIN RENDER ───────────────────────────────────────────────────────────────
function renderReports() {
  const mo      = document.getElementById('reportMonth').value || today().slice(0, 7);
  const txs     = getData('mch_transactions');
  const orders  = getData('mch_orders');
  const prods   = getData('mch_products');
  const tailor  = getData('mch_tailoring');

  const monthTxs  = txs.filter(t => (t.date||'').startsWith(mo));
  const totalInc  = monthTxs.filter(t=>t.type==='income').reduce((s,t)=>s+ +t.amount,0);
  const totalExp  = monthTxs.filter(t=>t.type==='expense').reduce((s,t)=>s+ +t.amount,0);
  const totalOrd  = orders.filter(o=>(o.date||'').startsWith(mo)).length;
  const stockVal  = prods.reduce((s,p)=>s+ (+p.stock||0)*(+p.costPrice||+p.price||0),0);

  // KPIs
  document.getElementById('reportKPIs').innerHTML = [
    { label:'Revenue (Month)',   value: fmt(totalInc),    icon:'bi-cash-stack',          color:'#16a34a' },
    { label:'Expenses (Month)',  value: fmt(totalExp),    icon:'bi-receipt',             color:'#dc2626' },
    { label:'Net Profit',        value: fmt(totalInc-totalExp), icon:'bi-graph-up',      color:'#2563eb' },
    { label:'Orders (Month)',    value: totalOrd,         icon:'bi-bag-check',           color:'#d97706' },
    { label:'Total Products',    value: prods.length,     icon:'bi-bag',                 color:'#7c3aed' },
    { label:'Stock Value (Cost)',value: fmt(stockVal),    icon:'bi-boxes',               color:'#0a2342' },
  ].map(s => `
    <div class="stat-card" style="--accent:${s.color};">
      <div class="stat-icon" style="background:${s.color}22;color:${s.color};"><i class="bi ${s.icon}"></i></div>
      <p class="stat-val">${s.value}</p>
      <p class="stat-lbl">${s.label}</p>
    </div>`).join('');

  // Revenue vs Expense bar chart
  destroyChart('revExpChart');
  const days = [], inc = [], exp = [];
  const daysInMonth = new Date(+mo.split('-')[0], +mo.split('-')[1], 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${mo}-${String(d).padStart(2,'0')}`;
    days.push(d);
    inc.push(txs.filter(t=>t.date===ds&&t.type==='income').reduce((s,t)=>s+ +t.amount,0));
    exp.push(txs.filter(t=>t.date===ds&&t.type==='expense').reduce((s,t)=>s+ +t.amount,0));
  }
  _charts.revExp = new Chart(document.getElementById('revExpChart'), {
    type:'bar',
    data:{labels:days,datasets:[
      {label:'Income',data:inc,backgroundColor:'rgba(201,169,110,.8)',borderRadius:4},
      {label:'Expense',data:exp,backgroundColor:'rgba(220,38,38,.55)',borderRadius:4}
    ]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top'}},scales:{y:{beginAtZero:true,ticks:{callback:v=>'Rs.'+v.toLocaleString()}}}}
  });

  // Orders by status doughnut
  destroyChart('orderStatusChart');
  const statuses = ['pending','processing','ready','delivered','cancelled'];
  const statusColors = ['#fbbf24','#60a5fa','#34d399','#10b981','#f87171'];
  const statusCounts = statuses.map(s => orders.filter(o=>o.status===s).length);
  _charts.orderStatus = new Chart(document.getElementById('orderStatusChart'), {
    type:'doughnut',
    data:{labels:statuses,datasets:[{data:statusCounts,backgroundColor:statusColors}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{font:{size:11}}}}}
  });

  // Top products by stock value
  const topProds = [...prods]
    .map(p=>({...p, val:(+p.stock||0)*(+p.costPrice||+p.price||0)}))
    .sort((a,b)=>b.val-a.val).slice(0,8);
  document.getElementById('topProductsTbl').innerHTML = topProds.length
    ? topProds.map((p,i)=>{
        const brand = getBrand(p.brandId);
        return `<tr><td>${i+1}</td><td>${escHtml(p.name)}</td><td>${escHtml(brand?.name||'—')}</td>
          <td>${stockBadge(p.stock,p.lowStock)}</td><td style="font-weight:700;">${fmt(p.val)}</td></tr>`;
      }).join('')
    : '<tr><td colspan="5" style="text-align:center;padding:1rem;color:#cbd5e1;">No products</td></tr>';

  // Low stock alert
  const lowProds = prods.filter(p=>+p.stock<= +(p.lowStock||5)).sort((a,b)=>+a.stock - +b.stock);
  document.getElementById('lowStockTbl').innerHTML = lowProds.length
    ? lowProds.map(p=>{
        const brand = getBrand(p.brandId);
        return `<tr><td>${escHtml(p.name)}</td><td>${escHtml(brand?.name||'—')}</td>
          <td><strong>${p.stock}</strong></td><td>${p.lowStock||5}</td><td>${stockBadge(p.stock,p.lowStock)}</td></tr>`;
      }).join('')
    : '<tr><td colspan="5" style="text-align:center;padding:1rem;color:#16a34a;"><i class="bi bi-check-circle"></i> All stock levels OK</td></tr>';

  // Brand breakdown
  const brands = getData('mch_brands');
  document.getElementById('brandBreakdown').innerHTML = brands.map(b => {
    const bProds = prods.filter(p=>p.brandId===b.id);
    const pct    = prods.length ? Math.round(bProds.length/prods.length*100) : 0;
    return `
      <div style="background:#f8fafc;border-radius:10px;padding:.85rem;border:1px solid #e2e8f0;">
        <div style="font-weight:700;color:var(--navy);font-size:.85rem;margin-bottom:.3rem;">${escHtml(b.name)}</div>
        <div style="font-size:1.2rem;font-weight:800;color:var(--navy);">${bProds.length}</div>
        <div style="font-size:.7rem;color:#94a3b8;">products (${pct}%)</div>
        <div style="margin-top:.5rem;background:#e2e8f0;border-radius:4px;height:4px;">
          <div style="width:${pct}%;background:var(--gold);height:4px;border-radius:4px;transition:width .3s;"></div>
        </div>
      </div>`;
  }).join('') || '<p class="text-muted">No brands found.</p>';

  // Gender chart
  destroyChart('genderChart');
  const genders = ['Men','Women','Kids','Unisex'];
  const gColors = ['#2563eb','#ec4899','#16a34a','#d97706'];
  const gCounts = genders.map(g=>prods.filter(p=>p.gender===g).length);
  _charts.gender = new Chart(document.getElementById('genderChart'), {
    type:'pie',
    data:{labels:genders,datasets:[{data:gCounts,backgroundColor:gColors}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{font:{size:12}}}}}
  });

  // Tailoring summary
  const tStatuses = ['pending','in-progress','ready','delivered','cancelled'];
  document.getElementById('tailorSummaryTbl').innerHTML = tStatuses.map(s=>{
    const cnt = tailor.filter(j=>j.status===s).length;
    const pct = tailor.length ? Math.round(cnt/tailor.length*100) : 0;
    return `<tr><td><span class="badge b-${s}">${s}</span></td><td><strong>${cnt}</strong></td><td>${pct}%</td></tr>`;
  }).join('');
}

// ── DESTROY CHART BEFORE RECREATING ──────────────────────────────────────────
function destroyChart(id) {
  if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; }
}

// ── EXPORT ────────────────────────────────────────────────────────────────────
function exportReport() {
  const mo   = document.getElementById('reportMonth').value || today().slice(0,7);
  const txs  = getData('mch_transactions').filter(t=>(t.date||'').startsWith(mo));
  exportCSV(txs, 'finance_report_'+mo, ['date','type','category','description','amount']);
}
