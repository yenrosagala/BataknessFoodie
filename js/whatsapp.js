import { rupiah } from './format.js';

export function buildMessage({ name, items, order, total }) {
  const lines = [`Halo ${name}, saya mau pesan:`, ''];
  items.forEach((it, i) => lines.push(`${i + 1}. ${it.name} x${it.qty} = ${rupiah(it.price * it.qty)}`));
  lines.push('', `Subtotal: ${rupiah(total)}`, '');
  lines.push(`Nama: ${order.name}`);
  lines.push(`HP: ${order.phone}`);
  lines.push(`Metode: ${order.method === 'antar' ? 'Diantar' : 'Ambil sendiri'}`);
  if (order.method === 'antar') lines.push(`Alamat: ${order.address}`);
  lines.push(`Tanggal: ${order.date}`);
  if (order.notes) lines.push(`Catatan: ${order.notes}`);
  lines.push('', 'Pesanan dikonfirmasi setelah kami membalas. Terima kasih.');
  return lines.join('\n');
}

// ponytail: ID-only normalization (0…/8… -> 62…); other country codes are sent as typed.
export const waBase = number => {
  let digits = String(number || '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '62' + digits.slice(1);
  else if (digits.startsWith('8')) digits = '62' + digits;
  return digits ? `https://wa.me/${digits}` : 'https://wa.me/';
};

export function openWhatsApp(number, text) {
  window.open(`${waBase(number)}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
}
