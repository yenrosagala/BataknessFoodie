function methodOf(form) {
  const r = form.querySelector('input[name="method"]:checked');
  return r ? r.value : 'antar';
}

export function syncAddress(form) {
  const wrap = document.getElementById('addr-wrap');
  const input = form.elements.address;
  const need = methodOf(form) === 'antar';
  wrap.hidden = !need;
  input.required = need;
}

export function validate(form) {
  const val = n => (form.elements[n] ? form.elements[n].value : '').trim();
  const errs = [];
  if (!val('name')) errs.push({ field: 'name', msg: 'Nama wajib diisi.' });
  if (val('phone').replace(/[\s-]/g, '').length < 8) errs.push({ field: 'phone', msg: 'Nomor HP tidak valid (minimal 8 angka).' });
  if (methodOf(form) === 'antar' && !val('address')) errs.push({ field: 'address', msg: 'Alamat wajib diisi untuk pengiriman.' });
  if (!val('date')) errs.push({ field: 'date', msg: 'Pilih tanggal pengiriman.' });
  return errs;
}

export function readOrder(form) {
  const dateOpt = form.elements.date.selectedOptions[0];
  return {
    name: form.elements.name.value.trim(),
    phone: form.elements.phone.value.trim(),
    method: methodOf(form),
    address: form.elements.address.value.trim(),
    date: dateOpt ? dateOpt.textContent : '',
    notes: form.elements.notes.value.trim()
  };
}
