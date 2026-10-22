import { rupiah } from './format.js';

let root, panel, stage, dots, prev, next, closeBtn, counter, titleEl, descEl, priceEl, footEl;
let item = null, imgs = [], idx = 0, opener = null;

function build() {
  if (root) return;
  root = document.createElement('div');
  root.id = 'dish-modal';
  root.hidden = true;
  root.innerHTML = `
    <div class="dish-panel" role="dialog" aria-modal="true" aria-label="Detail menu">
      <button class="dish-close" type="button" aria-label="Tutup">×</button>
      <div class="carousel">
        <button class="car-btn car-prev" type="button" aria-label="Foto sebelumnya">‹</button>
        <div class="car-stage"></div>
        <button class="car-btn car-next" type="button" aria-label="Foto berikutnya">›</button>
        <span class="car-counter"></span>
      </div>
      <div class="car-dots" role="group" aria-label="Pilih foto"></div>
      <div class="dish-body">
        <h2></h2>
        <p></p>
        <div class="card-foot"><strong></strong></div>
      </div>
    </div>`;
  document.body.append(root);

  panel = root.querySelector('.dish-panel');
  stage = root.querySelector('.car-stage');
  dots = root.querySelector('.car-dots');
  prev = root.querySelector('.car-prev');
  next = root.querySelector('.car-next');
  closeBtn = root.querySelector('.dish-close');
  counter = root.querySelector('.car-counter');
  titleEl = root.querySelector('.dish-body h2');
  descEl = root.querySelector('.dish-body p');
  priceEl = root.querySelector('.dish-body strong');
  footEl = root.querySelector('.card-foot');

  closeBtn.addEventListener('click', close);
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  root.addEventListener('click', e => { if (e.target === root) close(); });
  document.addEventListener('keydown', onKey);
}

function go(d) {
  const n = imgs.length;
  if (n < 2) return;
  idx = (idx + d + n) % n;
  renderStage();
}

function renderStage() {
  stage.replaceChildren();
  if (imgs.length) {
    const img = document.createElement('img');
    img.src = imgs[idx];
    img.alt = `${item.name} foto ${idx + 1}`;
    img.loading = 'lazy';
    img.width = 560;
    img.height = 260;
    stage.append(img);
  } else {
    const ph = document.createElement('div');
    ph.className = 'ph';
    ph.textContent = item.name.charAt(0).toUpperCase();
    ph.setAttribute('aria-hidden', 'true');
    stage.append(ph);
  }
  const many = imgs.length > 1;
  counter.textContent = many ? `${idx + 1} / ${imgs.length}` : '';
  prev.hidden = next.hidden = !many;
  dots.hidden = !many;
  dots.replaceChildren(...(many ? imgs.map((_, i) => {
    const d = document.createElement('button');
    d.type = 'button';
    d.className = 'car-dot';
    d.setAttribute('aria-label', `Foto ${i + 1}`);
    d.setAttribute('aria-current', String(i === idx));
    d.addEventListener('click', () => { idx = i; renderStage(); });
    return d;
  }) : []));
}

function onKey(e) {
  if (root.hidden) return;
  if (e.key === 'Escape') { close(); return; }
  if (e.key === 'ArrowLeft') { go(-1); return; }
  if (e.key === 'ArrowRight') { go(1); return; }
  if (e.key === 'Tab') {
    const nodes = [...panel.querySelectorAll(
      'button:not([disabled]):not([hidden]), a[href], [tabindex]:not([tabindex="-1"])'
    )].filter(n => n.offsetParent !== null);
    if (!nodes.length) return;
    const first = nodes[0], last = nodes[nodes.length - 1];
    const outside = !panel.contains(document.activeElement);
    if (e.shiftKey && (document.activeElement === first || outside)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
}

function close() {
  if (root.hidden) return;
  root.hidden = true;
  document.body.classList.remove('no-scroll');
  if (opener && document.contains(opener)) opener.focus();
}

export function openDish(nextItem, state, onAdd) {
  build();
  item = nextItem;
  imgs = (nextItem.images || []).filter(Boolean);
  idx = 0;
  opener = document.activeElement;

  panel.setAttribute('aria-label', nextItem.name);
  titleEl.textContent = nextItem.name;
  descEl.textContent = nextItem.description || '';
  // ponytail: show sold count from admin-written localStorage; ceiling: local-only, not live cross-device — upgrade to server count if needed
  root.querySelectorAll('.sold-badge').forEach(x => x.remove());
  let sold = 0;
  try {
    const raw = localStorage.getItem('batak:sales');
    if (raw) sold = +(JSON.parse(raw) || {})[nextItem.id] || 0;
  } catch(e){}
  if (sold) {
    const b = document.createElement('b');
    b.className = 'badge alt sold-badge';
    b.textContent = `Terjual ${sold}x`;
    descEl.after(b);
  }
  priceEl.textContent = `${rupiah(nextItem.price)} / ${nextItem.unit}`;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn';
  if (!nextItem.available) { btn.textContent = 'Habis'; btn.disabled = true; }
  else if (state.outToday) { btn.textContent = 'Habis hari ini'; btn.disabled = true; }
  else {
    btn.textContent = 'Tambah ke keranjang';
    btn.addEventListener('click', () => { onAdd(nextItem.id); close(); });
  }
  footEl.replaceChildren(priceEl, btn);

  renderStage();
  root.hidden = false;
  document.body.classList.add('no-scroll');
  closeBtn.focus();
}
