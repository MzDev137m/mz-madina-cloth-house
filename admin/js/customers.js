checkAuth();

function openModal(id='') {
  document.getElementById('custId').value = id;
  if (id) {
    const c = getData('mch_customers').find(x => x.id===id); if (!c) return;
    document.getElementById('modalTitle').textContent = 'Edit Customer';
    document.getElementById('cName').value  = c.name;
    document.getElementById('cPhone').value = c.phone;
    document.getElementById('cWA').value    = c.whatsapp||'';
    document.getElementById('cEmail').value = c.email||'';
    document.getElementById('cAddr').value  = c.address||'';
    document.getElementById('cCity').value  = c.city||'';
    document.getElementById('cBday').value  = c.birthday||'';
    document.getElementById('cNotes').value = c.notes||'';
  } else {
    document.getElementById('modalTitle').textContent = 'Add Customer';
    ['cName','cPhone','cWA','cEmail','cAddr','cCity','cBday','cNotes'].forEach(id => document.getElementById(id).value = '');
  }
  document.getElementById('modal').style.display = 'flex';
}

function closeModal() { document.getElementById('modal').style.display = 'none'; }

function saveCust() {
  const name  = document.getElementById('cName').value.trim();
  const phone = document.getElementById('cPhone').value.trim();
  if (!name || !phone) { toast('Name and phone are required','warning'); return; }

  const id    = document.getElementById('custId').value;
  const custs = getData('mch_customers');
  const entry = {
    id: id || uid(), name, phone,
    whatsapp: document.getElementById('cWA').value.trim(),
    email:    document.getElementById('cEmail').value.trim(),
    address:  document.getElementById('cAddr').value.trim(),
    city:     document.getElementById('cCity').value.trim(),
    birthday: document.getElementById('cBday').value,
    notes:    document.getElementById('cNotes').value.trim()
  };
  if (id) { const i = custs.findIndex(c => c.id===id); if(i>-1) custs[i]={...custs[i],...entry}; }
  else { entry.createdAt = new Date().toISOString(); custs.push(entry); }
  saveData('mch_customers', custs);
  closeModal(); toast('Customer saved!'); render();
}

function viewProfile(id) {
  const c = getData('mch_customers').find(x => x.id===id); if (!c) return;
  const orders   = getData('mch_orders').filter(o => o.phone===c.phone || o.customer.toLowerCase()===c.name.toLowerCase());
  const tailoring = getData('mch_tailoring').filter(j => j.phone===c.phone || j.customer.toLowerCase()===c.name.toLowerCase());
  const totalSpent = orders.reduce((s,o)=>s+ +o.total,0) + tailoring.reduce((s,j)=>s+ +j.charges,0);
  const balanceDue = orders.reduce((s,o)=>s+ +o.balance,0) + tailoring.reduce((s,j)=>s+ +j.balance,0);
  const wa = (c.whatsapp||c.phone).replace(/\D/g,'');

  document.getElementById('profileName').textContent = c.name;
  document.getElementById('profileContent').innerHTML = `
    <div style="background:var(--navy);border-radius:12px;padding:1.25rem;margin-bottom:1rem;color:#fff;display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:.75rem;">
      <div>
        <h6 style="margin:0;font-size:1.1rem;color:var(--gold);">${c.name}</h6>
        <p style="margin:.25rem 0 0;font-size:.85rem;opacity:.8;">${c.phone}${c.city?' · '+c.city:''}</p>
        ${c.email?`<p style="margin:.15rem 0 0;font-size:.8rem;opacity:.6;">${c.email}</p>`:''}
        ${c.address?`<p style="margin:.15rem 0 0;font-size:.8rem;opacity:.6;">${c.address}</p>`:''}
        ${c.birthday?`<p style="margin:.15rem 0 0;font-size:.8rem;opacity:.6;">🎂 ${fmtD(c.birthday)}</p>`:''}
      </div>
      <div style="display:flex;flex-direction:column;gap:.4rem;">
        <a href="tel:${c.phone}" class="btn btn-ghost btn-sm"><i class="bi bi-telephone"></i> Call</a>
        <a href="https://wa.me/92${wa.replace(/^0/,'')}" target="_blank" class="btn btn-success btn-sm"><i class="bi bi-whatsapp"></i> WhatsApp</a>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.6rem;margin-bottom:1rem;">
      <div style="background:#f8fafc;border-radius:10px;padding:.75rem;text-align:center;"><p style="font-size:1.1rem;font-weight:700;color:var(--navy);margin:0;">${orders.length}</p><p style="font-size:.7rem;color:#94a3b8;margin:0;">Orders</p></div>
      <div style="background:#f8fafc;border-radius:10px;padding:.75rem;text-align:center;"><p style="font-size:1.1rem;font-weight:700;color:var(--navy);margin:0;">${tailoring.length}</p><p style="font-size:.7rem;color:#94a3b8;margin:0;">Tailoring</p></div>
      <div style="background:#f8fafc;border-radius:10px;padding:.75rem;text-align:center;"><p style="font-size:.95rem;font-weight:700;color:#16a34a;margin:0;">${fmt(totalSpent)}</p><p style="font-size:.7rem;color:#94a3b8;margin:0;">Total Spent</p></div>
      <div style="background:#f8fafc;border-radius:10px;padding:.75rem;text-align:center;"><p style="font-size:.95rem;font-weight:700;color:#dc2626;margin:0;">${fmt(balanceDue)}</p><p style="font-size:.7rem;color:#94a3b8;margin:0;">Balance Due</p></div>
    </div>
    ${orders.length ? `
    <p style="font-size:.78rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:.5rem;">Recent Orders</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:1rem;font-size:.82rem;">
      <thead><tr style="background:#f8fafc;"><th style="padding:.5rem .75rem;text-align:left;color:#64748b;font-size:.72rem;">Date</th><th style="padding:.5rem .75rem;text-align:left;color:#64748b;font-size:.72rem;">Items</th><th style="padding:.5rem .75rem;text-align:right;color:#64748b;font-size:.72rem;">Total</th><th style="padding:.5rem .75rem;text-align:right;color:#64748b;font-size:.72rem;">Balance</th><th style="padding:.5rem .75rem;color:#64748b;font-size:.72rem;">Status</th></tr></thead>
      <tbody>${orders.slice(0,5).map(o=>`<tr><td style="padding:.45rem .75rem;border-bottom:1px solid #f8fafc;">${fmtD(o.date)}</td><td style="padding:.45rem .75rem;border-bottom:1px solid #f8fafc;">${(o.items||[]).length} item(s)</td><td style="padding:.45rem .75rem;border-bottom:1px solid #f8fafc;text-align:right;font-weight:600;">${fmt(o.total)}</td><td style="padding:.45rem .75rem;border-bottom:1px solid #f8fafc;text-align:right;color:#dc2626;">${fmt(o.balance)}</td><td style="padding:.45rem .75rem;border-bottom:1px solid #f8fafc;"><span class="badge b-${o.status}">${o.status}</span></td></tr>`).join('')}</tbody>
    </table>` : ''}
    ${tailoring.length ? `
    <p style="font-size:.78rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:.5rem;">Tailoring Jobs</p>
    <table style="width:100%;border-collapse:collapse;font-size:.82rem;">
      <thead><tr style="background:#f8fafc;"><th style="padding:.5rem .75rem;text-align:left;color:#64748b;font-size:.72rem;">Slip</th><th style="padding:.5rem .75rem;text-align:left;color:#64748b;font-size:.72rem;">Garment</th><th style="padding:.5rem .75rem;text-align:left;color:#64748b;font-size:.72rem;">Delivery</th><th style="padding:.5rem .75rem;text-align:right;color:#64748b;font-size:.72rem;">Charges</th><th style="padding:.5rem .75rem;color:#64748b;font-size:.72rem;">Status</th></tr></thead>
      <tbody>${tailoring.slice(0,5).map(j=>`<tr><td style="padding:.45rem .75rem;border-bottom:1px solid #f8fafc;"><code>${j.slip||j.id.substr(-6)}</code></td><td style="padding:.45rem .75rem;border-bottom:1px solid #f8fafc;">${j.garment}</td><td style="padding:.45rem .75rem;border-bottom:1px solid #f8fafc;">${fmtD(j.deliveryDate)}</td><td style="padding:.45rem .75rem;border-bottom:1px solid #f8fafc;text-align:right;font-weight:600;">${fmt(j.charges)}</td><td style="padding:.45rem .75rem;border-bottom:1px solid #f8fafc;"><span class="badge b-${j.status}">${j.status}</span></td></tr>`).join('')}</tbody>
    </table>` : ''}
    ${c.notes ? `<div style="margin-top:1rem;background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:.75rem 1rem;font-size:.83rem;color:#92400e;">📝 ${c.notes}</div>` : ''}
  `;
  document.getElementById('profileModal').style.display = 'flex';
}

function deleteCust(id) {
  if (!confirm('Delete this customer?')) return;
  saveData('mch_customers', getData('mch_customers').filter(c => c.id!==id));
  toast('Deleted','danger'); render();
}

function render() {
  const custs    = getData('mch_customers');
  const orders   = getData('mch_orders');
  const tailoring = getData('mch_tailoring');
  const q = document.getElementById('fSearch').value.toLowerCase();

  const list = custs.filter(c =>
    !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.city||'').toLowerCase().includes(q)
  );

  const custOrders = c => orders.filter(o => o.phone===c.phone || o.customer.toLowerCase()===c.name.toLowerCase());
  const custTailor = c => tailoring.filter(j => j.phone===c.phone || j.customer.toLowerCase()===c.name.toLowerCase());

  const withOrders  = custs.filter(c => custOrders(c).length).length;
  const tailorCusts = custs.filter(c => custTailor(c).length).length;
  const totalRev    = orders.reduce((s,o)=>s+ +o.total,0) + tailoring.reduce((s,j)=>s+ +j.charges,0);

  document.getElementById('s-total').textContent  = custs.length;
  document.getElementById('s-active').textContent = withOrders;
  document.getElementById('s-rev').textContent    = fmt(totalRev);
  document.getElementById('s-tailor').textContent = tailorCusts;

  document.getElementById('custBody').innerHTML = list.length ? list.map(c => {
    const ords  = custOrders(c);
    const tails = custTailor(c);
    const spent   = ords.reduce((s,o)=>s+ +o.total,0) + tails.reduce((s,j)=>s+ +j.charges,0);
    const balance = ords.reduce((s,o)=>s+ +o.balance,0) + tails.reduce((s,j)=>s+ +j.balance,0);
    return `<tr>
      <td><strong style="cursor:pointer;color:var(--navy);" onclick="viewProfile('${c.id}')">${c.name}</strong>${c.city?`<br><small style="color:#94a3b8;">${c.city}</small>`:''}</td>
      <td>${c.phone}</td>
      <td>${c.city||'<span style="color:#cbd5e1;">—</span>'}</td>
      <td style="text-align:center;">${ords.length}</td>
      <td style="text-align:center;">${tails.length}</td>
      <td style="font-weight:700;color:#16a34a;">${fmt(spent)}</td>
      <td style="font-weight:700;color:${balance>0?'#dc2626':'#16a34a'};">${fmt(balance)}</td>
      <td style="font-size:.78rem;color:#94a3b8;">${c.createdAt?fmtD(c.createdAt.split('T')[0]):'—'}</td>
      <td style="white-space:nowrap;">
        <button class="btn btn-ghost btn-sm" onclick="viewProfile('${c.id}')"><i class="bi bi-person-lines-fill"></i></button>
        <button class="btn btn-primary btn-sm" onclick="openModal('${c.id}')"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-danger btn-sm" onclick="deleteCust('${c.id}')"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`;
  }).join('') : '<tr><td colspan="9" style="text-align:center;padding:2rem;color:#cbd5e1;">No customers found</td></tr>';
}

function exportAll() {
  exportCSV(getData('mch_customers'), 'customers', ['name','phone','whatsapp','email','address','city','birthday','notes','createdAt']);
}

render();
