checkAuth();
const INC_CATS = ['Sales','Tailoring Charges','Advance Received','Other Income'];
const EXP_CATS = ['Rent','Electricity','Staff Salary','Fabric Purchase','Accessories','Marketing','Transport','Maintenance','Other Expense'];
let mChart, cChart;

function updateCats() {
  const cats = document.getElementById('txType').value==='income' ? INC_CATS : EXP_CATS;
  document.getElementById('txCat').innerHTML = cats.map(c=>`<option>${c}</option>`).join('');
}

function populateMonths() {
  const months = [...new Set(getData('mch_transactions').map(t=>t.date.substr(0,7)))].sort().reverse();
  document.getElementById('fMonth').innerHTML = '<option value="">All Months</option>' +
    months.map(m=>`<option value="${m}">${new Date(m+'-01').toLocaleDateString('en-PK',{year:'numeric',month:'long'})}</option>`).join('');
}

function render() {
  const txs  = getData('mch_transactions');
  const type = document.getElementById('fType').value;
  const mon  = document.getElementById('fMonth').value;
  const q    = document.getElementById('fSearch').value.toLowerCase();
  const list = txs.filter(t=>
    (!type||t.type===type) && (!mon||t.date.startsWith(mon)) &&
    (!q||t.description.toLowerCase().includes(q)||t.category.toLowerCase().includes(q))
  ).reverse();

  const inc = list.filter(t=>t.type==='income').reduce((s,t)=>s+ +t.amount,0);
  const exp = list.filter(t=>t.type==='expense').reduce((s,t)=>s+ +t.amount,0);
  document.getElementById('s-inc').textContent = fmt(inc);
  document.getElementById('s-exp').textContent = fmt(exp);
  document.getElementById('s-net').textContent = fmt(inc-exp);
  document.getElementById('s-cnt').textContent = list.length;

  document.getElementById('txBody').innerHTML = list.length ? list.map(t=>`
    <tr>
      <td>${fmtD(t.date)}</td>
      <td><span class="badge b-${t.type}">${t.type}</span></td>
      <td>${t.category}</td>
      <td>${t.description}${t.ref?'<br><small style="color:#94a3b8;">Ref: '+t.ref+'</small>':''}</td>
      <td>${t.payment||'Cash'}</td>
      <td style="font-weight:700;color:${t.type==='income'?'#16a34a':'#dc2626'};">${fmt(t.amount)}</td>
      <td style="white-space:nowrap;">
        <button class="btn btn-primary btn-sm" onclick="editTx('${t.id}')"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-danger btn-sm" onclick="delTx('${t.id}')"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join('') : '<tr><td colspan="7" style="text-align:center;padding:2rem;color:#cbd5e1;">No transactions found</td></tr>';

  renderCharts();
}

function renderCharts() {
  const txs = getData('mch_transactions');
  const months=[],incA=[],expA=[];
  for(let i=5;i>=0;i--){
    const d=new Date(); d.setMonth(d.getMonth()-i);
    const ms=d.toISOString().substr(0,7);
    months.push(d.toLocaleDateString('en-PK',{month:'short',year:'2-digit'}));
    incA.push(txs.filter(t=>t.type==='income'&&t.date.startsWith(ms)).reduce((s,t)=>s+ +t.amount,0));
    expA.push(txs.filter(t=>t.type==='expense'&&t.date.startsWith(ms)).reduce((s,t)=>s+ +t.amount,0));
  }
  if(mChart) mChart.destroy();
  mChart = new Chart(document.getElementById('monthChart'),{
    type:'bar', data:{labels:months,datasets:[
      {label:'Income',data:incA,backgroundColor:'rgba(22,163,74,.7)',borderRadius:5},
      {label:'Expense',data:expA,backgroundColor:'rgba(220,38,38,.6)',borderRadius:5}
    ]}, options:{responsive:true,maintainAspectRatio:false,scales:{y:{beginAtZero:true}}}
  });
  const mo=today().substr(0,7), cm={};
  txs.filter(t=>t.type==='expense'&&t.date.startsWith(mo)).forEach(t=>cm[t.category]=(cm[t.category]||0)+ +t.amount);
  const pl=Object.keys(cm), pd=Object.values(cm);
  if(cChart) cChart.destroy();
  cChart = new Chart(document.getElementById('catChart'),{
    type:'doughnut', data:{labels:pl.length?pl:['No data'],datasets:[{data:pd.length?pd:[1],backgroundColor:['#c9a96e','#0a2342','#dc2626','#16a34a','#2563eb','#7c3aed','#f59e0b']}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{font:{size:10}}}}}
  });
}

function openModal() {
  document.getElementById('txId').value='';
  document.getElementById('modalTitle').textContent='Add Transaction';
  document.getElementById('txDate').value=today();
  document.getElementById('txType').value='income';
  updateCats();
  ['txAmt','txDesc','txRef','txNotes'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('txPay').value='cash';
  document.getElementById('modal').style.display='flex';
}
function closeModal() { document.getElementById('modal').style.display='none'; }

function saveTx() {
  const id   = document.getElementById('txId').value;
  const type = document.getElementById('txType').value;
  const amt  = parseFloat(document.getElementById('txAmt').value);
  const desc = document.getElementById('txDesc').value.trim();
  const date = document.getElementById('txDate').value;
  if (!amt||!desc||!date) { toast('Fill all required fields','warning'); return; }
  const txs = getData('mch_transactions');
  const entry = { id:id||uid(), type, category:document.getElementById('txCat').value, amount:amt, description:desc, date, payment:document.getElementById('txPay').value, ref:document.getElementById('txRef').value.trim(), notes:document.getElementById('txNotes').value.trim() };
  if (id) { const i=txs.findIndex(t=>t.id===id); if(i>-1) txs[i]={...txs[i],...entry}; }
  else { entry.createdAt=new Date().toISOString(); txs.push(entry); }
  saveData('mch_transactions',txs);
  closeModal(); toast('Saved!'); populateMonths(); render();
}

function editTx(id) {
  const t=getData('mch_transactions').find(x=>x.id===id); if(!t) return;
  document.getElementById('txId').value=t.id;
  document.getElementById('txType').value=t.type; updateCats();
  document.getElementById('txCat').value=t.category;
  document.getElementById('txAmt').value=t.amount;
  document.getElementById('txDate').value=t.date;
  document.getElementById('txDesc').value=t.description;
  document.getElementById('txPay').value=t.payment||'cash';
  document.getElementById('txRef').value=t.ref||'';
  document.getElementById('txNotes').value=t.notes||'';
  document.getElementById('modalTitle').textContent='Edit Transaction';
  document.getElementById('modal').style.display='flex';
}

function delTx(id) {
  if (!confirm('Delete this transaction?')) return;
  saveData('mch_transactions', getData('mch_transactions').filter(t=>t.id!==id));
  toast('Deleted','danger'); populateMonths(); render();
}

function exportAll() {
  exportCSV(getData('mch_transactions'),'finance',['date','type','category','description','amount','payment','ref','notes']);
}

updateCats(); populateMonths(); render();
