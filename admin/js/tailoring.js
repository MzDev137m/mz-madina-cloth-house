checkAuth();
let currentJobId = null;

function calcJBalance() {
  const charges = +document.getElementById('jCharges').value||0;
  const advance = +document.getElementById('jAdvance').value||0;
  document.getElementById('jBalance').value = fmt(Math.max(0, charges - advance));
}

function openModal() {
  currentJobId = null;
  document.getElementById('jobId').value = '';
  document.getElementById('modalTitle').textContent = 'New Tailoring Job';
  document.getElementById('printSlipBtn').style.display = 'none';
  ['jCust','jPhone','jFabric','jDesign','jTailor','mNotes'].forEach(id => document.getElementById(id).value = '');
  ['mChest','mWaist','mHips','mLength','mSleeve','mShoulder','mNeck','mTrouser','jCharges'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('jAdvance').value = 0;
  document.getElementById('jQty').value = 1;
  document.getElementById('jBalance').value = fmt(0);
  document.getElementById('jDate').value = today();
  document.getElementById('jDelivery').value = '';
  document.getElementById('jGarment').value = 'Kameez Shalwar';
  document.getElementById('jUrgency').value = 'normal';
  document.getElementById('jStatus').value = 'pending';
  document.getElementById('jPayMethod').value = 'cash';
  document.getElementById('jSlip').value = '';
  document.getElementById('modal').style.display = 'flex';
}

function closeModal() { document.getElementById('modal').style.display = 'none'; }

function saveJob() {
  const cust     = document.getElementById('jCust').value.trim();
  const phone    = document.getElementById('jPhone').value.trim();
  const charges  = +document.getElementById('jCharges').value;
  const date     = document.getElementById('jDate').value;
  const delivery = document.getElementById('jDelivery').value;
  if (!cust || !phone || !charges || !date || !delivery) { toast('Fill all required fields','warning'); return; }

  const advance   = +document.getElementById('jAdvance').value||0;
  const balance   = Math.max(0, charges - advance);
  const payStatus = balance <= 0 ? 'paid' : advance > 0 ? 'partial' : 'pending';

  const id     = document.getElementById('jobId').value;
  const jobs   = getData('mch_tailoring');
  const slipNo = document.getElementById('jSlip').value.trim() || ('SLP-' + Date.now().toString(36).toUpperCase());

  const entry = {
    id: id || uid(), slip: slipNo, customer: cust, phone,
    garment: document.getElementById('jGarment').value,
    fabric: document.getElementById('jFabric').value.trim(),
    design: document.getElementById('jDesign').value.trim(),
    qty: +document.getElementById('jQty').value||1,
    tailor: document.getElementById('jTailor').value.trim(),
    urgency: document.getElementById('jUrgency').value,
    measurements: {
      chest:    document.getElementById('mChest').value,
      waist:    document.getElementById('mWaist').value,
      hips:     document.getElementById('mHips').value,
      length:   document.getElementById('mLength').value,
      sleeve:   document.getElementById('mSleeve').value,
      shoulder: document.getElementById('mShoulder').value,
      neck:     document.getElementById('mNeck').value,
      trouser:  document.getElementById('mTrouser').value,
      notes:    document.getElementById('mNotes').value.trim()
    },
    charges, advance, balance, payStatus,
    payMethod: document.getElementById('jPayMethod').value,
    date, deliveryDate: delivery,
    status: document.getElementById('jStatus').value
  };

  if (id) { const i = jobs.findIndex(j => j.id===id); if(i>-1) jobs[i]={...jobs[i],...entry}; }
  else { entry.createdAt = new Date().toISOString(); jobs.push(entry); }
  saveData('mch_tailoring', jobs);
  currentJobId = entry.id;
  closeModal(); toast('Job saved!'); render();
}

function editJob(id) {
  const j = getData('mch_tailoring').find(x => x.id===id); if (!j) return;
  currentJobId = id;
  document.getElementById('jobId').value = j.id;
  document.getElementById('modalTitle').textContent = 'Edit Tailoring Job';
  document.getElementById('printSlipBtn').style.display = 'inline-flex';
  document.getElementById('jCust').value    = j.customer;
  document.getElementById('jPhone').value   = j.phone;
  document.getElementById('jGarment').value = j.garment;
  document.getElementById('jFabric').value  = j.fabric||'';
  document.getElementById('jDesign').value  = j.design||'';
  document.getElementById('jQty').value     = j.qty||1;
  document.getElementById('jTailor').value  = j.tailor||'';
  document.getElementById('jUrgency').value = j.urgency||'normal';
  const m = j.measurements||{};
  ['chest','waist','hips','length','sleeve','shoulder','neck','trouser'].forEach(k =>
    document.getElementById('m'+k.charAt(0).toUpperCase()+k.slice(1)).value = m[k]||''
  );
  document.getElementById('mNotes').value      = m.notes||'';
  document.getElementById('jCharges').value    = j.charges;
  document.getElementById('jAdvance').value    = j.advance;
  document.getElementById('jDate').value       = j.date;
  document.getElementById('jDelivery').value   = j.deliveryDate;
  document.getElementById('jPayMethod').value  = j.payMethod||'cash';
  document.getElementById('jStatus').value     = j.status;
  document.getElementById('jSlip').value       = j.slip||'';
  calcJBalance();
  document.getElementById('modal').style.display = 'flex';
}

function printCurrentSlip() {
  const j = getData('mch_tailoring').find(x => x.id===currentJobId); if (!j) return;
  printSlip(j);
}

function printJobSlip(id) {
  const j = getData('mch_tailoring').find(x => x.id===id); if (!j) return;
  printSlip(j);
}

function printSlip(j) {
  const m = j.measurements||{};
  const w = window.open('','_blank','width=620,height=750');
  w.document.write(`<!DOCTYPE html><html><head><title>Slip ${j.slip}</title>
  <style>body{font-family:Arial,sans-serif;padding:20px;color:#0f172a;max-width:580px;margin:0 auto;}
  h2{color:#0a2342;margin-bottom:4px;}
  .section{margin:12px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;}
  .section-head{background:#f8fafc;padding:7px 12px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px;}
  .grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:0;}
  .cell{padding:8px 12px;font-size:12px;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;}
  .cell:last-child,.cell:nth-child(4n){border-right:none;}
  .label{font-size:10px;color:#94a3b8;display:block;margin-bottom:2px;}
  .footer{margin-top:20px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:10px;}
  @media print{button{display:none;}}</style></head><body>
  <div style="text-align:center;margin-bottom:14px;">
    <h2>Madina Cloth House</h2>
    <p style="font-size:12px;color:#64748b;margin:0;">Sadar Bazar, Narang Mandi | 0300-4260700</p>
    <p style="font-size:11px;color:#94a3b8;margin:4px 0 0;">Tailoring Job Slip</p>
  </div>
  <div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:13px;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;">
    <div><span style="font-size:10px;color:#94a3b8;display:block;">Slip No.</span><strong>${j.slip}</strong></div>
    <div><span style="font-size:10px;color:#94a3b8;display:block;">Order Date</span><strong>${fmtD(j.date)}</strong></div>
    <div><span style="font-size:10px;color:#94a3b8;display:block;">Delivery Date</span><strong>${fmtD(j.deliveryDate)}</strong></div>
    <div><span style="font-size:10px;color:#94a3b8;display:block;">Status</span><strong>${j.status.toUpperCase()}</strong></div>
  </div>
  <div class="section"><div class="section-head">Customer</div>
    <div class="grid">
      <div class="cell" style="grid-column:span 2"><span class="label">Name</span>${j.customer}</div>
      <div class="cell" style="grid-column:span 2"><span class="label">Phone</span>${j.phone}</div>
    </div>
  </div>
  <div class="section"><div class="section-head">Garment</div>
    <div class="grid">
      <div class="cell"><span class="label">Type</span>${j.garment}</div>
      <div class="cell"><span class="label">Fabric</span>${j.fabric||'-'}</div>
      <div class="cell"><span class="label">Design/Color</span>${j.design||'-'}</div>
      <div class="cell"><span class="label">Qty</span>${j.qty||1}</div>
      <div class="cell"><span class="label">Tailor</span>${j.tailor||'-'}</div>
      <div class="cell"><span class="label">Urgency</span>${j.urgency||'Normal'}</div>
    </div>
  </div>
  <div class="section"><div class="section-head">Measurements (inches)</div>
    <div class="grid">
      <div class="cell"><span class="label">Chest</span>${m.chest||'-'}"</div>
      <div class="cell"><span class="label">Waist</span>${m.waist||'-'}"</div>
      <div class="cell"><span class="label">Hips</span>${m.hips||'-'}"</div>
      <div class="cell"><span class="label">Length</span>${m.length||'-'}"</div>
      <div class="cell"><span class="label">Sleeve</span>${m.sleeve||'-'}"</div>
      <div class="cell"><span class="label">Shoulder</span>${m.shoulder||'-'}"</div>
      <div class="cell"><span class="label">Neck</span>${m.neck||'-'}"</div>
      <div class="cell"><span class="label">Trouser</span>${m.trouser||'-'}"</div>
      ${m.notes?`<div class="cell" style="grid-column:span 4"><span class="label">Special Notes</span>${m.notes}</div>`:''}
    </div>
  </div>
  <div class="section"><div class="section-head">Payment</div>
    <div class="grid">
      <div class="cell"><span class="label">Total Charges</span><strong>${fmt(j.charges)}</strong></div>
      <div class="cell"><span class="label">Advance Paid</span><strong>${fmt(j.advance)}</strong></div>
      <div class="cell"><span class="label">Balance Due</span><strong style="color:#dc2626;">${fmt(j.balance)}</strong></div>
      <div class="cell"><span class="label">Method</span>${j.payMethod||'Cash'}</div>
    </div>
  </div>
  <div style="display:flex;justify-content:space-between;margin-top:20px;font-size:11px;color:#94a3b8;">
    <div style="border-top:1px solid #e2e8f0;width:180px;padding-top:6px;text-align:center;">Customer Signature</div>
    <div style="border-top:1px solid #e2e8f0;width:180px;padding-top:6px;text-align:center;">Shop Stamp / Signature</div>
  </div>
  <div class="footer"><p>Please bring this slip when collecting your garment.</p></div>
  <br><button onclick="window.print()" style="padding:8px 20px;background:#0a2342;color:#fff;border:none;border-radius:6px;cursor:pointer;">Print</button>
  </body></html>`);
  w.document.close();
}

function deleteJob(id) {
  if (!confirm('Delete this tailoring job?')) return;
  saveData('mch_tailoring', getData('mch_tailoring').filter(j => j.id!==id));
  toast('Deleted','danger'); render();
}

function render() {
  const jobs    = getData('mch_tailoring');
  const td      = today();
  const fStatus = document.getElementById('fStatus').value;
  const q       = document.getElementById('fSearch').value.toLowerCase();

  const list = jobs.filter(j =>
    (!fStatus || j.status===fStatus) &&
    (!q || j.customer.toLowerCase().includes(q) || j.garment.toLowerCase().includes(q) || (j.slip||'').toLowerCase().includes(q))
  ).reverse();

  const overdue    = jobs.filter(j => !['delivered','cancelled'].includes(j.status) && j.deliveryDate < td);
  const overdueEl  = document.getElementById('overdueAlert');
  if (overdue.length) {
    overdueEl.style.display = 'flex';
    document.getElementById('overdueText').textContent = `${overdue.length} tailoring job(s) are overdue! Please follow up with customers.`;
  } else {
    overdueEl.style.display = 'none';
  }

  document.getElementById('s-total').textContent    = jobs.length;
  document.getElementById('s-pending').textContent  = jobs.filter(j=>j.status==='pending').length;
  document.getElementById('s-progress').textContent = jobs.filter(j=>j.status==='progress').length;
  document.getElementById('s-ready').textContent    = jobs.filter(j=>j.status==='ready').length;
  document.getElementById('s-overdue').textContent  = overdue.length;
  document.getElementById('s-rev').textContent      = fmt(jobs.reduce((s,j)=>s+ +j.charges,0));

  const isOverdue = j => !['delivered','cancelled'].includes(j.status) && j.deliveryDate < td;
  document.getElementById('tailorBody').innerHTML = list.length ? list.map(j => `
    <tr style="${isOverdue(j)?'background:#fff5f5;':''}">
      <td><code>${j.slip||j.id.substr(-6).toUpperCase()}</code></td>
      <td><strong>${j.customer}</strong><br><small style="color:#94a3b8;">${j.phone}</small></td>
      <td>${j.garment}${j.urgency==='urgent'||j.urgency==='express'?`<br><span style="font-size:.7rem;color:#dc2626;font-weight:700;">⚡ ${j.urgency.toUpperCase()}</span>`:''}</td>
      <td>${j.tailor||'<span style="color:#cbd5e1;">Unassigned</span>'}</td>
      <td style="${isOverdue(j)?'color:#dc2626;font-weight:700;':''}">${fmtD(j.deliveryDate)}${isOverdue(j)?'<br><small style="color:#dc2626;">OVERDUE</small>':''}</td>
      <td style="font-weight:700;">${fmt(j.charges)}<br><small style="color:#dc2626;">${fmt(j.balance)} due</small></td>
      <td><span class="badge b-${j.status}">${j.status}</span></td>
      <td><span class="badge b-${j.payStatus||'pending'}">${j.payStatus||'pending'}</span></td>
      <td style="white-space:nowrap;">
        <button class="btn btn-ghost btn-sm" onclick="printJobSlip('${j.id}')" title="Print Slip"><i class="bi bi-printer"></i></button>
        <button class="btn btn-primary btn-sm" onclick="editJob('${j.id}')"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-danger btn-sm" onclick="deleteJob('${j.id}')"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join('')
    : '<tr><td colspan="9" style="text-align:center;padding:2rem;color:#cbd5e1;">No tailoring jobs found</td></tr>';
}

function exportAll() {
  const jobs = getData('mch_tailoring').map(j => ({
    slip: j.slip, customer: j.customer, phone: j.phone, garment: j.garment,
    fabric: j.fabric, qty: j.qty, tailor: j.tailor, urgency: j.urgency,
    chest: (j.measurements||{}).chest, waist: (j.measurements||{}).waist,
    hips: (j.measurements||{}).hips, length: (j.measurements||{}).length,
    sleeve: (j.measurements||{}).sleeve, shoulder: (j.measurements||{}).shoulder,
    neck: (j.measurements||{}).neck, trouser: (j.measurements||{}).trouser,
    charges: j.charges, advance: j.advance, balance: j.balance, payStatus: j.payStatus,
    date: j.date, deliveryDate: j.deliveryDate, status: j.status
  }));
  exportCSV(jobs, 'tailoring', Object.keys(jobs[0]||{}));
}

render();
