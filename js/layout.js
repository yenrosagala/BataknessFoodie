import { esc } from './format.js';
import { waBase } from './whatsapp.js';

const NAV = [
  { page: 'home', href: 'index.html', label: 'Beranda' },
  { page: 'menu', href: 'menu.html', label: 'Menu' },
  { page: 'cerita', href: 'tentang.html', label: 'Cerita' },
  { page: 'info', href: 'info.html', label: 'Info' },
];

const ICON_MOON = '<svg class="ic-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>';
const ICON_SUN = '<svg class="ic-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/></svg>';

export function renderLayout(site) {
  const b = site.business || {};
  const wa = waBase(b.whatsapp);
  const page = document.body.dataset.page || '';
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';

  const top = document.createElement('div');
  top.innerHTML =
    `<div id="banner"${site.sampleData ? '' : ' hidden'}>DATA CONTOH: ganti nama, harga, halal, dan kontak dengan data asli sebelum rilis.</div>
<header>
  <strong>${esc(b.name || '')}</strong>
  <nav class="site-nav" aria-label="Navigasi utama">
    ${NAV.map(n => `<a href="${n.href}"${n.page === page ? ' aria-current="page"' : ''}>${n.label}</a>`).join('')}
  </nav>
  <div class="header-actions">
    <a class="btn small" href="menu.html">Pesan</a>
    <a class="admin-link" href="index.html#login">Login</a>
    <button id="theme-toggle" class="theme-toggle" type="button" aria-pressed="${dark}" aria-label="Ganti tema terang atau gelap">${ICON_MOON}${ICON_SUN}</button>
  </div>
</header>
<div class="ulos"></div>`;

  const bottom = document.createElement('div');
  bottom.innerHTML =
    `<footer><strong>${esc(b.name || '')}</strong><p>${esc(b.city || '')}</p><a id="wa-contact" class="btn" href="${wa}" target="_blank" rel="noopener">Chat WhatsApp</a></footer>
<div id="cart-bar" hidden><span><b id="bar-count">0</b> item · <b id="bar-total"></b></span><button id="open-cart" class="btn small">Lihat Keranjang</button></div>
<div id="drawer" hidden><div class="panel" role="dialog" aria-label="Keranjang">
  <div class="drawer-head"><h2>Keranjang</h2><button id="close-cart" class="btn small ghost" type="button">Tutup</button></div>
  <ul id="cart-lines"></ul>
  <div class="drawer-foot">
    <p><b>Subtotal: <span id="cart-total"></span></b></p>
    <p id="ongkir-line" hidden><b>Ongkir: <span id="cart-ongkir"></span></b></p>
    <p><b>Total: <span id="cart-grand"></span></b></p>
    <p class="note" id="closed-note" hidden>Pre-order sedang ditutup.</p>
    <form id="order-form" novalidate>
      <label>Nama<input name="name" required></label>
      <label>No. HP<input name="phone" type="tel" required></label>
      <div class="row"><label><input type="radio" name="method" value="antar" checked> Diantar</label><label><input type="radio" name="method" value="ambil"> Ambil sendiri</label></div>
      <div id="addr-wrap"><label>Alamat<textarea name="address" rows="2"></textarea></label>
        <button id="geo-btn" type="button" class="btn small ghost">Gunakan lokasi saya (Google Maps)</button>
        <p id="geo-note" class="note" aria-live="polite" hidden></p></div>
      <label>Tanggal<select id="f-date" name="date"></select></label>
      <label>Catatan<textarea name="notes" rows="2"></textarea></label>
      <p id="err" role="alert" tabindex="-1"></p>
      <button id="send" class="btn" type="submit">Kirim via WhatsApp</button>
      <p><small>Pesanan dikonfirmasi setelah kami membalas di WhatsApp.</small></p>
    </form>
  </div>
</div></div>`;

  document.body.prepend(...top.children);
  document.body.append(bottom);
}
