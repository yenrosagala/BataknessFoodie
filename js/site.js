import { esc } from './format.js';
import { waBase } from './whatsapp.js';
import { createCart } from './cart.js';
import { renderMenu } from './menu.js';
import { initCartUI } from './cart-ui.js';
import { renderLayout } from './layout.js';
import { initLocation } from './location.js';
import { fetchRemaining, listMenu } from './db.js';

const $ = id => document.getElementById(id);
const get = p => fetch(p).then(r => {
  if (!r.ok) throw new Error(`Gagal memuat ${p}`);
  return r.json();
});

async function main() {
  let site = { business: {}, delivery: [], story: [], faq: [], preorder: {} };
  let menu = { items: [] };
  try {
    site = await get('data/site.json');
  } catch (e) {
    console.error(e);
  }
  // Menu lives in Supabase (admin can add items). Fall back to the static seed
  // file only when the table is not reachable yet (e.g. sql/menu.sql not run).
  try {
    menu = { items: await listMenu() };
  } catch (e) {
    console.error(e);
    try { menu = await get('data/menu.json'); } catch (e2) { console.error(e2); }
  }

  const b = site.business || {};
  document.title = `${b.name || 'Makanan Batak'} | ${document.body.dataset.title || 'Makanan Batak Asli'}`;

  renderLayout(site);
  document.querySelectorAll('[data-biz]').forEach(el => { el.textContent = b[el.dataset.biz] || ''; });

  if ($('halal')) $('halal').textContent = site.halal || '';
  if ($('story')) $('story').innerHTML = (site.story || []).map(t => `<p>${esc(t)}</p>`).join('');
  if ($('delivery')) $('delivery').innerHTML = (site.delivery || []).map(t => `<li>${esc(t)}</li>`).join('');
  if ($('faq')) $('faq').innerHTML = (site.faq || [])
    .map(x => `<details><summary>${esc(x.q)}</summary><p>${esc(x.a)}</p></details>`)
    .join('');

  if ($('wa-catering')) {
    $('wa-catering').href = `${waBase(b.whatsapp)}?text=${encodeURIComponent(
      'Halo, saya mau tanya paket catering untuk acara. Jenis acara: ... Tanggal: ... Jumlah tamu: ...'
    )}`;
  }

  const cart = createCart();
  let remaining = [];
  try { remaining = await fetchRemaining(); } catch (e) { console.error(e); }
  if (!Array.isArray(remaining)) remaining = [];
  renderMenu(menu, id => cart.add(id), new Map(remaining.map(x => [x.id, x.remaining])));
  initCartUI(cart, menu.items, site);
  initLocation();
}

main();
