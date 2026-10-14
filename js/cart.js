const KEY = 'batak-cart-v1';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return new Map(raw ? JSON.parse(raw) : []);
  } catch {
    return new Map();
  }
}

export function createCart() {
  const lines = load();
  const listeners = new Set();

  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify([...lines]));
    } catch {
      // storage blocked: keep working in memory
    }
  };
  const notify = () => {
    save();
    listeners.forEach(fn => fn());
  };
  const setQty = (id, qty) => {
    if (qty <= 0) lines.delete(id);
    else lines.set(id, qty);
    notify();
  };

  return {
    add: id => setQty(id, (lines.get(id) || 0) + 1),
    inc: id => setQty(id, (lines.get(id) || 0) + 1),
    dec: id => setQty(id, (lines.get(id) || 0) - 1),
    remove: id => { lines.delete(id); notify(); },
    lines: () => [...lines].filter(([, q]) => q > 0).map(([id, qty]) => ({ id, qty })),
    count: () => [...lines.values()].reduce((n, q) => n + q, 0),
    subscribe(fn) {
      listeners.add(fn);
      fn();
      return () => listeners.delete(fn);
    }
  };
}
