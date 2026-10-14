import { rupiah } from './format.js';
import { openDish } from './dish-modal.js';

export function renderMenu(menu, onAdd, remaining = new Map()) {
  const items = menu.items || [];
  const cats = menu.categories || [...new Set(items.map(i => i.category))];
  const fav = document.getElementById('fav-grid');
  const grid = document.getElementById('menu-grid');
  const chips = document.getElementById('chips');

  const stateOf = item => {
    const left = remaining.get(item.id);
    const hasPlan = item.available && typeof left === 'number';
    return { left, hasPlan, outToday: hasPlan && left <= 0 };
  };

  const card = item => {
    const state = stateOf(item);

    const el = document.createElement('article');
    el.className = 'card' + (item.available && state.outToday ? ' dayout' : item.available ? '' : ' soldout');

    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'ph';
    thumb.textContent = item.name.charAt(0).toUpperCase();
    thumb.setAttribute('aria-label', `Lihat detail ${item.name}`);
    thumb.addEventListener('click', () => openDish(item, state, onAdd));

    const body = document.createElement('div');
    body.className = 'card-body';
    const h = document.createElement('h3');
    h.textContent = item.name;
    const p = document.createElement('p');
    p.textContent = item.description;
    body.append(h, p);
    if (state.hasPlan) {
      const sisa = document.createElement('b');
      sisa.className = 'badge';
      sisa.textContent = state.left > 0 ? `Sisa hari ini: ${state.left}` : 'Habis hari ini';
      body.append(sisa);
    }

    const foot = document.createElement('div');
    foot.className = 'card-foot';
    const price = document.createElement('strong');
    price.textContent = `${rupiah(item.price)} / ${item.unit}`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn small';
    if (!item.available) {
      btn.textContent = 'Habis';
      btn.disabled = true;
    } else if (state.outToday) {
      btn.textContent = 'Habis hari ini';
      btn.disabled = true;
    } else {
      btn.textContent = 'Tambah';
      btn.addEventListener('click', () => onAdd(item.id));
    }
    foot.append(price, btn);

    el.append(thumb, body, foot);
    el.addEventListener('click', e => { if (!e.target.closest('button')) openDish(item, state, onAdd); });
    return el;
  };

  if (fav) fav.replaceChildren(...items.filter(i => i.bestSeller).map(card));

  if (!grid) return;

  const show = cat => {
    const list = cat === 'Semua' ? items : items.filter(i => i.category === cat);
    grid.replaceChildren(...list.map(card));
  };

  if (chips) {
    chips.replaceChildren(...['Semua', ...cats].map((c, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = c;
      b.setAttribute('aria-pressed', String(i === 0));
      b.addEventListener('click', () => {
        chips.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        show(c);
      });
      return b;
    }));
  }

  show('Semua');
}
