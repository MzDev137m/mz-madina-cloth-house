checkAuth();
let items = [], currentViewId = null;

function addItem(name='', qty=1, price=0) {
  const id = uid();
  const div = document.createElement('div');
  div.id = 'item-'+id;
  div.style.cssText = 'display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:.5rem;margin-bottom:.5rem;align-items:center;';
  div.innerHTML = `
    <input class="finput" type="text" placeholder="Item name" value="${name}" oninput="calcTotal()" style="padding:.4rem .7rem;">
    <input class="finput" type="number" placeholder="Qty" value="${qty}" min="1" oninput="calcTotal()" style="padding:.4rem .7rem;">
    <input class="finput" type="number" placeholder="Price" value="${price}" min="0" oninput="calcTotal()" style="padding:.4rem .7rem;">
    <button onclick="removeItem('${id}')" class="btn btn-danger btn-sm" style="padding:.4rem .6rem;"><i class="bi bi-trash"></i></button>
  `;
  div.dataset.itemId = id;
  document.getElementById('itemsContainer').appendChild(div);
  items.push(id);
  calcTotal();
}

function removeItem(id) {
  const el = document.getElementById('item-'+id);
  if (el) el.remove();
  items = items.filter(i => i !== id);
  calcTotal();
}

function getItems() {
  return [...document.querySelectorAll('#itemsContainer > div')].map(div => {
    const inputs = div.querySelectorAll('input');
    return { name: inputs[0].value, qty: +inputs[1].value||1, price: +inputs[2].value||0 };
  }).filter(i => i.name.trim());
}

function calcTotal() {
  const its = getItems();
  const sub = its.reduce((s,i) => s + i.qty*i.price, 0);
  const disc = +document.getElementById('ordDiscount').value||0;
  document.getElementById('subtotalLbl').textContent = fmt(sub);
  document.getElementById('totalLbl').textContent = fmt(Math.max(0, sub-disc));
  calcBalance();
}

function calcBalance() {
  const its = getItems();
  const sub = its.reduce((s,i) => s + i.qty*i.price, 0);
  const disc = +document.getElementById('ordDiscount').value||0;
  const total = Math.max(0, sub-disc);
  const adv = +document.getElementById('ordAdvance').value||0;
  document.getElementById('ordBalance').value = fmt(Math.max(0, total-adv));
}

function openModal() {
  document.getElementById('ordId').value = '';
  document.getElementById('modalTitle').textContent = 'New Order';
  document.getElementById('ordCust').value = '';
  document.getElementById('ordPhone').value = '';
  document.getElementById('ordAddr').value = '';
  document.getElementById('ordDiscount').value = 0;
  document.getElementById('ordAdvance').value = 0;
  document.getElementById('ordBalance').value = fmt(0);
  document.getElementById('ordDate').value = today();
  document.getElementById('ordStatus').value = 'pending';
  document.getElementById('ordPayMethod').value = 'cash';
  document.getElementById('ordNotes').value = '';
  document.getElementById('printBtn').style.display = 'none';
  document.getElementById('itemsContainer').innerHTML = '';
  items = [];
  addItem('', 1, 0);
  document.getElementById('modal').style.display = 'flex';
}

function closeModal() { document.getElementById('modal').style.display = 'none'; }

function saveOrder() {
  const cust  = document.getElementById('ordCust').value.trim();
  const phone = document.getElementById('ordPhone').value.trim();
  const date  = document.getElementById('ordDate').value;
  const its   = getItems();
  if (!cust || !phone || !date || !its.length) { toast('Fill all required fields and add at least one item.','warning'); return; }

  const disc    = +document.getElementById('ordDiscount').value||0;
  const sub     = its.reduce((s,i) => s + i.qty*i.price, 0);
  const total   = Math.max(0, sub - disc);
  const adv     = +document.getElementById('ordAdvance').value||0;
  const balance = Math.max(0, total - adv);
  const payStatus = balance <= 0 ? 'paid' : adv > 0 ? 'partial' : 'pending';

  const id = document.getElementById('ordId').value;
  const orders = getData('mch_orders');
  const entry = {
    id: id || uid(), customer: cust, phone, address: document.getElementById('ordAddr').value.trim(),
    items: its, discount: disc, subtotal: sub, total, advance: adv, balance, payStatus,
    payMethod: document.getElementById('ordPayMethod').value,
    status: document.getElementById('ordStatus').value,
    date, notes: document.getElementById('ordNotes').value.trim()
  };
  if (id) { const i = orders.findIndex(o => o.id===id); if(i>-1) orders[i]={...orders[i],...entry}; }
  else { entry.createdAt = new Date().toISOString(); orders.push(entry); }
  saveData('mch_orders', orders);
  closeModal(); toast('Order saved!'); render();
}

function editOrder(id) {
  const o = getData('mch_orders').find(x => x.id===id); if (!o) return;
  document.getElementById('ordId').value = o.id;
  document.getElementById('modalTitle').textContent = 'Edit Order';
  document.getElementById('ordCust').value = o.customer;
  document.getElementById('ordPhone').value = o.phone;
  document.getElementById('ordAddr').value = o.address||'';
  document.getElementById('ordDiscount').value = o.discount||0;
  document.getElementById('ordAdvance').value = o.advance||0;
  document.getElementById('ordDate').value = o.date;
  document.getElementById('ordStatus').value = o.status;
  document.getElementById('ordPayMethod').value = o.payMethod||'cash';
  document.getElementById('ordNotes').value = o.notes||'';
  document.getElementById('printBtn').style.display = 'inline-flex';
  document.getElementById('itemsContainer').innerHTML = '';
  items = [];
  (o.items||[]).forEach(it => addItem(it.name, it.qty, it.price));
  calcTotal();
  document.getElementById('modal').style.display = 'flex';
}

function viewOrder(id) {
  const o = getData('mch_orders').find(x => x.id===id); if (!o) return;
  currentViewId = id;
  document.getElementById('viewContent').innerHTML = `
    <div style="border:1px solid #e2e8f0;border-radius:10px;padding:1.25rem;margin-bottom:1rem;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <h6 style="margin:0;color:var(--navy);font-size:1rem;">${o.customer}</h6>
          <p style="margin:.2rem 0 0;font-size:.82rem;color:#64748b;">${o.phone}${o.address?'<br>'+o.address:''}</p>
        </div>
        <div style="text-align:right;">
          <code style="font-size:.78rem;">${o.id}</code>
          <p style="margin:.2rem 0 0;font-size:.78rem;color:#64748b;">${fmtD(o.date)}</p>
        </div>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:1rem;">
      <thead><tr style="background:#f8fafc;">
        <th style="padding:.5rem .75rem;text-align:left;font-size:.75rem;color:#64748b;border-bottom:1px solid #e2e8f0;">Item</th>
        <th style="padding:.5rem .75rem;text-align:center;font-size:.75rem;color:#64748b;border-bottom:1px solid #e2e8f0;">Qty</th>
        <th style="padding:.5rem .75rem;text-align:right;font-size:.75rem;color:#64748b;border-bottom:1px solid #e2e8f0;">Price</th>
        <th style="padding:.5rem .75rem;text-align:right;font-size:.75rem;color:#64748b;border-bottom:1px solid #e2e8f0;">Amount</th>
      </tr></thead>
      <tbody>
        ${(o.items||[]).map(it=>`<tr><td style="padding:.5rem .75rem;font-size:.84rem;border-bottom:1px solid #f8fafc;">${it.name}</td><td style="padding:.5rem .75rem;text-align:center;font-size:.84rem;border-bottom:1px solid #f8fafc;">${it.qty}</td><td style="padding:.5rem .75rem;text-align:right;font-size:.84rem;border-bottom:1px solid #f8fafc;">${fmt(it.price)}</td><td style="padding:.5rem .75rem;text-align:right;font-size:.84rem;font-weight:600;border-bottom:1px solid #f8fafc;">${fmt(it.qty*it.price)}</td></tr>`).join('')}
      </tbody>
    </table>
    <div style="background:#f8fafc;border-radius:10px;padding:.75rem 1rem;margin-bottom:1rem;">
      <div style="display:flex;justify-content:space-between;font-size:.84rem;margin-bottom:.3rem;"><span style="color:#64748b;">Subtotal</span><span>${fmt(o.subtotal)}</span></div>
      ${o.discount?`<div style="display:flex;justify-content:space-between;font-size:.84rem;margin-bottom:.3rem;"><span style="color:#64748b;">Discount</span><span style="color:#dc2626;">- ${fmt(o.discount)}</span></div>`:''}
      <div style="display:flex;justify-content:space-between;font-size:1rem;font-weight:700;color:var(--navy);border-top:1px solid #e2e8f0;padding-top:.5rem;"><span>Total</span><span>${fmt(o.total)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:.84rem;margin-top:.3rem;"><span style="color:#16a34a;">Advance Paid</span><span style="color:#16a34a;font-weight:600;">${fmt(o.advance)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:.9rem;font-weight:700;"><span style="color:#dc2626;">Balance Due</span><span style="color:#dc2626;">${fmt(o.balance)}</span></div>
    </div>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
      <span class="badge b-${o.status}">${o.status}</span>
      <span class="badge b-${o.payStatus}">${o.payStatus}</span>
      <span style="font-size:.78rem;color:#64748b;align-self:center;">via ${o.payMethod||'Cash'}</span>
    </div>
    ${o.notes?`<p style="margin-top:.75rem;font-size:.82rem;color:#64748b;background:#f8fafc;padding:.6rem .9rem;border-radius:8px;">📝 ${o.notes}</p>`:''}
  `;
  document.getElementById('viewModal').style.display = 'flex';
}

function printCurrentView() {
  const o = getData('mch_orders').find(x => x.id===currentViewId); if (!o) return;
  printOrderSlip(o);
}

function printOrder() {
  const id = document.getElementById('ordId').value;
  const o = getData('mch_orders').find(x => x.id===id); if (!o) return;
  printOrderSlip(o);
}

function printOrderSlip(o) {
  const w = window.open('','_blank','width=600,height=700');
  w.document.write(`<!DOCTYPE html><html><head><title>Order #${o.id}</title>
  <style>body{font-family:Arial,sans-serif;padding:20px;color:#0f172a;max-width:560px;margin:0 auto;}
  h2{color:#0a2342;margin-bottom:4px;}table{width:100%;border-collapse:collapse;margin:12px 0;}
  th{background:#f8fafc;padding:8px;text-align:left;font-size:12px;color:#64748b;border:1px solid #e2e8f0;}
  td{padding:8px;font-size:13px;border:1px solid #e2e8f0;}.total{font-weight:700;font-size:15px;}
  .footer{margin-top:20px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:10px;}
  @media print{button{display:none;}}</style></head><body>
  <div style="text-align:center;margin-bottom:16px;">
    <h2>Madina Cloth House</h2>
    <p style="font-size:12px;color:#64748b;margin:0;">Sadar Bazar, Narang Mandi | 0300-4260700</p>
    <p style="font-size:11px;color:#94a3b8;">Order Receipt</p>
  </div>
  <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:13px;">
    <div><strong>Customer:</strong> ${o.customer}<br><strong>Phone:</strong> ${o.phone}${o.address?'<br><strong>Address:</strong> '+o.address:''}</div>
    <div style="text-align:right;"><strong>Order ID:</strong> ${o.id}<br><strong>Date:</strong> ${fmtD(o.date)}<br><strong>Status:</strong> ${o.status}</div>
  </div>
  <table><thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr></thead>
  <tbody>${(o.items||[]).map(it=>`<tr><td>${it.name}</td><td>${it.qty}</td><td>${fmt(it.price)}</td><td>${fmt(it.qty*it.price)}</td></tr>`).join('')}</tbody></table>
  <table><tr><td>Subtotal</td><td style="text-align:right;">${fmt(o.subtotal)}</td></tr>
  ${o.discount?`<tr><td>Discount</td><td style="text-align:right;color:#dc2626;">- ${fmt(o.discount)}</td></tr>`:''}
  <tr class="total"><td>Total</td><td style="text-align:right;">${fmt(o.total)}</td></tr>
  <tr><td style="color:#16a34a;">Advance Paid</td><td style="text-align:right;color:#16a34a;">${fmt(o.advance)}</td></tr>
  <tr class="total"><td style="color:#dc2626;">Balance Due</td><td style="text-align:right;color:#dc2626;">${fmt(o.balance)}</td></tr></table>
  <div class="footer"><p>Thank you for shopping at Madina Cloth House!</p><p>Please bring this receipt when collecting your order.</p></div>
  <br><button onclick="window.print()" style="padding:8px 20px;background:#0a2342;color:#fff;border:none;border-radius:6px;cursor:pointer;">Print</button>
  </body></html>`);
  w.document.close();
}

function deleteOrder(id) {
  if (!confirm('Delete this order?')) return;
  saveData('mch_orders', getData('mch_orders').filter(o => o.id!==id));
  toast('Deleted','danger'); render();
}

function render() {
  const orders  = getData('mch_orders');
  const fStatus = document.getElementById('fStatus').value;
  const fPay    = document.getElementById('fPay').value;
  const q       = document.getElementById('fSearch').value.toLowerCase();

  const list = orders.filter(o =>
    (!fStatus || o.status===fStatus) &&
    (!fPay || o.payStatus===fPay) &&
    (!q || o.customer.toLowerCase().includes(q) || o.id.toLowerCase().includes(q))
  ).reverse();

  document.getElementById('s-total').textContent    = orders.length;
  document.getElementById('s-pending').textContent  = orders.filter(o=>o.status==='pending').length;
  document.getElementById('s-progress').textContent = orders.filter(o=>o.status==='progress').length;
  document.getElementById('s-done').textContent     = orders.filter(o=>o.status==='delivered').length;
  document.getElementById('s-rev').textContent      = fmt(orders.reduce((s,o)=>s+ +o.total,0));

  document.getElementById('ordBody').innerHTML = list.length ? list.map(o => `
    <tr>
      <td><code>${o.id.substr(-6).toUpperCase()}</code></td>
      <td>${fmtD(o.date)}</td>
      <td><strong>${o.customer}</strong><br><small style="color:#94a3b8;">${o.phone}</small></td>
      <td style="font-size:.8rem;">${(o.items||[]).length} item(s)</td>
      <td style="font-weight:700;">${fmt(o.total)}</td>
      <td style="color:#16a34a;font-weight:600;">${fmt(o.advance)}</td>
      <td style="color:#dc2626;font-weight:600;">${fmt(o.balance)}</td>
      <td><span class="badge b-${o.status}">${o.status}</span></td>
      <td><span class="badge b-${o.payStatus}">${o.payStatus}</span></td>
      <td style="white-space:nowrap;">
        <button class="btn btn-ghost btn-sm" onclick="viewOrder('${o.id}')"><i class="bi bi-eye"></i></button>
        <button class="btn btn-primary btn-sm" onclick="editOrder('${o.id}')"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-danger btn-sm" onclick="deleteOrder('${o.id}')"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join('')
    : '<tr><td colspan="10" style="text-align:center;padding:2rem;color:#cbd5e1;">No orders found</td></tr>';
}

function exportAll() {
  const orders = getData('mch_orders').map(o => ({
    ...o, items: (o.items||[]).map(i=>`${i.name}(${i.qty}x${i.price})`).join('; ')
  }));
  exportCSV(orders, 'orders', ['id','date','customer','phone','items','subtotal','discount','total','advance','balance','payStatus','payMethod','status','notes']);
}

render();
