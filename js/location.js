// Location confirm: uses the browser's geolocation + the keyless Google Maps
// link (no API key). The maps link is appended to the address so it flows to
// both the WhatsApp message and the Supabase order without a schema change.
// Needs a secure context (https or localhost) for geolocation to work.

const MAPS = 'https://www.google.com/maps?q=';
const LINE = /Lokasi: https:\/\/www\.google\.com\/maps\?q=-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?\s*$/;

export function initLocation() {
  const btn = document.getElementById('geo-btn');
  const note = document.getElementById('geo-note');
  const addr = document.querySelector('#order-form [name="address"]');
  if (!btn || !note || !addr) return;

  const say = (msg, url) => {
    note.hidden = false;
    note.replaceChildren(document.createTextNode(msg));
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = 'Buka di Google Maps';
      note.append(document.createTextNode(' '), a);
    }
  };

  btn.addEventListener('click', () => {
    if (!navigator.geolocation) { say('Browser ini tidak mendukung lokasi.'); return; }
    btn.disabled = true;
    say('Mengambil lokasi…');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const url = MAPS + lat + ',' + lng;
        addr.value = addr.value.replace(LINE, '').trimEnd();
        addr.value = (addr.value ? addr.value + '\n' : '') + 'Lokasi: ' + url;
        addr.dispatchEvent(new Event('input', { bubbles: true }));
        btn.disabled = false;
        say('Lokasi dikirim ke pemilik lewat alamat. Pastikan titiknya benar.', url);
      },
      err => {
        btn.disabled = false;
        say(err && err.code === 1
          ? 'Akses lokasi ditolak. Isi alamat manual ya.'
          : 'Gagal mengambil lokasi. Isi alamat manual ya.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}
