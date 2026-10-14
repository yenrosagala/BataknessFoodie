// Draws an order receipt to a canvas (no library), so it can be shown, downloaded
// or printed. Used by the kasir page; reusable for the buyer receipt later.
import { rupiah } from './format.js';

const MONO = "'Courier New', ui-monospace, monospace";
const P = 36, W = 480;
const TITLE = 30, CITY = 20, META = 62, ITEM = 28, TOTAL = 30, FOOT = 34;
const GAP = 10, GAP2 = 14, GAP3 = 16, GAP5 = 18;

function fit(g, text, maxW) {
  let s = String(text);
  if (g.measureText(s).width <= maxW) return s;
  while (s.length > 1 && g.measureText(s + '…').width > maxW) s = s.slice(0, -1);
  return s + '…';
}

export function drawReceipt(order, biz = {}) {
  const items = order.items || [];
  const H = P + TITLE + (biz.city ? CITY : 0) + GAP + 1 + GAP5 + META
    + GAP2 + 1 + GAP3 + items.length * ITEM + 12 + 1 + GAP3 + TOTAL
    + (order.notes ? 22 : 0) + GAP5 + FOOT + P;

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const c = document.createElement('canvas');
  c.width = W * dpr;
  c.height = H * dpr;
  const g = c.getContext('2d');
  g.scale(dpr, dpr);
  g.textBaseline = 'top';
  g.fillStyle = '#fffdf8';
  g.fillRect(0, 0, W, H);

  let accent = '#8a2b2b';
  try { accent = getComputedStyle(document.documentElement).getPropertyValue('--color-brand').trim() || accent; } catch (e) {}

  const inner = W - P * 2;
  const mid = W / 2;
  const dash = y => {
    g.save();
    g.strokeStyle = '#d8cfc6';
    g.setLineDash([6, 6]);
    g.beginPath();
    g.moveTo(P, y + 0.5);
    g.lineTo(W - P, y + 0.5);
    g.stroke();
    g.restore();
  };

  let y = P;
  g.textAlign = 'center';
  g.fillStyle = accent;
  g.font = `bold 23px ${MONO}`;
  g.fillText(fit(g, biz.name || 'Toko', inner), mid, y + 4);
  y += TITLE;
  if (biz.city) {
    g.fillStyle = '#6b5d59';
    g.font = `13px ${MONO}`;
    g.fillText(fit(g, biz.city, inner), mid, y);
    y += CITY;
  }
  y += GAP;
  dash(y);
  y += 1 + GAP5;

  g.textAlign = 'left';
  g.fillStyle = '#111';
  g.font = `bold 15px ${MONO}`;
  g.fillText('STRUK PESANAN', P, y);
  y += 22;
  g.fillStyle = '#6b5d59';
  g.font = `13px ${MONO}`;
  g.fillText(order.created_at ? new Date(order.created_at).toLocaleString('id-ID') : new Date().toLocaleString('id-ID'), P, y);
  y += 20;
  g.fillText(fit(g, 'Pelanggan: ' + (order.customer_name || 'Pelanggan'), inner), P, y);
  y += 20 + GAP2;
  dash(y);
  y += 1 + GAP3;

  items.forEach(it => {
    g.textAlign = 'left';
    g.fillStyle = '#111';
    g.font = `14px ${MONO}`;
    g.fillText(fit(g, `${it.name} ×${it.qty || 0}`, inner - 120), P, y + 4);
    g.textAlign = 'right';
    g.fillText(rupiah((it.price || 0) * (it.qty || 0)), W - P, y + 4);
    y += ITEM;
  });

  y += 12;
  dash(y);
  y += 1 + GAP3;

  g.textAlign = 'left';
  g.fillStyle = '#111';
  g.font = `bold 18px ${MONO}`;
  g.fillText('TOTAL', P, y + 4);
  g.textAlign = 'right';
  g.fillStyle = accent;
  g.fillText(rupiah(order.total), W - P, y + 4);
  y += TOTAL;

  if (order.notes) {
    g.textAlign = 'left';
    g.fillStyle = '#6b5d59';
    g.font = `13px ${MONO}`;
    g.fillText(fit(g, 'Catatan: ' + order.notes, inner), P, y);
    y += 22;
  }

  y += GAP5;
  g.textAlign = 'center';
  g.fillStyle = accent;
  g.font = `14px ${MONO}`;
  g.fillText('Terima kasih!', mid, y);
  y += 20;
  g.fillStyle = '#a89b93';
  g.font = `12px ${MONO}`;
  g.fillText('Simpan struk ini sebagai bukti pesanan.', mid, y);

  return c;
}

function receiptBlob(order, biz) {
  return new Promise(resolve => drawReceipt(order, biz).toBlob(resolve, 'image/png'));
}

export function downloadReceipt(order, biz, filename) {
  receiptBlob(order, biz).then(b => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = filename || `struk-${Date.now()}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
}

export function printReceipt(order, biz) {
  const src = drawReceipt(order, biz).toDataURL('image/png');
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.write('<!doctype html><title>Struk</title><body style="margin:0;text-align:center">'
    + `<img src="${src}" style="width:100%;max-width:480px">`
    + '<script>window.onload=function(){window.focus();window.print()}<\/script></body>');
  w.document.close();
  return true;
}
