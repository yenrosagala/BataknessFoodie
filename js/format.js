const idr = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
});

const dayFmt = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const rupiah = n => idr.format(Number(n) || 0);
export const longDate = d => dayFmt.format(d);
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ESC[c]);
