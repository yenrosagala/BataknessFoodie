import { rupiah } from './format.js';
import { fillDateSelect } from './dates.js';
import { buildMessage, openWhatsApp } from './whatsapp.js';
import { syncAddress, validate, readOrder } from './checkout.js';
import { insertOrder } from './db.js';
import { coordsOf, deliveryFee } from './geo.js';

const FIELDS = ['name', 'phone', 'address', 'date'];
const errsFor = (errs, field) => errs.filter(e => e.field === field);

export function initCartUI(cart, items, site) {
  const byId = new Map((items || []).map(i => [i.id, i]));
  const bar = document.getElementById('cart-bar');
  const drawer = document.getElementById('drawer');
  const panel = drawer.querySelector('.panel');
  const linesEl = document.getElementById('cart-lines');
  const total = document.getElementById('cart-total');
  const grandEl = document.getElementById('cart-grand');
  const ongkirLine = document.getElementById('ongkir-line');
  const ongkirEl = document.getElementById('cart-ongkir');
  const barCount = document.getElementById('bar-count');
  const barTotal = document.getElementById('bar-total');
  const form = document.getElementById('order-form');
  const err = document.getElementById('err');
  const send = document.getElementById('send');
  let tried = false;

  const subtotal = list => list.reduce((sum, { id, qty }) => sum + (byId.get(id)?.price || 0) * qty, 0);

  const addr = form.elements.address;
  const method = () => (form.querySelector('input[name="method"]:checked') || {}).value || 'antar';
  const refreshTotals = () => {
    const sub = subtotal(cart.lines());
    const fee = method() === 'antar' ? deliveryFee(coordsOf(addr.value), site) : null;
    total.textContent = rupiah(sub);
    ongkirLine.hidden = !fee;
    if (fee) ongkirEl.textContent = `${rupiah(fee.fee)} (${fee.km.toFixed(1)} km)`;
    grandEl.textContent = rupiah(sub + (fee ? fee.fee : 0));
  };

  const open = () => {
    drawer.hidden = false;
    refreshTotals();
    document.body.classList.add('no-scroll');
    document.getElementById('close-cart').focus();
  };
  const close = () => {
    drawer.hidden = true;
    document.body.classList.remove('no-scroll');
    document.getElementById('open-cart').focus();
  };

  document.getElementById('open-cart').addEventListener('click', open);
  document.getElementById('close-cart').addEventListener('click', close);
  drawer.addEventListener('click', e => { if (e.target === drawer) close(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !drawer.hidden) { close(); return; }
    if (e.key === 'Tab' && !drawer.hidden) {
      const nodes = [...panel.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )].filter(n => n.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      const outside = !panel.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || outside)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  form.querySelectorAll('input[name="method"]').forEach(r =>
    r.addEventListener('change', () => { syncAddress(form); refreshTotals(); }));
  addr.addEventListener('input', refreshTotals);
  syncAddress(form);

  if (!fillDateSelect(form.elements.date, site.preorder)) {
    document.getElementById('closed-note').hidden = false;
    form.elements.date.disabled = true;
    send.disabled = true;
  }

  const qtyButton = (label, aria, fn) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.setAttribute('aria-label', aria);
    b.addEventListener('click', fn);
    return b;
  };

  const line = ({ id, qty }) => {
    const it = byId.get(id) || { name: id, price: 0 };
    const li = document.createElement('li');
    const info = document.createElement('span');
    info.append(it.name);
    const priceLine = document.createElement('small');
    priceLine.textContent = rupiah(it.price * qty);
    info.append(document.createElement('br'), priceLine);
    const qtyWrap = document.createElement('span');
    qtyWrap.className = 'qty';
    const num = document.createElement('b');
    num.textContent = qty;
    qtyWrap.append(
      qtyButton('−', `Kurangi ${it.name}`, () => cart.dec(id)),
      num,
      qtyButton('+', `Tambah ${it.name}`, () => cart.inc(id))
    );
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove';
    remove.textContent = 'Hapus';
    remove.setAttribute('aria-label', `Hapus ${it.name} dari keranjang`);
    remove.addEventListener('click', () => cart.remove(id));
    const actions = document.createElement('span');
    actions.className = 'line-actions';
    actions.append(qtyWrap, remove);
    li.append(info, actions);
    return li;
  };

  cart.subscribe(() => {
    const list = cart.lines();
    const n = cart.count();
    barCount.textContent = n;
    barTotal.textContent = rupiah(subtotal(list));
    bar.hidden = n === 0;
    refreshTotals();
    linesEl.replaceChildren(...list.map(line));
    if (!drawer.hidden && n === 0) close();
  });

  const showFieldError = (field, msgs) => {
    const input = form.elements[field];
    if (!input) return;
    const label = input.closest('label');
    label.querySelector('.field-err')?.remove();
    input.classList.remove('invalid');
    input.removeAttribute('aria-invalid');
    const id = `err-${field}`;
    if (input.getAttribute('aria-describedby') === id) input.removeAttribute('aria-describedby');
    if (msgs.length) {
      const f = document.createElement('small');
      f.className = 'field-err';
      f.id = id;
      f.textContent = msgs[0].msg;
      label.append(f);
      input.classList.add('invalid');
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', id);
    }
  };
  const clearFieldErrors = () => FIELDS.forEach(f => showFieldError(f, []));
  const setFieldState = f => showFieldError(f, errsFor(validate(form), f));
  const wireLive = () => {
    if (tried) return;
    tried = true;
    FIELDS.forEach(f => {
      const el = form.elements[f];
      if (!el) return;
      const re = () => setFieldState(f);
      const ev = el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener('blur', re);
      el.addEventListener(ev, re);
    });
  };

  form.addEventListener('submit', e => {
    e.preventDefault();
    err.textContent = '';
    clearFieldErrors();
    const list = cart.lines();
    if (!list.length) {
      err.textContent = 'Keranjang masih kosong. Pilih menu dulu ya.';
      err.focus();
      return;
    }
    const errs = validate(form);
    if (errs.length) {
      errs.forEach(({ field }) => showFieldError(field, errsFor(errs, field)));
      wireLive();
      err.textContent = 'Perbaiki kolom yang disorot, lalu kirim lagi.';
      err.focus();
      return;
    }
    const order = readOrder(form);
    const fee = method() === 'antar' ? deliveryFee(coordsOf(addr.value), site) : null;
    const bill = subtotal(list) + (fee ? fee.fee : 0);

    // Save to the admin database in the background; WhatsApp stays the reliable
    // confirm path, so a Supabase outage never blocks a customer's order.
    insertOrder({
      customer_name: order.name,
      phone: order.phone,
      method: order.method,
      address: order.method === 'antar' ? order.address : null,
      delivery_date: order.date,
      notes: order.notes || null,
      items: list.map(({ id, qty }) => {
        const it = byId.get(id) || {};
        return { id, name: it.name || id, price: it.price || 0, qty };
      }),
      total: bill
    }).catch(err => console.error('Order save failed:', err));

    openWhatsApp(site.business.whatsapp, buildMessage({
      name: site.business.name,
      items: list.map(({ id, qty }) => ({ ...(byId.get(id) || {}), qty })),
      order,
      total: subtotal(list),
      fee
    }));
  });
}