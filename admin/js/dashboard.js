checkAuth();

const _lbl = document.getElementById('todayLbl');
if (_lbl) _lbl.textContent = new Date().toLocaleDateString('en-PK',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

// Chart instances — destroy before recreating to avoid duplicate canvas bug
let _revChart = null, _expChart = null;

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function load() {
  const txs       = getData('mch_transactions');
  const orders    = getData('mch_orders');
  const tailoring = getData('mch_tailoring');
  const products  = getData('mch_products');
  const customers = getData('mch_customers');
  const brands    = getData('mch_brands');
  const td  = today();
  const mo  = td.substr(0,7);

  const todayInc = txs.filter(t=>t.date===td&&t.type==='income').reduce((s,t)=>s+ +t.amount,0);
  const monthInc = txs.filter(t=>t.date.startsWith(mo)&&t.type==='income').reduce((s,t)=>s+ +t.amount,0);
  const monthExp = txs.filter(t=>t.date.startsWith(mo)&&t.type==='expense').reduce((s,t)=>s+ +t.amount,0);
  const overdue  = tailoring.filter(j=>j.status!=='delivered'&&j.deliveryDate&&j.deliveryDate<td).length;

  setText('s-today',    fmt(todayInc));
  setText('s-month',    fmt(monthInc));
  setText('s-profit',   fmt(monthInc - monthExp));
  setText('s-lowstock', products.filter(p=>+p.stock<= +(p.lowStock||5)).length);
  setText('s-orders',   orders.filter(o=>o.status==='pending').length);
  setText('s-tailor',   tailoring.filter(j=>j.status!=='delivered').length);
  setText('s-cust',     customers.length);
  setText('s-overdue',  overdue);
  setText('s-prods',    products.length);
  setText('s-brands',   brands.length);

  // Recent transactions
  const rt = [...txs].reverse().slice(0,6);
  setText('recentTx', '');
  document.getElementById('recentTx').innerHTML = rt.length
    ? rt.map(t=>`<tr>
        <td>${fmtD(t.date)}</td>
        <td>${escHtml(t.description)}</td>
        <td><span class="badge b-${t.type}">${t.type}</span></td>
        <td style="color:${t.type==='income'?'#16a34a':'#dc2626'};font-weight:700;">${fmt(t.amount)}</td>
      </tr>`).join('')
    : '<tr><td colspan="4" style="text-align:center;padding:1rem;color:#cbd5e1;"><i class="bi bi-receipt"></i> No transactions yet</td></tr>';

  // Recent orders
  const ro = [...orders].reverse().slice(0,6);
  document.getElementById('recentOrders').innerHTML = ro.length
    ? ro.map(o=>`<tr>
        <td><code>${escHtml(o.id)}</code></td>
        <td>${escHtml(o.customer||'—')}</td>
        <td style="font-weight:700;">${fmt(o.total)}</td>
        <td>${statusBadge(o.status)}</td>
      </tr>`).join('')
    : '<tr><td colspan="4" style="text-align:center;padding:1rem;color:#cbd5e1;"><i class="bi bi-bag"></i> No orders yet</td></tr>';

  // Revenue chart – last 7 days (destroy old instance first)
  if (_revChart) { _revChart.destroy(); _revChart = null; }
  const days=[],inc=[],exp=[];
  for(let i=6;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i);
    const ds=d.toISOString().split('T')[0];
    days.push(d.toLocaleDateString('en-PK',{weekday:'short',day:'numeric'}));
    inc.push(txs.filter(t=>t.date===ds&&t.type==='income').reduce((s,t)=>s+ +t.amount,0));
    exp.push(txs.filter(t=>t.date===ds&&t.type==='expense').reduce((s,t)=>s+ +t.amount,0));
  }
  const rcEl = document.getElementById('revenueChart');
  if (rcEl) {
    _revChart = new Chart(rcEl, {
      type:'bar',
      data:{labels:days, datasets:[
        {label:'Income',  data:inc, backgroundColor:'rgba(201,169,110,.85)', borderRadius:5},
        {label:'Expense', data:exp, backgroundColor:'rgba(220,38,38,.55)',   borderRadius:5}
      ]},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{position:'top'}},
        scales:{y:{beginAtZero:true, ticks:{callback:v=>'Rs.'+v.toLocaleString()}}}}
    });
  }

  // Expense doughnut (destroy old instance first)
  if (_expChart) { _expChart.destroy(); _expChart = null; }
  const cm={};
  txs.filter(t=>t.type==='expense'&&t.date.startsWith(mo))
     .forEach(t=>cm[t.category||'Other']=(cm[t.category||'Other']||0)+ +t.amount);
  const pl=Object.keys(cm), pd=Object.values(cm);
  const ecEl = document.getElementById('expenseChart');
  if (ecEl) {
    _expChart = new Chart(ecEl, {
      type:'doughnut',
      data:{
        labels: pl.length ? pl : ['No expenses'],
        datasets:[{
          data: pd.length ? pd : [1],
          backgroundColor:['#c9a96e','#0a2342','#dc2626','#16a34a','#2563eb','#7c3aed','#f59e0b','#06b6d4'],
          borderWidth: 2, borderColor:'#fff'
        }]
      },
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{position:'bottom', labels:{font:{size:11}, padding:12}}},
        cutout:'62%'}
    });
  }
}

mchWaitForSync(() => load());
