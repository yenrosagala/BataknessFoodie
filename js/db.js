// Supabase data access via native fetch (no supabase-js dependency).
// Public storefront: insertOrder (anon, insert-only RLS policy).
// Admin: signIn/signOut + listOrders/setOrderStatus (authenticated RLS policies).
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './supabase-config.js';

const url = SUPABASE_URL.replace(/\/+$/, '');
const KEY = SUPABASE_PUBLISHABLE_KEY;
const SESSION_KEY = 'batak-admin-session';

const headers = token => ({
  apikey: KEY,
  Authorization: `Bearer ${token || KEY}`,
  'Content-Type': 'application/json'
});

/* --- session storage (per AGENTS.md: storage in try/catch) --- */
const ROLES = ['kasir', 'admin', 'owner'];
// Role comes from the Supabase user's metadata ({ "role": "kasir" }). Missing/unknown = owner
// (ponytail: only the owner creates staff accounts, so a role-less user is the owner).
const roleOf = user => {
  const r = user && user.user_metadata && user.user_metadata.role;
  return ROLES.includes(r) ? r : 'owner';
};

function saveSession(d) {
  const prev = loadSession();
  const s = {
    access_token: d.access_token,
    refresh_token: d.refresh_token,
    expires_at: Date.now() + (d.expires_in || 3600) * 1000,
    email: (d.user && d.user.email) || (prev && prev.email) || '',
    role: d.user ? roleOf(d.user) : ((prev && prev.role) || 'owner')
  };
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) {}
  return s;
}
function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { return null; }
}
function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
}

/* --- public: create an order --- */
export async function insertOrder(row) {
  const r = await fetch(`${url}/rest/v1/orders`, {
    method: 'POST',
    headers: { ...headers(), Prefer: 'return=minimal' },
    body: JSON.stringify(row)
  });
  if (!r.ok) throw new Error('Gagal menyimpan pesanan.');
}

/* --- auth --- */
export async function signIn(email, password) {
  const r = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email, password })
  });
  if (!r.ok) throw new Error('Email atau kata sandi salah.');
  return saveSession(await r.json());
}

export function signOut() {
  clearSession();
}

export const isSignedIn = () => !!loadSession();

// Current user's role ('kasir' | 'admin' | 'owner'), or null when signed out.
export function currentRole() {
  const s = loadSession();
  return s ? (s.role || 'owner') : null;
}

// Valid access token, refreshing it when close to expiry.
async function token() {
  let s = loadSession();
  if (!s) return null;
  if (s.expires_at - Date.now() < 30000) {
    const r = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ refresh_token: s.refresh_token })
    });
    if (!r.ok) { clearSession(); return null; }
    s = saveSession(await r.json());
  }
  return s.access_token;
}

/* --- admin: read + update --- */
export async function listOrders(channel) {
  const t = await token();
  if (!t) throw new Error('unauth');
  const q = channel ? `&channel=eq.${encodeURIComponent(channel)}` : '';
  const r = await fetch(`${url}/rest/v1/orders?select=*&order=created_at.desc${q}`, { headers: headers(t) });
  if (r.status === 401) { clearSession(); throw new Error('unauth'); }
  if (!r.ok) throw new Error('Gagal memuat pesanan. Sudah jalankan SQL tabel orders?');
  return r.json();
}

export async function setOrderStatus(id, status) {
  const t = await token();
  if (!t) throw new Error('unauth');
  const r = await fetch(`${url}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { ...headers(t), Prefer: 'return=minimal' },
    body: JSON.stringify({ status })
  });
  if (!r.ok) throw new Error('Gagal memperbarui status.');
}

/* --- daily plan (jatah harian) --- */
export async function fetchRemaining() {
  const r = await fetch(`${url}/rest/v1/rpc/remaining_today`, { headers: headers() });
  if (!r.ok) throw new Error('Gagal memuat sisa.');
  return r.json(); // [{ id, remaining }]
}

export async function listPlans(date) {
  const t = await token();
  if (!t) throw new Error('unauth');
  const r = await fetch(`${url}/rest/v1/daily_plans?date=eq.${encodeURIComponent(date)}&select=item_id,daily_limit`,
    { headers: headers(t) });
  if (r.status === 401) { clearSession(); throw new Error('unauth'); }
  if (!r.ok) throw new Error('Gagal memuat jatah.');
  return r.json();
}

export async function upsertPlans(rows) {
  const t = await token();
  if (!t) throw new Error('unauth');
  const r = await fetch(`${url}/rest/v1/daily_plans?on_conflict=date,item_id`, {
    method: 'POST',
    headers: { ...headers(t), Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows)
  });
  if (r.status === 401) { clearSession(); throw new Error('unauth'); }
  if (!r.ok) throw new Error('Gagal menyimpan jatah.');
}

/* --- menu (public read + owner crud) --- */
const MENU_COLS = 'id,name,category,description,price,unit,available,best_seller,images';
const toMenu = r => ({
  id: r.id, name: r.name, category: r.category, description: r.description,
  price: r.price, unit: r.unit, available: r.available, bestSeller: r.best_seller,
  images: r.images || []
});

export async function listMenu() {
  const r = await fetch(`${url}/rest/v1/menu_items?select=${MENU_COLS}&order=sort.asc,created_at.asc`,
    { headers: headers() });
  if (!r.ok) throw new Error('Gagal memuat menu.');
  return (await r.json()).map(toMenu);
}

export async function createMenuItem(row) {
  const t = await token();
  if (!t) throw new Error('unauth');
  const r = await fetch(`${url}/rest/v1/menu_items`, {
    method: 'POST', headers: { ...headers(t), Prefer: 'return=minimal' }, body: JSON.stringify(row)
  });
  if (r.status === 401) { clearSession(); throw new Error('unauth'); }
  if (!r.ok) throw new Error('Gagal menambah menu.');
}

export async function updateMenuItem(id, row) {
  const t = await token();
  if (!t) throw new Error('unauth');
  const r = await fetch(`${url}/rest/v1/menu_items?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH', headers: { ...headers(t), Prefer: 'return=minimal' }, body: JSON.stringify(row)
  });
  if (r.status === 401) { clearSession(); throw new Error('unauth'); }
  if (!r.ok) throw new Error('Gagal menyimpan menu.');
}

export async function deleteMenuItem(id) {
  const t = await token();
  if (!t) throw new Error('unauth');
  const r = await fetch(`${url}/rest/v1/menu_items?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE', headers: { ...headers(t), Prefer: 'return=minimal' }
  });
  if (r.status === 401) { clearSession(); throw new Error('unauth'); }
  if (!r.ok) throw new Error('Gagal menghapus menu.');
}
