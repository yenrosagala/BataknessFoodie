// Keyless delivery distance (no Maps API key, so no secret in the front-end).
// Coords come from the buyer's "Gunakan lokasi saya" link (js/location.js).
//
// ponytail: haversine is straight-line, not road distance. The roadFactor knob
// (site.json ongkir.roadFactor) inflates it toward real road km. Upgrade path if
// the fee ever needs to be exact: a paid distance API behind a backend proxy.
const R = 6371;
const MAPS = 'https://www.google.com/maps?q=';

export function coordsOf(text) {
  const m = /Lokasi: https:\/\/www\.google\.com\/maps\?q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(text || '');
  return m ? { lat: +m[1], lng: +m[2] } : null;
}

export function haversineKm(a, b) {
  const rad = d => d * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(a.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function deliveryFee(buyer, site) {
  const b = site?.business ?? {};
  const cfg = site?.ongkir ?? {};
  const rate = Number(cfg.perKm);
  if (!buyer || b.lat == null || b.lng == null || rate <= 0) return null;
  const km = haversineKm({ lat: +b.lat, lng: +b.lng }, buyer) * 2 * (Number(cfg.roadFactor) || 1);
  return { km, fee: Math.round(km * rate) };
}

export const mapsUrl = (lat, lng) => MAPS + lat + ',' + lng;
