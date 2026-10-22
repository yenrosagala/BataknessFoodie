import { rupiah } from './format.js';

export function buildMessage({ name, items, order, total, fee }) {
  const lines = [`Halo ${name}, saya mau pesan:`, ''];
  items.forEach((it, i) => lines.push(`${i + 1}. ${it.name} x${it.qty} = ${rupiah(it.price * it.qty)}`));
  lines.push('', `Subtotal: ${rupiah(total)}`);
  if (fee) lines.push(`Ongkir (${fee.km.toFixed(1)} km pulang-pergi): ${rupiah(fee.fee)}`);
  lines.push(`Total: ${rupiah(total + (fee ? fee.fee : 0))}`, '');
  lines.push(`Nama: ${order.name}`);
  lines.push(`HP: ${order.phone}`);
  lines.push(`Metode: ${order.method === 'antar' ? 'Diantar' : 'Ambil sendiri'}`);
  if (order.method === 'antar') lines.push(`Alamat: ${order.address}`);
  lines.push(`Tanggal: ${order.date}`);
  if (order.notes) lines.push(`Catatan: ${order.notes}`);
  lines.push('', 'Pesanan dikonfirmasi setelah kami membalas. Terima kasih.');
  return lines.join('\n');
}

export const waBase = number => `https://wa.me/${String(number || '').replace(/\D/g, '')}`;

export function openWhatsApp(number, text) {
  window.open(`${waBase(number)}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
}
