checkAuth();

const KEYS = ['mch_transactions','mch_products','mch_orders','mch_tailoring','mch_customers'];
const KEY_LABELS = { mch_transactions:'Transactions', mch_products:'Products', mch_orders:'Orders', mch_tailoring:'Tailoring Jobs', mch_customers:'Customers' };

function loadBizInfo() {
  const biz = JSON.parse(localStorage.getItem('mch_bizinfo')||'{}');
  document.getElementById('bizName').value  = biz.name||'Madina Cloth House';
  document.getElementById('bizOwner').value = biz.owner||'';
  document.getElementById('bizPhone').value = biz.phone||'';
  document.getElementById('bizWA').value    = biz.whatsapp||'';
  document.getElementById('bizEmail').value = biz.email||'';
  document.getElementById('bizCity').value  = biz.city||'Narang Mandi';
  document.getElementById('bizAddr').value  = biz.address||'';
  document.getElementById('bizHours').value = biz.hours||'';
}

function saveBizInfo() {
  const biz = {
    name:     document.getElementById('bizName').value.trim(),
    owner:    document.getElementById('bizOwner').value.trim(),
    phone:    document.getElementById('bizPhone').value.trim(),
    whatsapp: document.getElementById('bizWA').value.trim(),
    email:    document.getElementById('bizEmail').value.trim(),
    city:     document.getElementById('bizCity').value.trim(),
    address:  document.getElementById('bizAddr').value.trim(),
    hours:    document.getElementById('bizHours').value.trim(),
  };
  localStorage.setItem('mch_bizinfo', JSON.stringify(biz));
  toast('Business info saved!');
}

function changePin() {
  const current  = document.getElementById('pinCurrent').value;
  const newPin   = document.getElementById('pinNew').value;
  const confirm_ = document.getElementById('pinConfirm').value;
  const stored   = localStorage.getItem('mch_pin')||'1234';
  if (current !== stored)     { toast('Current PIN is incorrect','danger'); return; }
  if (!/^\d{4}$/.test(newPin)) { toast('PIN must be exactly 4 digits','warning'); return; }
  if (newPin !== confirm_)    { toast('New PINs do not match','warning'); return; }
  localStorage.setItem('mch_pin', newPin);
  ['pinCurrent','pinNew','pinConfirm'].forEach(id => document.getElementById(id).value = '');
  toast('PIN updated successfully!');
}

function changeCredentials() {
  const currentPass = document.getElementById('currentPassword').value;
  const newUser     = document.getElementById('newUsername').value.trim();
  const newPass     = document.getElementById('newPassword').value;
  const confirmPass = document.getElementById('confirmPassword').value;

  const creds = JSON.parse(localStorage.getItem('mch_credentials') || '{"username":"admin","password":"admin123"}');
  if (currentPass !== creds.password) { toast('Current password is incorrect','danger'); return; }

  if (newPass && newPass !== confirmPass) { toast('New passwords do not match','warning'); return; }
  if (newPass && newPass.length < 6) { toast('Password must be at least 6 characters','warning'); return; }

  if (newUser) creds.username = newUser;
  if (newPass) creds.password = newPass;
  localStorage.setItem('mch_credentials', JSON.stringify(creds));
  ['currentPassword','newPassword','confirmPassword'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('newUsername').value = '';
  toast('Credentials updated successfully!');
}

function renderSummary() {
  const rows = KEYS.map(k => {
    const d = getData(k);
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:.5rem .75rem;background:#f8fafc;border-radius:8px;">
      <span style="font-size:.84rem;color:#374151;">${KEY_LABELS[k]}</span>
      <span style="font-weight:700;color:var(--navy);">${d.length} records</span>
    </div>`;
  });
  const total = KEYS.reduce((s,k)=>s+getData(k).length,0);
  rows.push(`<div style="display:flex;justify-content:space-between;align-items:center;padding:.5rem .75rem;background:var(--navy);border-radius:8px;">
    <span style="font-size:.84rem;color:rgba(255,255,255,.7);">Total Records</span>
    <span style="font-weight:700;color:var(--gold);">${total}</span>
  </div>`);
  document.getElementById('dataSummary').innerHTML = rows.join('');
}

function backupData() {
  const backup = {};
  KEYS.forEach(k => backup[k] = getData(k));
  backup.mch_bizinfo = JSON.parse(localStorage.getItem('mch_bizinfo')||'{}');
  backup._meta = { exportedAt: new Date().toISOString(), version: '1.0' };
  const blob = new Blob([JSON.stringify(backup, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `mch-backup-${today()}.json`;
  a.click();
  toast('Backup downloaded!');
}

function restoreData() {
  const file = document.getElementById('restoreFile').files[0];
  if (!file) { toast('Select a backup file first','warning'); return; }
  if (!confirm('This will OVERWRITE all current data with the backup. Are you sure?')) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      KEYS.forEach(k => { if (data[k]) localStorage.setItem(k, JSON.stringify(data[k])); });
      if (data.mch_bizinfo) localStorage.setItem('mch_bizinfo', JSON.stringify(data.mch_bizinfo));
      toast('Data restored successfully!');
      loadBizInfo(); renderSummary();
    } catch(err) { toast('Invalid backup file','danger'); }
  };
  reader.readAsText(file);
}

function clearData(key) {
  if (!confirm(`Clear ALL ${KEY_LABELS[key]}? This cannot be undone.`)) return;
  localStorage.setItem(key, '[]');
  toast(`${KEY_LABELS[key]} cleared`,'danger');
  renderSummary();
}

function clearAll() {
  if (!confirm('Delete ALL data from ALL sections? This is permanent and cannot be undone!')) return;
  if (!confirm('Are you absolutely sure? All transactions, orders, inventory, tailoring jobs and customers will be deleted.')) return;
  KEYS.forEach(k => localStorage.setItem(k, '[]'));
  localStorage.removeItem('mch_bizinfo');
  toast('All data cleared','danger');
  loadBizInfo(); renderSummary();
}

loadBizInfo();
renderSummary();
