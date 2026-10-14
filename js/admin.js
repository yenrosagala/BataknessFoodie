import { listOrders, setOrderStatus, signIn, signOut, isSignedIn, currentRole, insertOrder, listPlans, upsertPlans, listMenu, createMenuItem, updateMenuItem, deleteMenuItem } from './db.js';
import { rupiah, esc } from './format.js';
import { localISO } from './dates.js';
import { openWhatsApp } from './whatsapp.js';
import { drawReceipt, downloadReceipt, printReceipt } from './receipt.js';

const $ = id => document.getElementById(id);
const STATUSES = ['baru', 'diproses', 'dikirim', 'selesai'];
const FILTERS = ['semua', 'baru', 'diproses', 'dikirim', 'selesai'];
const NEXT = { baru: 'diproses', diproses: 'dikirim', dikirim: 'selesai' };
const ACTION = { baru: 'Proses order', diproses: 'Dikirim', dikirim: 'Selesai' };
const label = f => (f === 'semua' ? 'Semua' : f[0].toUpperCase() + f.slice(1));
const statCard = (l, v) => `<div class="card"><div class="card-body"><p>${esc(l)}</p><strong>${esc(v)}</strong></div></div>`;

// Which tabs each role sees. The role comes from Supabase user metadata (db.js); unknown = owner.
const ROLE_TABS = {
  kasir: ['pesanan'],
  admin: ['menu', 'jatah'],
  owner: ['ringkasan', 'analisis', 'pesanan', 'menu', 'jatah']
};
const ROLE_LABEL = { kasir: 'Kasir', admin: 'Admin', owner: 'Owner' };
let role = 'owner';
const allow = name => (ROLE_TABS[role] || ROLE_TABS.owner).includes(name);

let orders = [];
let filter = 'semua';
let anItem = '';
let planItems = [];
let menuItems = [];
let editingId = null;
let refreshTimer;
let biz = {};
let pickerMenu = [];
let picked = {};
let currentReceipt = null;
let wired = false;

const staffEl = $('staff');
const embedded = !!staffEl;
const setStaffMode = on => {
  if (!embedded) return;
  staffEl.hidden = !on;
  if (on) document.body.dataset.mode = 'staff';
  else delete document.body.dataset.mode;
};
const closeStaff = () => {
  clearInterval(refreshTimer);
  setStaffMode(false);
  if (location.hash === '#login') history.replaceState(null, '', location.pathname + location.search);
};

const show = view => {
  $('login').hidden = view !== 'login';
  $('app').hidden = view !== 'app';
  $('signout').hidden = view !== 'app';
  setStaffMode(true);
};

const usesOrders = () => allow('pesanan') || allow('ringkasan') || allow('analisis');

async function load() {
  if (!wired) { wireRole(); wired = true; }
  if (!usesOrders()) return;
  try {
    orders = await listOrders();
  } catch (e) {
    if (e.message === 'unauth') return show('login');
    $('orders').innerHTML = `<p class="note">${esc(e.message)}</p>`;
    $('stats').innerHTML = '';
    return;
  }
  if (allow('pesanan')) { renderFilters(); renderOrders(); }
  if (allow('ringkasan')) { renderStats(); renderOverview(); }
  if (allow('analisis')) renderAnalisis();
  startAutoRefresh();
}

/* One-time wiring for the panels this role can use. */
function wireRole() {
  if (allow('analisis')) wireAnalisis();
  if (allow('menu')) initMenu();
  if (allow('jatah')) initPlans();
  if (allow('pesanan')) loadPicker();
}

/* Live dashboard: re-fetch orders and re-render every panel that shows them. */
async function refresh() {
  if ($('app').hidden || !usesOrders()) return;
  try {
    orders = await listOrders();
  } catch (e) {
    if (e.message === 'unauth') return show('login');
    return;
  }
  if (allow('ringkasan')) { renderStats(); renderOverview(); }
  if (allow('analisis')) renderAnalisis();
  if (allow('pesanan')) renderOrders();
  stamp();
}

function stamp() {
  $('updated').textContent = `Diperbarui ${new Date().toLocaleTimeString('id-ID')}`;
}

// ponytail: 30s poll refetches all orders; switch to incremental/Realtime if the table grows large.
function startAutoRefresh() {
  stamp();
  clearInterval(refreshTimer);
  refreshTimer = setInterval(() => { if (!document.hidden) refresh(); }, 30000);
}

function renderStats() {
  const total = orders.reduce((s, o) => s + (o.total || 0), 0);
  const today = new Date().toDateString();
  const todayCount = orders.filter(o => new Date(o.created_at).toDateString() === today).length;

  const counts = {};
  orders.forEach(o => (o.items || []).forEach(it => {
    counts[it.name] = (counts[it.name] || 0) + (it.qty || 0);
  }));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  $('stats').innerHTML = [
    statCard('Total pesanan', String(orders.length)),
    statCard('Total omzet', rupiah(total)),
    statCard('Pesanan hari ini', String(todayCount)),
    statCard('Terlaris', top.length ? top.map(t => `${t[0]} ×${t[1]}`).join(', ') : '—')
  ].join('');
}

/* Ringkasan = overview widget grid: KPI cards + 7-day chart + status mix + latest-orders table. */
function renderOverview() {
  const today = localISO(new Date());
  const start = localISO(new Date(Date.now() - 6 * 864e5));
  $('ov-days').innerHTML = dayChartHTML(
    orders.filter(o => o.created_at && (d => d >= start && d <= today)(localISO(new Date(o.created_at)))),
    start, today);

  const mix = STATUSES.map(s => ({ s, n: orders.filter(o => (o.status || 'baru') === s).length }));
  const maxMix = Math.max(1, ...mix.map(m => m.n));
  $('ov-status').innerHTML = '<div class="chart-rows">' + mix.map(m =>
    `<div class="chart-row"><span class="chart-k">${label(m.s)}</span>` +
    `<span class="chart-track"><span class="chart-fill" style="width:${Math.round(m.n / maxMix * 100)}%"></span></span>` +
    `<span class="chart-v">${m.n}</span></div>`).join('') + '</div>';

  const recent = [...orders]
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    .slice(0, 8);
  $('ov-orders').innerHTML = recent.length
    ? '<div class="ov-table-wrap"><table class="ov-table"><thead><tr>' +
      '<th>Waktu</th><th>Pelanggan</th><th>Item</th><th class="num">Total</th><th>Status</th>' +
      '</tr></thead><tbody>' + recent.map(o => {
        const when = o.created_at ? new Date(o.created_at).toLocaleString('id-ID') : '';
        const items = (o.items || []).map(it => `${esc(it.name)} ×${it.qty}`).join(', ');
        return `<tr><td class="muted">${esc(when)}</td><td>${esc(o.customer_name || '—')}</td>` +
          `<td class="muted">${items}</td><td class="num">${rupiah(o.total)}</td>` +
          `<td><span class="badge">${esc(label(o.status || 'baru'))}</span></td></tr>`;
      }).join('') + '</tbody></table></div>'
    : '<p class="note">Belum ada pesanan.</p>';
}

function renderFilters() {
  $('filters').innerHTML = FILTERS
    .map(f => `<button class="chip" type="button" aria-pressed="${f === filter}" data-f="${f}">${label(f)}</button>`)
    .join('');
  $('filters').querySelectorAll('button').forEach(b =>
    b.addEventListener('click', () => { filter = b.dataset.f; renderFilters(); renderOrders(); }));
}

function card(o) {
  const when = o.created_at ? new Date(o.created_at).toLocaleString('id-ID') : '';
  const items = (o.items || []).map(it => `${esc(it.name)} ×${it.qty}`).join(', ');
  const st = o.status || 'baru';
  const act = ACTION[st]
    ? `<button class="btn small" type="button" data-id="${esc(o.id)}" data-next="${NEXT[st]}">${ACTION[st]}</button>`
    : '';
  return `<article class="card"><div class="card-body">
    <div class="card-foot"><strong>${esc(o.customer_name || '—')}</strong><small>${esc(when)}</small></div>
    <p>${items}</p>
    <p>${rupiah(o.total)} · ${esc(o.method === 'antar' ? 'Diantar' : 'Ambil sendiri')} · ${esc(o.delivery_date || '')}</p>
    ${o.phone ? `<p><a href="tel:${esc(o.phone)}">${esc(o.phone)}</a>${o.address ? ' · ' + esc(o.address) : ''}</p>` : (o.address ? `<p>${esc(o.address)}</p>` : '')}
    ${o.notes ? `<p>Catatan: ${esc(o.notes)}</p>` : ''}
    <div class="chips">${o.channel === 'kasir' ? '<span class="badge alt">Kasir</span>' : ''}<span class="badge">${esc(label(st))}</span>${o.channel === 'kasir' ? `<button class="chip" type="button" data-struk="${esc(o.id)}">Struk</button>` : ''}${act}</div>
  </div></article>`;
}

function renderOrders() {
  const done = filter === 'selesai';
  const list = done
    ? orders.filter(o => o.status === 'selesai')
    : (filter === 'semua' ? orders.filter(o => o.status !== 'selesai') : orders.filter(o => o.status === filter));
  $('export-selesai').hidden = !(done && list.length);
  $('orders').innerHTML = list.length ? list.map(card).join('') : '<p class="note">Belum ada pesanan.</p>';
  $('orders').querySelectorAll('button[data-next]').forEach(b =>
    b.addEventListener('click', () => {
      const o = orders.find(x => String(x.id) === b.dataset.id);
      if (!o) return;
      const step = b.dataset.next;
      $('app-err').textContent = '';
      // Online buyers get the WhatsApp message; walk-in (no phone) orders advance directly.
      if ((step === 'diproses' || step === 'dikirim') && o.phone) openSendDialog(o, step);
      else advance(o, step);
    }));
  $('orders').querySelectorAll('button[data-struk]').forEach(b =>
    b.addEventListener('click', () => {
      const o = orders.find(x => String(x.id) === b.dataset.struk);
      if (o) showReceipt(o);
    }));
}

/* Download every finished order as a CSV Excel opens. */
function exportFinished() {
  const rows = orders
    .filter(o => o.status === 'selesai')
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  if (!rows.length) return;
  const head = ['Tanggal', 'Pelanggan', 'Telepon', 'Metode', 'Alamat', 'Tanggal kirim', 'Item', 'Total', 'Catatan'];
  const cell = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
  const line = (o, when, items) => [
    cell(when), cell(o.customer_name), cell(o.phone),
    cell(o.method === 'antar' ? 'Diantar' : 'Ambil sendiri'), cell(o.address), cell(o.delivery_date),
    cell(items), String(o.total == null ? '' : o.total), cell(o.notes)
  ].join(';');
  const body = rows.map(o =>
    line(o, o.created_at ? new Date(o.created_at).toLocaleString('id-ID') : '',
      (o.items || []).map(it => `${it.name} x${it.qty}`).join(', ')));
  // BOM + semicolons so Excel (id-ID) reads UTF-8 and columns correctly.
  const blob = new Blob(['\uFEFF' + [head.map(cell).join(';'), ...body].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pesanan-selesai-${localISO(new Date())}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* Advance an order to its next status. */
async function advance(o, status) {
  try {
    await setOrderStatus(o.id, status);
    o.status = status;
    renderFilters();
    renderOrders();
  } catch (e) {
    $('app-err').textContent = e.message;
  }
}

/* Default WhatsApp text for a step; the admin can edit it in the dialog before sending. */
function messageFor(o, step) {
  const name = o.customer_name || 'Kak';
  if (step === 'dikirim') {
    return `Halo ${name}, pesananmu sedang dikirim. Mohon ditunggu ya. Terima kasih!`;
  }
  const lines = [
    `Halo ${name}, terima kasih sudah memesan! Pesananmu sedang kami proses:`,
    '',
    ...(o.items || []).map(it => `- ${it.name} x${it.qty}`),
    '',
    `Total: ${rupiah(o.total)}`
  ];
  if (o.method === 'antar' && o.address) lines.push(`Diantar ke: ${o.address}`);
  if (o.delivery_date) lines.push(`Tanggal: ${o.delivery_date}`);
  lines.push('', 'Kami kabari lagi kalau pesanan sudah dikirim.');
  return lines.join('\n');
}

let sendCtx = null;

function openSendDialog(o, step) {
  sendCtx = { o, step };
  $('send-err').textContent = '';
  $('send-text').value = messageFor(o, step);
  $('send-dialog').showModal();
  $('send-text').focus();
}

/* --- analisis (rentang tanggal) --- */
const pickLabels = (n, max) => {
  if (n <= max) return [...Array(n).keys()];
  const step = (n - 1) / (max - 1);
  const idx = new Set();
  for (let i = 0; i < max; i++) idx.add(Math.round(i * step));
  return [...idx].sort((a, b) => a - b);
};

/* Pure-CSS/SVG line chart of per-day revenue over [from, to]. valueOf(o) picks the score. */
function dayChartHTML(list, from, to, valueOf = o => o.total || 0) {
  if (!from || !to) return '<p class="note">Pilih rentang tanggal.</p>';
  if (from > to) return '<p class="note">Rentang tanggal tidak valid.</p>';
  const byDay = {};
  for (let d = new Date(from + 'T00:00:00'); localISO(d) <= to; d.setDate(d.getDate() + 1)) {
    byDay[localISO(d)] = { rev: 0, n: 0 };
  }
  list.forEach(o => {
    if (!o.created_at) return;
    const key = localISO(new Date(o.created_at));
    if (!byDay[key]) return;
    byDay[key].rev += valueOf(o);
    byDay[key].n++;
  });
  const days = Object.keys(byDay).sort();
  if (!days.length) return '<p class="note">Belum ada pesanan.</p>';
  const max = Math.max(1, ...days.map(d => byDay[d].rev));
  const n = days.length;
  const x = i => n === 1 ? 50 : (i / (n - 1)) * 100;
  const y = d => 98 - (byDay[d].rev / max) * 94;
  const line = days.map((d, i) => `${x(i).toFixed(2)},${y(d).toFixed(2)}`).join(' ');
  const hover = days.map((d, i) => {
    const w = 100 / n;
    return `<rect x="${(i * w).toFixed(2)}" y="0" width="${w.toFixed(2)}" height="100">` +
      `<title>${d.slice(5)}: ${rupiah(byDay[d].rev)} · ${byDay[d].n} pesanan</title></rect>`;
  }).join('');
  const labels = pickLabels(n, 7).map(i =>
    `<span style="left:${x(i).toFixed(2)}%">${days[i].slice(5)}</span>`).join('');
  return '<div class="line-chart">' +
    `<svg class="line-svg" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Omzet harian, puncak ${esc(rupiah(max))}">` +
    '<line class="line-grid" x1="0" y1="25" x2="100" y2="25"/>' +
    '<line class="line-grid" x1="0" y1="50" x2="100" y2="50"/>' +
    '<line class="line-grid" x1="0" y1="75" x2="100" y2="75"/>' +
    `<polygon class="line-area" points="0,100 ${line} 100,100"/>` +
    `<polyline class="line-path" points="${line}"/>` +
    `${hover}</svg><div class="line-labels">${labels}</div></div>`;
}

function renderAnalisis() {
  fillItemFilter();
  const from = $('an-from').value, to = $('an-to').value;
  const inRange = o => o.created_at && (d => d >= from && d <= to)(localISO(new Date(o.created_at)));
  const valueOf = o => anItem
    ? (o.items || []).filter(it => it.name === anItem).reduce((s, it) => s + (it.price || 0) * (it.qty || 0), 0)
    : (o.total || 0);
  const list = orders.filter(o => inRange(o) && (!anItem || (o.items || []).some(it => it.name === anItem)));
  const revenue = list.reduce((s, o) => s + valueOf(o), 0);
  const count = list.length;
  const antar = list.filter(o => o.method === 'antar').length;

  $('an-stats').innerHTML = [
    statCard('Omzet', rupiah(revenue)),
    statCard('Pesanan', String(count)),
    statCard('Rata-rata/pesanan', rupiah(count ? Math.round(revenue / count) : 0)),
    statCard('Diantar / Ambil', `${antar} / ${count - antar}`)
  ].join('');

  $('an-days').innerHTML = dayChartHTML(list, from, to, valueOf);

  const items = {};
  list.forEach(o => (o.items || []).forEach(it => {
    if (anItem && it.name !== anItem) return;
    (items[it.name] ||= { qty: 0, rev: 0 });
    items[it.name].qty += it.qty || 0;
    items[it.name].rev += (it.price || 0) * (it.qty || 0);
  }));
  const itemRows = Object.entries(items).sort((a, b) => b[1].rev - a[1].rev);
  const maxItem = Math.max(1, ...itemRows.map(([, v]) => v.rev));
  $('an-items').innerHTML = itemRows.length
    ? '<div class="chart-rows">' + itemRows.map(([name, v]) =>
        `<div class="chart-row"><span class="chart-k">${esc(name)} ×${v.qty}</span>` +
        `<span class="chart-track"><span class="chart-fill" style="width:${Math.round(v.rev / maxItem * 100)}%"></span></span>` +
        `<span class="chart-v">${rupiah(v.rev)}</span></div>`).join('') + '</div>'
    : '<p class="note">Belum ada item pada rentang ini.</p>';
}

function setRange(r) {
  const now = new Date();
  const back = r === 'today' ? 0 : r === '7' ? 6 : r === '30' ? 29 : null;
  $('an-from').value = back === null
    ? localISO(new Date(now.getFullYear(), now.getMonth(), 1))
    : localISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() - back));
  $('an-to').value = localISO(now);
}

function fillItemFilter() {
  const names = [...new Set(orders.flatMap(o => (o.items || []).map(it => it.name)))]
    .sort((a, b) => a.localeCompare(b, 'id'));
  const sel = $('an-item');
  const cur = [...sel.options].slice(1).map(o => o.value).join('\n');
  if (cur !== names.join('\n')) {
    sel.replaceChildren(new Option('Semua menu', ''), ...names.map(n => new Option(n, n)));
  }
  sel.value = names.includes(anItem) ? anItem : (anItem = '');
}

function wireAnalisis() {
  setRange('month');
  $('an-from').addEventListener('change', renderAnalisis);
  $('an-to').addEventListener('change', renderAnalisis);
  $('an-item').addEventListener('change', () => { anItem = $('an-item').value; renderAnalisis(); });
  $('an-presets').querySelectorAll('button').forEach(b =>
    b.addEventListener('click', () => { setRange(b.dataset.range); renderAnalisis(); }));
}

/* --- daily plan (jatah harian) --- */
async function loadMenu() {
  try {
    planItems = await listMenu();
  } catch (e) {
    $('plan-err').textContent = 'Gagal memuat menu untuk jatah.';
  }
}

function renderPlanRows(plans) {
  const byItem = new Map((plans || []).map(p => [p.item_id, p.daily_limit]));
  $('plan-rows').innerHTML = planItems
    .map(it => `<div class="plan-row"><b>${esc(it.name)}</b><label>Jatah per hari` +
      `<input type="number" min="0" data-item="${esc(it.id)}" value="${byItem.get(it.id) ?? ''}"></label></div>`)
    .join('');
}

async function loadPlans() {
  const date = $('plan-date').value;
  let plans;
  try {
    plans = await listPlans(date);
  } catch (e) {
    if (e.message === 'unauth') return show('login');
    $('plan-err').textContent = e.message;
    return;
  }
  renderPlanRows(plans);
}

async function savePlans() {
  const date = $('plan-date').value;
  if (!date) { $('plan-err').textContent = 'Pilih tanggal dulu.'; return; }
  $('plan-err').textContent = '';
  const rows = [];
  $('plan-rows').querySelectorAll('input[data-item]').forEach(inp => {
    if (inp.value === '') return;
    rows.push({ date, item_id: inp.dataset.item, daily_limit: Math.max(0, Number(inp.value) || 0) });
  });
  try {
    await upsertPlans(rows);
    $('plan-err').textContent = `Jatah ${date} tersimpan.`;
  } catch (e) {
    if (e.message === 'unauth') return show('login');
    $('plan-err').textContent = e.message;
  }
}

async function initPlans() {
  $('plan-date').value = localISO(new Date());
  $('plan-date').addEventListener('change', loadPlans);
  $('plan-save').addEventListener('click', savePlans);
  await loadMenu();
  await loadPlans();
}

/* --- menu management --- */
const slugify = s => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';

function freshId(name) {
  const base = slugify(name);
  const ids = new Set(menuItems.map(i => i.id));
  if (!ids.has(base)) return base;
  let n = 2;
  while (ids.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

const stored = (id, row) => ({
  id, name: row.name, category: row.category, description: row.description,
  price: row.price, unit: row.unit, available: row.available, bestSeller: row.best_seller,
  images: row.images || []
});

function renderCatList() {
  const cats = [...new Set(menuItems.map(i => i.category))].sort((a, b) => a.localeCompare(b));
  $('cat-list').innerHTML = cats.map(c => `<option value="${esc(c)}">`).join('');
}

function renderMenuList() {
  if (!menuItems.length) { $('menu-list').innerHTML = '<p class="note">Belum ada menu.</p>'; return; }
  $('menu-list').innerHTML = menuItems.map(it => `<article class="card"><div class="card-body">
    <div class="card-foot"><strong>${esc(it.name)}</strong><small>${esc(it.category)}</small></div>
    <p>${esc(it.description || '')}</p>
    <p>${rupiah(it.price)} / ${esc(it.unit)}${it.available ? '' : ' · <b>Habis</b>'}${it.bestSeller ? ' · Terlaris' : ''}${(it.images || []).length ? ` · ${it.images.length} foto` : ''}</p>
    <div class="chips">
      <button class="chip" type="button" data-edit="${esc(it.id)}">Ubah</button>
      <button class="chip" type="button" data-del="${esc(it.id)}">Hapus</button>
    </div>
  </div></article>`).join('');
  $('menu-list').querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => startEdit(b.dataset.edit)));
  $('menu-list').querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => removeItem(b.dataset.del)));
}

function resetMenuForm() {
  editingId = null;
  $('menu-form').reset();
  $('menu-form').elements.available.checked = true;
  $('menu-form-title').textContent = 'Tambah menu';
  $('menu-cancel').hidden = true;
  $('menu-err').textContent = '';
}

function startEdit(id) {
  const it = menuItems.find(x => x.id === id);
  if (!it) return;
  editingId = id;
  const f = $('menu-form').elements;
  f.name.value = it.name; f.category.value = it.category; f.description.value = it.description || '';
  f.price.value = it.price; f.unit.value = it.unit;
  f.available.checked = !!it.available; f.bestSeller.checked = !!it.bestSeller;
  f.images.value = (it.images || []).join('\n');
  $('menu-form-title').textContent = 'Ubah menu';
  $('menu-cancel').hidden = false;
  $('menu-err').textContent = '';
  $('menu-form').scrollIntoView({ block: 'start' });
}

async function removeItem(id) {
  $('menu-err').textContent = '';
  try {
    await deleteMenuItem(id);
    menuItems = menuItems.filter(x => x.id !== id);
    if (editingId === id) resetMenuForm();
    renderMenuList(); renderCatList();
  } catch (e) {
    if (e.message === 'unauth') return show('login');
    $('menu-err').textContent = e.message;
  }
}

async function initMenu() {
  try {
    menuItems = await listMenu();
  } catch (e) {
    $('menu-err').textContent = 'Gagal memuat menu. Sudah jalankan sql/menu.sql?';
    return;
  }
  renderCatList();
  renderMenuList();
}

$('menu-form').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target.elements;
  $('menu-err').textContent = '';
  const name = f.name.value.trim();
  if (!name) { $('menu-err').textContent = 'Nama wajib diisi.'; return; }
  const row = {
    name,
    category: f.category.value.trim() || 'Lainnya',
    description: f.description.value.trim(),
    price: Math.max(0, Math.round(Number(f.price.value) || 0)),
    unit: f.unit.value.trim() || 'porsi',
    available: f.available.checked,
    best_seller: f.bestSeller.checked,
    images: f.images.value.split('\n').map(s => s.trim()).filter(Boolean)
  };
  try {
    if (editingId) {
      await updateMenuItem(editingId, row);
      Object.assign(menuItems.find(x => x.id === editingId), stored(editingId, row));
    } else {
      const id = freshId(name);
      await createMenuItem({ id, ...row, sort: Date.now() });
      menuItems.push(stored(id, row));
    }
    resetMenuForm();
    renderMenuList();
    renderCatList();
  } catch (err) {
    if (err.message === 'unauth') return show('login');
    $('menu-err').textContent = err.message;
  }
});

$('menu-cancel').addEventListener('click', resetMenuForm);

/* --- tabs --- */
const TABS = [...document.querySelectorAll('#tabs [role="tab"]')];
function showTab(name) {
  TABS.forEach(t => {
    const on = t.dataset.tab === name;
    t.setAttribute('aria-selected', String(on));
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    if (on) $('view-title').textContent = t.textContent.trim();
  });
}
function applyRole() {
  role = currentRole() || 'owner';
  const tabs = ROLE_TABS[role] || ROLE_TABS.owner;
  TABS.forEach(t => { t.hidden = !tabs.includes(t.dataset.tab); });
  $('brand').textContent = ROLE_LABEL[role] || 'Panel';
  const first = TABS.find(t => !t.hidden);
  if (first) showTab(first.dataset.tab);
}
TABS.forEach(t => {
  t.addEventListener('click', () => showTab(t.dataset.tab));
  t.addEventListener('keydown', e => {
    const dir = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1
      : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    const vis = TABS.filter(x => !x.hidden);
    const i = vis.indexOf(t);
    if (i < 0) return;
    e.preventDefault();
    const next = vis[(i + dir + vis.length) % vis.length];
    next.focus();
    showTab(next.dataset.tab);
  });
});
showTab('ringkasan');

/* --- walk-in order builder + receipt (kasir / owner) --- */
async function loadPicker() {
  try {
    pickerMenu = await listMenu();
  } catch (e) {
    $('kasir-menu').innerHTML = '<p class="note">Gagal memuat menu.</p>';
    return;
  }
  try { biz = (await (await fetch('data/site.json')).json()).business || {}; } catch (e) {}
  renderPicker();
}

function renderPicker() {
  // ponytail: hide unavailable dishes; show all (dimmed) if that ever matters.
  const avail = pickerMenu.filter(m => m.available !== false);
  $('kasir-menu').innerHTML = avail.length
    ? avail.map(m => `<div class="order-row">
        <div class="info"><strong>${esc(m.name)}</strong><small>${rupiah(m.price)} / ${esc(m.unit || '')}</small></div>
        <input class="qty" type="number" min="0" inputmode="numeric" value="${picked[m.id] || 0}" data-id="${esc(m.id)}" aria-label="Jumlah ${esc(m.name)}">
      </div>`).join('')
    : '<p class="note">Belum ada menu tersedia.</p>';
  $('kasir-menu').querySelectorAll('input.qty').forEach(inp =>
    inp.addEventListener('input', () => {
      picked[inp.dataset.id] = Math.max(0, parseInt(inp.value, 10) || 0);
      updateTotal();
    }));
  updateTotal();
}

const pickedItems = () => pickerMenu
  .filter(m => (picked[m.id] || 0) > 0)
  .map(m => ({ id: m.id, name: m.name, price: m.price, qty: picked[m.id] }));

function updateTotal() {
  $('kasir-total').textContent = rupiah(pickedItems().reduce((s, it) => s + it.price * it.qty, 0));
}

async function createWalkin() {
  $('kasir-err').textContent = '';
  const items = pickedItems();
  if (!items.length) { $('kasir-err').textContent = 'Pilih minimal satu menu.'; return; }
  const order = {
    customer_name: $('kasir-name').value.trim() || 'Pelanggan',
    phone: '', method: 'ambil', address: '', delivery_date: '', notes: '',
    items, total: items.reduce((s, it) => s + it.price * it.qty, 0), channel: 'kasir'
  };
  $('kasir-create').disabled = true;
  try {
    await insertOrder(order);
  } catch (e) {
    $('kasir-err').textContent = e.message;
    return;
  } finally {
    $('kasir-create').disabled = false;
  }
  showReceipt({ ...order, created_at: new Date().toISOString() });
  picked = {};
  $('kasir-name').value = '';
  renderPicker();
  await refresh();
}

function showReceipt(order) {
  currentReceipt = order;
  $('receipt-img').src = drawReceipt(order, biz).toDataURL('image/png');
  $('receipt-dialog').showModal();
}

$('kasir-create').addEventListener('click', createWalkin);
$('receipt-close').addEventListener('click', () => $('receipt-dialog').close());
$('receipt-download').addEventListener('click', () => { if (currentReceipt) downloadReceipt(currentReceipt, biz, `struk-${Date.now()}.png`); });
$('receipt-print').addEventListener('click', () => { if (currentReceipt) printReceipt(currentReceipt, biz); });

/* --- wire --- */
$('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  $('login-err').textContent = '';
  try {
    await signIn(e.target.elements.email.value.trim(), e.target.elements.password.value);
    wired = false;
    applyRole();
    show('app');
    load();
  } catch (err) {
    $('login-err').textContent = err.message;
  }
});

$('signout').addEventListener('click', () => { clearInterval(refreshTimer); signOut(); orders = []; wired = false; show('login'); if (embedded) closeStaff(); });
$('refresh').addEventListener('click', refresh);
$('ov-more').addEventListener('click', () => showTab('pesanan'));
$('export-selesai').addEventListener('click', exportFinished);
document.addEventListener('visibilitychange', () => { if (!document.hidden && (!embedded || document.body.dataset.mode === 'staff')) refresh(); });

$('send-dialog').addEventListener('close', () => { sendCtx = null; });
$('send-cancel').addEventListener('click', () => $('send-dialog').close());
$('send-go').addEventListener('click', async () => {
  if (!sendCtx) return;
  const { o, step } = sendCtx;
  $('send-err').textContent = '';
  // window.open must run inside the click gesture, before the await, or the popup is blocked.
  openWhatsApp(o.phone, $('send-text').value);
  const ctx = sendCtx;
  $('send-dialog').close();
  await advance(ctx.o, ctx.step);
});

const bootStaff = () => {
  if (isSignedIn()) { applyRole(); show('app'); load(); } else { show('login'); }
};

if (embedded) $('close-staff').hidden = false;
if (!embedded || location.hash === '#login') bootStaff();
if (embedded) {
  addEventListener('hashchange', () => { if (location.hash === '#login') bootStaff(); });
  $('close-staff').addEventListener('click', closeStaff);
}
