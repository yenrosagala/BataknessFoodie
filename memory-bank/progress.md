# Progress

Update this file after each completed and validated step: what was done, files created or changed, decisions made, problems and fixes.

## Completed steps

### Step 1: Project scaffold
- Created folders css/, js/, data/, images/.
- Created index.html (minimal valid shell), css/main.css and js/main.js (empty), data/menu.json and data/site.json (valid JSON placeholders), .gitignore.
- Initialized the git repo.
- Test passed: site served locally shows a blank page with no console errors.

### Steps 2-13: Full Phase 1 site (built in ONE pass at the user's request)
- Step 2: design tokens + mobile-first base + sticky header (css/main.css).
- Step 3: data/site.json and data/menu.json filled with placeholder content (owner data marked [ISI]).
- Steps 4-5: js/menu.js renders cards, category chips, and "Menu Favorit" (bestSeller).
- Step 6: js/cart.js (state + localStorage in try/catch + subscribe) and js/format.js (Intl rupiah/date).
- Step 7: js/cart-ui.js drawer + sticky bottom bar.
- Step 8: js/checkout.js form toggle + Indonesian validation.
- Step 9: js/dates.js pre-order cutoff and delivery-date options.
- Step 10: js/whatsapp.js message builder + wa.me link.
- Steps 11-12: index.html hero, cerita, menu, cara pesan, pengiriman + FAQ, catering, kontak, footer.
- Step 13: meta/OG tags, JSON-LD built from site.json, robots.txt (sitemap deferred, no domain yet).
- js/main.js loads both JSON files and wires everything.
- NOTE: Steps 2-13 were done in one pass; each still needs its test from implementation-plan.md.

### Redesign: adopt owner's newer mock + real menu
- Copied the owner's index.html, css/main.css, data/menu.json, data/site.json into batak-web and removed the root copies.
- Rewrote the JS to the new markup and data shapes: cart.js is now a createCart() factory (id->qty only), menu.js renders fav + chips + grid, cart-ui.js owns the drawer AND the checkout submit, checkout.js/dates.js/whatsapp.js/format.js adapted, main.js fills the new ids.
- New data shapes: site.sampleData, site.halal is a string, site.delivery and site.story are arrays, preorder = deliveryWeekday / cutoffDaysBefore / cutoffHour / weeks; menu.json has no pricesAreSample flag (site.sampleData drives the banner).
- Verified: 8 JS files pass node --check, both JSON valid, all getElementById ids present, delivery-date math checked, server returns 200.

### Design system refactor (css/main.css)
- Rebuilt css/main.css as a token-first stylesheet: brand primitives + semantic colour tokens (light/dark), fluid type scale (clamp headings), 8pt spacing, radius/shadow/motion/z tokens. Components consume tokens only.
- Curated palette + hand-verified WCAG AA contrast for all text pairs in both themes (the design-token generator's default output had a broken red ramp, so it was discarded in favour of a checked ramp). White-on-gold fails AA, so gold keeps ink text.
- Added interaction states (hover/active/disabled), :focus-visible rings, 44px minimum touch targets, pointer-capable hover guards, prefers-reduced-motion guard.
- No HTML/JS changes needed: same class/id names. Verified braces balanced, all HTML/JS classes covered, server returns 200 for the new css.

### Manual light/dark theme toggle
- Dark styles moved from @media (prefers-color-scheme) to :root[data-theme="dark"]; added color-scheme per theme.
- New js/theme.js (classic script in <head>): resolves theme from localStorage or system before paint, and wires the new header #theme-toggle button (moon/sun icon, aria-pressed). Storage wrapped in try/catch.
- Verified: theme.js passes node --check, css braces balanced, theme.js served 200.

### Step 14: Supabase orders + admin page
- Added a backend via Supabase (no server, no npm, no supabase-js — native fetch).
- New files: js/supabase-config.js (url + publishable key), js/db.js (insertOrder / signIn / signOut / listOrders / setOrderStatus), admin.html, js/admin.js (login + stats + order list + status).
- cart-ui.js submit now inserts the order to Supabase AND opens WhatsApp (WhatsApp kept as the reliable confirm path).
- robots.txt disallows /admin.html; admin page is noindex and unlinked.
- Verified: all 12 JS pass node --check, index.html + admin.html + db.js + admin.js serve 200.

REQUIRED SUPABASE SETUP (owner must run once, in the Supabase SQL editor):
  create table public.orders (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    customer_name text not null,
    phone text not null,
    method text not null check (method in ('antar','ambil')),
    address text,
    delivery_date text,
    notes text,
    items jsonb not null,
    total integer not null,
    status text not null default 'baru'
  );
  alter table public.orders enable row level security;
  create policy "anon insert" on public.orders for insert to anon with check (true);
  create policy "owner read"   on public.orders for select to authenticated using (true);
  create policy "owner update" on public.orders for update to authenticated using (true);
Then Authentication > Users > Add user (owner email + password) for admin login.

### Admin login entry point
- "Login" link in the header, upper-right, inside a .header-actions group (theme toggle + Login + Pesan). admin.html reveals the dashboard after sign-in.
- Styled .admin-link as a pill control matching the theme toggle; header now wraps so it cannot overflow at 360px. #login-err / #app-err reuse #err red.

### Multi-page site + shared layout
- Split the one-page index.html into 4 pages: index.html (Beranda), menu.html (Menu), tentang.html (Cerita), info.html (Info). Each has one <main> and loads js/site.js.
- New js/layout.js injects the shared chrome (banner, header/nav, ulos, footer, cart bar, drawer) from site.json; new js/site.js replaces js/main.js as the per-page entry (fetch data, title, renderLayout, fill page fields, wire cart). Deleted js/main.js.
- theme.js toggle now uses event delegation (header is injected after load); menu.js renders only the elements present on the page.
- CSS: global h1 rule, .dark h1 gold, .site-nav styles.
- Verified: 13 JS pass node --check, CSS balanced, all 4 pages + admin + new JS serve 200, <main> on each page.

### Fix: cart/checkout dead on every page (bug)
- Symptom: adding to cart did nothing (no bar, no drawer lines) and "Kirim via WhatsApp" did nothing.
- Cause: cart.subscribe(fn) calls fn() with NO argument, but the cart-ui callback expected a list and ran list.reduce -> TypeError. The throw happened during initCartUI init, so the submit listener (later in initCartUI) was never attached.
- Fix: the callback now reads state itself via cart.lines() (matches the one other caller). Re-verified end to end with headless Chrome on index.html and menu.html: add -> bar shows, drawer lists the item, dates fill, submit opens wa.me, no console exceptions.

### Feature: delivery location via Google Maps
- Added "Gunakan lokasi saya" in the delivery address block. Uses the browser's geolocation + a keyless google.com/maps?q=lat,lng link (no Google Maps API key — respects the "no keys in front-end" rule). The link is appended to the address field as a "Lokasi: <url>" line, so it flows to both the WhatsApp message and the Supabase order with no schema change.
- js/location.js (new), js/layout.js (button + note), js/site.js (initLocation()).
- Verified with headless Chrome (geolocation override): address becomes "Jl. Merdeka No. 1\nLokasi: https://www.google.com/maps?q=-6.2,106.816666", note + link render, no console exceptions. Falls back to an Indonesian message on denial/timeout/unsupported.

## Current step
Owner test: click through Beranda -> Menu -> Cerita -> Info, add to cart, submit (WhatsApp opens), then header "Login" -> admin. Not committed yet.

### Test data: dummy orders
- Inserted 7 dummy rows into public.orders via the REST API using the public publishable key (anon insert policy) — no service key. Names marked "[TES] ...", notes "[DUMMY]". Spread across statuses baru/diproses/selesai and dates so the admin stats have something to show.
- Bulk insert needs identical key sets on every object (else PGRST102); each row carries created_at.
- CLEAN UP before going live (owner, SQL editor): delete from public.orders where customer_name like '[TES]%';

### Feature: daily quota (jatah harian)
- Owner sets per-date, per-item limits in admin; the storefront shows "Sisa hari ini" on cards; at 0 the item's "Tambah" is disabled and shows "Habis hari ini". "Sisa" = that day's plan minus qty of orders placed today (any status), clamped at 0, computed in Asia/Jakarta time.
- New sql/quota.sql (owner runs once in the SQL editor): daily_plans(date, item_id, daily_limit) with unique(date,item_id), owner-only FULL CRUD RLS, and remaining_today() — a SECURITY DEFINER function exposing ONLY {item_id, remaining} aggregates so anon can read remaining without reaching orders/daily_plans tables. Grant execute to anon + authenticated. (Column is daily_limit — "limit" is a Postgres reserved word and caused 42601; fixed when the owner ran it.)
- Storefront: js/db.js fetchRemaining() -> RPC, js/site.js fetches it (failure is caught and ignored — badge just doesn't show until the plan exists), js/menu.js renderMenu(menu, onAdd, remaining) — badge + .dayout disabled state.
- Admin: Jatah harian section in admin.html/#app (after Ringkasan, before Pesanan); date input defaults to today; rows = menu.json items with empty-limit meaning "no plan that day = unlimited"; save upserts only filled rows via on_conflict=date,item_id + merge-duplicates. js/db.js listPlans/upsertPlans, js/admin.js initPlans + renderPlanRows + savePlans.
- Verified: node --check on all JS; headless Chrome on menu.html still adds to cart and opens wa.me with no exceptions (remaining fetch returns [] until the SQL is run — that single logged error disappears once quota.sql is applied).
- TODO (owner): run sql/quota.sql in the SQL editor, then set a plan in admin for today. The [TES] dummy orders are summed into today's sold count, so a small limit immediately shows "Habis hari ini" — handy for testing. v1 keys on order-placed date; upgrading to delivery-date remaining is possible later if desired.

### UX improvements (rounds A-B-C-D, user-approved)
- Drawer cart now behaves like a dialog: opening locks body scroll, Esc or backdrop-click closes, focus moves to the close button on open and returns to the cart bar on close, and Tab/Shift-Tab cycles inside the panel.
- Checkout form shows inline errors under each invalid field (.field-err with aria-invalid + aria-describedby), a focusable summary line, and live re-validation per field on blur/input/change after the first failed submit; switching antar/ambil clears the address error state.
- Each cart line has a "Hapus" (remove) button wired to cart.remove(id); removing the last item auto-closes the drawer; the subtotal stays pinned under the scrollable line list.
- Sell-out presentation: cards marked .dayout get a 2px dashed border (no more opacity wash); the "Sisa hari ini: N" line is now a .badge pill (brand-tinted) that turns solid danger red with "--Habis hari ini--" at 0; --badge-text token keeps AA contrast in both themes.
- Files: js/cart-ui.js (rewritten), js/checkout.js (validate now returns {field, msg}), js/menu.js (badge), css/main.css (no-scroll, outline focus ring replacing the low-contrast box-shadow, .drawer-head/#cart-lines/.drawer-foot flex column, .line-actions/.remove, .field-err/.invalid, .badge/.dayout), js/layout.js (drawer markup + novalidate + #err tabindex).
- Verified: node --check on all 4 touched JS; headless Chrome on menu.html — 18 checks pass (open/close, scroll lock, focus trap wrap, focus return, empty-cart inline errors, errors clear live as each field is fixed, Hapus hides bar, wa.me still opens); index/tentang/info load with zero exceptions (only the expected logged "Gagal memuat sisa." until quota.sql runs).
- NOTE from the earlier quota step still applies: owner must run sql/quota.sql before .dayout/badge can be seen in the browser.

### Admin: hide finished orders
- Orders with status "selesai" no longer render as cards; the moment an order is marked finished it disappears from the list. The "Selesai" filter chip is removed (it could never show anything). Stats still count all orders including finished ones (omzet needs them). js/admin.js only.

### Admin: Analisis (performance/revenue)
- New "Analisis" section in admin.html (after Ringkasan): date-range (default = 1st of month → today), stat cards (Omzet, Pesanan, Rata-rata/pesanan, Diantar/Ambil), a per-day revenue table and a per-item revenue table, each row with a CSS bar (no chart library).
- js/admin.js: renderAnalisis() + initAnalisis() (filter orders by created_at local date within [from,to], all statuses included — finished orders still count for revenue). Pure aggregation, client-side over the already-loaded orders.
- css/main.css: .table-wrap (tables + horizontal scroll on mobile), .bar. Verified aggregation math with a throwaway node check (range filter, revenue 195000, antar count, top item by revenue).
- LIMIT: revenue only. No cost/margin — the site doesn't record COGS or expenses, so profit can't be computed yet.

### Admin: sections as tabs
- admin.html #app split into 4 tabs (Ringkasan, Analisis, Pesanan, Jatah harian): a role=tablist of role=tab buttons + role=tabpanel sections; only one panel visible at a time.
- js/admin.js: showTab(name) toggles aria-selected + panel hidden; click + ArrowLeft/ArrowRight (wraps, moves focus) keyboard support. admin.html keeps the same element ids so all existing wiring is unchanged.
- css/main.css: .tabs / .tab (aria-selected underline via inset box-shadow, 44px targets, hover).
- Verified with headless Chrome: initial = Ringkasan only, each tab shows its panel + aria-selected, ArrowRight wraps Jatah→Ringkasan and focuses it, no console errors.

### Over-engineering audit cleanup (ponytail)
- Whole-repo audit (read-only), then applied the cuts. No behaviour change.
- Deleted: 10 unused CSS tokens (--gold-100/--gold-700/--radius-lg/--red-100/--red-300/--red-400/--red-500/--space-10/--space-12/--space-16) and the redundant .btn.small min-height (already set by .btn); the menu.json `type` field on all 6 items (nothing read it); site.json business.instagram (unrendered); cart.js exports setQty/clear/qtyOf (no callers — setQty stays as the internal setter).
- De-duped: added waBase(number) to js/whatsapp.js and used it in layout.js + site.js (WhatsApp base was built twice); exported localISO from js/dates.js and imported it in admin.js (was defined twice); merged admin.js stat()/statCard() into one statCard at module scope; un-exported deliveryDates + dropped its now param (kept only for a since-removed test); un-exported methodOf.
- Verified: node --check on all 14 JS, both JSON parse, and headless Chrome — index/tentang/info load clean, 18-check UX suite passes, zero console errors.

### Menu bar tidy (header/nav)
- Header is now sticky (top:0, z-index 5) so the nav stays reachable while scrolling long pages. To let sticky work, js/layout.js spreads the top wrapper's children onto <body> instead of prepending the wrapper div (a short wrapper would trap the sticky header). Banner + ulos still scroll away above it.
- Desktop (>=720px): one clean row — brand (left), nav links, then right-aligned Pesan CTA + theme toggle. Mobile keeps brand + actions on row 1 with the nav wrapping to row 2 (flex order + flex-basis, 44px targets unchanged).
- The owner-only "Login" link (→ admin.html) sits in the top bar, in .header-actions next to the theme toggle, vertically centered with it (both 44px). At 360px the brand + Pesan + Login + theme still fit on row 1 with no horizontal overflow.
- css/main.css: header sticky+z-index; .header-actions order:1 (Pesan CTA, Login link, theme toggle); .site-nav order:2 + flex-basis:100% (mobile), reset to order:0/flex:0 1 auto at >=720px; removed the now-unused `.site-nav .btn { margin-left:auto }`. js/layout.js: header markup reordered (brand, nav, header-actions).
- Verified headless Chrome on all 4 pages at 360px and 1200px: header parent = BODY + position:sticky, correct order values per breakpoint, aria-current matches the page, Login present in the header (not the footer), Login + theme toggle same row + vertically centered, no horizontal overflow, zero console errors; smoke (index/tentang/info) + the 18-check UX suite still pass.

### Admin: add new menu (menu_items)
- New "Menu" tab in admin (after Pesanan, before Jatah harian): add a dish, edit it, or delete it — no code change needed. Fields: name, category (with a datalist of existing categories), description, price, unit, Tersedia + Terlaris checkboxes. New ids are slugified from the name with a -2/-3 suffix if taken; created items get sort=Date.now() so they append after the seeded ones.
- The menu now lives in the Supabase menu_items table; data/menu.json is only the seed/fallback. sql/menu.sql (owner runs once in the SQL editor) creates menu_items (public SELECT for anon+authenticated; write only for authenticated) and seeds the 6 original dishes with on conflict do nothing.
- Files: sql/menu.sql (new), js/db.js (listMenu / createMenuItem / updateMenuItem / deleteMenuItem), js/site.js (menu from listMenu() with a menu.json fallback), admin.html (Menu tab + #panel-menu form/list), js/admin.js (renderCatList / renderMenuList / add-edit-delete + wiring; the jatah form now also uses listMenu()).
- Verified: node --check on the changed JS; headless Chrome — admin shows 5 tabs, tab Menu switches panel + aria-selected, all 7 form fields present, empty submit shows "Nama wajib diisi."; storefront menu.html still renders 6 cards + 5 chips via the menu.json fallback (only error is the expected "Gagal memuat menu." until sql/menu.sql is run); smoke (index/tentang/info) + the 18-check UX suite still pass.
- TODO (owner): run sql/menu.sql in the Supabase SQL editor. Until then the storefront uses the menu.json fallback and the admin Menu tab shows a load error. After that, add/edit dishes from admin.

### Storefront: dish detail modal (image carousel + add to cart)
- Clicking anywhere on a menu card (any Menu/Favorit card) opens a modal with an image carousel, the full description, the price, and an "Tambah ke keranjang" button. Adding closes the modal so the bottom cart bar is visible.
- Images come from the dish itself: new images text[] column on menu_items, entered in the admin as one URL per line. No images → the modal shows the same letter placeholder (.ph) as the card. Arrows + dots (44px) + "n / m" counter appear only with 2+ images; ArrowLeft/ArrowRight/Escape/Tab are handled, focus goes to the close button, and the overlay is a flex-centered modal with body scroll locked (mirrors the cart drawer pattern).
- The card thumbnail is now a real <button class="ph"> ("Lihat detail <name>") so keyboard/AT users have a trigger; the whole card is also clickable via a delegated handler that ignores clicks on the inner buttons (so the card's own "Tambah" quick-add still works without opening the modal).
- Files: js/dish-modal.js (new — openDish(item, state, onAdd); builds its DOM lazily, caches it), js/menu.js (thumb is a button + card click opens the modal; shared stateOf() computes available/dayout once per card), js/db.js (images added to MENU_COLS + toMenu), admin.html + js/admin.js (images textarea; parse one-URL-per-line on save, rejoin with \n on edit, list shows " · N foto"), css/main.css (#dish-modal + .carousel styles; .ph restyled to work as a button, tokens only), sql/menu.sql (images text[] not null default '{}' in the create + idempotent `alter table ... add column if not exists`).
- Verified headless Chrome (menu.html): thumb is BUTTON + aria-label, modal opens with role=dialog, scroll locked, placeholder slide when no images, dots hidden with 0/1 image, title/desc/price/add label correct, focus on close button, closes via X and Escape, opens by clicking the title text, add closes modal + cart bar shows + count changes, quick-add button does NOT open the modal; admin shows 8/8 fields (images = TEXTAREA); smoke (index/tentang/info) + the 18-check UX suite still pass. Only console error is the expected "Gagal memuat menu." until the SQL is run.
- TODO (owner): re-run sql/menu.sql (now includes the images column) so photos save/load; until then dishes render with the letter placeholder.

### Sticky footer (footer pinned to the bottom of the screen)
- The footer now stays at the bottom of the screen instead of floating mid-page when a page is shorter than the viewport. body is a flex column with min-height 100dvh; main gets flex:1 so it absorbs the spare height and pushes the footer down.
- The 84px space for the fixed cart bar moved off the always-on body padding onto a conditional rule — body:has(#cart-bar:not([hidden])) — so the reserve only exists while the bar is actually shown. Result: the footer is flush with the bottom when the cart is empty, and sits just above the bar when it is shown.
- Files: css/main.css only (body flex column + min-height, main flex:1, the :has reserve). No HTML or JS change.
- Verified headless Chrome: at a tall viewport (so pages are short) footer bottom == viewport height; adding an item sets body padding-bottom to 84px and lifts the footer to sit above the bar; removing it returns to flush; header stays sticky (top:0 after scroll) on every page; smoke (index/tentang/info) + the 18-check UX suite pass with no console errors.

### More breathing room (spacing pass)
- Feedback: the content felt "too cramped". Opened up the layout tokens so every screen gets more whitespace, without hardcoding sizes (still fluid/clamp so it stays dynamic to the viewport).
- css/main.css only: --gutter clamp(16px,5vw,48px) -> clamp(20px,5vw,56px); --section-y clamp(40px,8vw,80px) -> clamp(64px,9vw,104px); .grid gap space-4 -> space-5 (mobile) and space-6 -> space-8 (>=640px); .card-body gap space-2 -> space-3 and padding space-4 -> space-5; .steps gap space-4 -> space-5. Added section > h1/h2 { margin-bottom: space-5 } for heading air, and section > p { max-width: 68ch } so paragraph lines stay readable on wide screens.
- Verified headless Chrome at 360/390/768/1366px: section padding now 64px mobile / 104px desktop, gutters 20-56px, no horizontal overflow at 360 or 390, smoke + the 18-check UX suite pass with no console errors. Screenshots refreshed in Downloads/mobile-*.png.

### Admin dashboard fills the screen (was a narrow "phone" column)
- Bug: `body { display:flex; flex-direction:column }` + `section { margin:auto }` — an auto cross-axis margin on a flex item suppresses `stretch`, so every section shrank to its content instead of filling the width. Storefront sections have wide content so they reached the 1100px cap; the admin's forms are narrow, so #app collapsed to ~623px and #stats to a single column — looking like a phone screen.
- Fix (css/main.css): `section { width: 100% }` (one line, root cause, storefront + admin). Admin panels are nested `<section>`s that double-applied the section padding, so `#app > [role="tabpanel"] { max-width:none; padding:0 }`; `#app { max-width:none; padding-block: var(--space-8) }` makes the dashboard use the full window width; `#stats, #an-stats { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) }` spreads stat cards evenly; `#login form { max-width: 24rem }` keeps login tidy.
- Verified: admin @1440 #app=1440 wide with 4 stat columns; @768 → 2 columns. Storefront regression: smoke (no console errors), UX 18/18, no overflow at 360/390. Screenshots: Downloads/admin-dashboard.png, admin-analisis.png.

### Live (dynamic) dashboard
- Ringkasan and Analisis now update themselves: orders are re-fetched and re-rendered every 30s (paused while the tab is hidden), on tab refocus (`visibilitychange`), and on demand via a "Muat ulang" button. A "Diperbarui HH.MM.SS" status line (`#updated`, `role="status"`) shows the last refresh.
- One `refresh()` re-runs `renderStats`/`renderAnalisis`/`renderOrders` — no new dependency, no framework. The 30s poll refetches the whole orders table (a `ponytail:` comment notes the upgrade path to incremental/Realtime if it grows).
- Verified with a stubbed session + fake orders (headless CDP, `cdp-adminlive.mjs`): renders 4 + 4 stat cards, 2 day rows, 2 item rows; clicking "Muat ulang" re-fetches (`/orders` fetch count 1 → 2) and re-stamps the time; no console errors.

### Dynamic dashboard: charts + quick date presets
- Analisis now renders two pure-CSS charts (no chart library): daily omzet as vertical bars (`.chart-bars`/`.chart-col`/`.chart-bar`, oldest→newest, value labels shown when ≤14 days, `title` with order count) and top items as horizontal bars (`.chart-rows`/`.chart-row`/`.chart-track`/`.chart-fill`). Replaced the two `.table-wrap` tables.
- Added quick range presets (Hari ini / 7 hari / 30 hari / Bulan ini) as chips (`#an-presets`) wired to `setRange()`; the two date inputs stay for a custom range.
- Fixed a mobile overflow: the two date labels sat in a non-wrapping `.row`, pushing the page to 459px wide at 390/360. `.row { flex-wrap: wrap }` (root cause, one line) — the analisis row, the menu checkboxes, the menu buttons and the drawer's delivery radios all benefit.
- Removed the now-dead `.table-wrap` and `.bar` CSS.
- Verified (headless CDP, stubbed session + 8 days of fake orders): 8 day bars + 6 item rows; refresh re-fetches; presets set the right ranges (Hari ini → 1 bar / Rp 85.000; 7 hari → from 7 days ago); admin @390/360 no horizontal overflow; storefront smoke + UX 18/18 unchanged; no console errors. Screenshots: Downloads/admin-dashboard.png, admin-analisis.png, admin-analisis-mobile.png.

### Ringkasan is now a full overview dashboard
- Ringkasan was only 4 KPI cards; it now also shows an "Omzet 7 hari terakhir" bar chart and a "Pesanan terbaru" list (latest 5 rows: name · time · items, total, status badge), plus a "Lihat semua pesanan" button that switches to the Pesanan tab.
- No new data or dependency: `renderOverview()` reuses the orders already loaded and the extracted `dayChartHTML()` helper (now shared with Analisis). It re-renders with the live dashboard (on load and every refresh).
- The 7-day window = today plus the 6 days before (`new Date(Date.now() - 6*864e5)`); the recent list is `[...orders].sort(created_at desc).slice(0,5)`.
- Verified (headless CDP, stubbed session + 8 days of data): 7 chart bars, 5 recent rows with correct name/time/amount/status, refresh re-renders without refetching twice, "Lihat semua pesanan" hides Ringkasan + shows Pesanan and selects its tab; no console errors; no horizontal overflow at 390/360. Screenshots: Downloads/admin-dashboard.png (updated), admin-overview-mobile.png.

### Admin sidebar shell + widget grid (adapted from a "dashboard layouts" reference)
- Replaced the horizontal tab strip with a **sidebar shell**: `.admin-shell` is a grid (240px `.admin-nav` + fluid `.admin-body`); `#tabs` is now a **vertical** role=tablist inside the sticky nav. Each tab still owns a role=tabpanel, so the a11y model is unchanged. Arrow keys move the vertical tablist (Up/Down, Left/Right aliases).
- Added an `.admin-bar` across the top of the body: the page heading (`#view-title`, kept in sync by `showTab()`) plus the existing `#updated` status and `#refresh` button (moved out of Ringkasan so every tab shares them).
- Ringkasan is now a real widget grid: `#stats` KPI cards → `.ov-grid` (single column; 2 columns at ≥900px) holding the omzet chart and a new `#ov-status` **status-mix** panel (baru/diproses/selesai counts, reusing the `.chart-rows` markup) → a full-width `.widget` card with the latest-orders **table** (`#ov-orders`, columns Waktu/Pelanggan/Item/Total/Status, latest 8 rows) + `#ov-more`. New `.widget` card style (border/radius/shadow/padding).
- Responsive: at ≤860px the nav becomes a horizontal scroll strip (`flex-direction:row; overflow-x:auto`) — no drawer/hamburger JS. The latest-orders table scrolls inside its own `.ov-table-wrap { overflow-x:auto }`; this only works because every grid level down (shell → body → panel → widget) sets `min-width:0`, otherwise the table stretches the page.
- Files: admin.html (shell markup), css/main.css (shell + widget + table + breakpoints), js/admin.js (renderOverview table + status mix, showTab `view-title`, vertical arrow keys).
- Verified (headless CDP, stubbed session + 8 days of orders): `navTabs` 5, `aria-orientation="vertical"`, `#view-title` syncs to each tab; overview shows 7 chart bars, 3 status rows, 8 table rows; `#ov-more` switches to Pesanan; desktop shell = `240px 1064px` columns, ov-grid `621px 310px`, header 68px; admin @390/360 no horizontal overflow (the nav tabs scroll inside the strip); storefront smoke + UX 18/18 unchanged; no console errors. Screenshots: Downloads/admin-dashboard.png, admin-overview-mobile.png.

### Daily omzet is now a line chart + a menu (dish) filter
- Replaced the vertical bar chart with a hand-built **SVG line chart** (no library). `dayChartHTML(list, from, to, valueOf)` now fills **every day** in `[from,to]` (days with no orders read as zero, so the x-axis is continuous), draws an area polygon + a `polyline` (`vector-effect:non-scaling-stroke` so the stroke stays 2px despite the non-uniform `viewBox`), one transparent `<rect><title>` per day for hover tooltips (date · omzet · order count), and HTML `.line-labels` thinned to <=7 via `pickLabels()` (first/last edge-aligned with `:first-child`/`:last-child`). The same helper draws both `#an-days` (Analisis) and `#ov-days` (Ringkasan).
- Added a **dish filter** to Analisis: a `#an-item` `<select>` ("Semua menu" + every dish seen in the loaded orders, rebuilt by `fillItemFilter()` only when the option set changes so an open dropdown isn't disturbed by the 30s refresh). Selecting a dish re-scopes the whole panel - KPIs, the line chart and the top-item list all derive from `valueOf(o)` = that dish's `price*qty` sum; "Semua menu" keeps `o.total`.
- Guarded an invalid range (`from > to` / empty) with a note instead of an empty chart. Removed the now-dead bar CSS (`.chart-bars`/`.chart-col`/`.chart-bar`/`.chart-val`/`.chart-lbl`) and the `shortRp()` helper (only the bars used it). Added `.line-chart`/`.line-svg`/`.line-grid`/`.line-area`/`.line-path`/`.line-labels` CSS and `.row select { width:auto }`.
- Verified (headless CDP, stubbed session + orders): default "Bulan ini" = 14 points / 7 labels; overview = 7 points; preset "Hari ini" = 1 point / Rp 85.000; preset "7 hari" = 7 points; picking dish "Arsik" drops omzet to Rp 85.000 and the item list to 1 row (Saksang excluded), then "Semua menu" restores it; no console errors. Screenshots refreshed (admin-analisis.png, admin-analisis-mobile.png, admin-dashboard.png, admin-overview-mobile.png); admin @390/360 no horizontal overflow (chart fits: 295px/265px); storefront smoke + UX 18/18 unchanged.

### Admin layout tidy-up
- The "Diperbarui ..." status line (`#updated`) no longer uses the yellow `.note` notice box; it is now muted small text (and hidden while empty) so it reads as a status, not a warning.
- `.admin-bar` gained a bottom divider; its `.row` is vertically centred.
- Dashboard density: `#stats`/`#an-stats` use a tighter 16px gap; `#orders`/`#menu-list`/`#plan-rows` stay at 20px. This overrides the storefront's wide 32px `.grid` gap (which was leaking into admin via the `@media (min-width: 640px) .grid` rule) using id-specificity selectors.
- KPI value `<strong>` in stat cards is now `--fs-h3` (≈20px) with a tighter inner gap, giving clearer number-over-label hierarchy.
- Analisis charts now live in `.widget` cards ("Omzet harian", "Penjualan per item") exactly like the Ringkasan widgets, instead of bare `<h3>` + divs. Panel headings are normalised to `--fs-md` with `margin: 0` (the grid gap owns spacing); the chips row no longer adds a stray bottom margin.
- The Menu form (`#menu-form`) is capped at 40rem so its fields never stretch across the full-width panel; `#login` is capped at 24rem (a centred login column).
- Verified (headless CDP, stubbed session + orders): `#updated` background transparent, admin-bar border 1px, stat gap 16px, 2 Analisis widgets (285px/169px tall, 937px wide), menu form 640px vs list 937px, KPI value 20px, no console errors; no horizontal overflow at 1440/390/360. Admin e2e (linePts 14, presets, menu filter, ov-more nav) and storefront smoke + UX 18/18 unchanged. Screenshots refreshed.
- Follow-up: the Jatah harian (and Pesanan) panel header sat lower than the other tabs. Root cause: `section { margin: auto }` plus `body { display:flex; flex-direction:column }` — the auto vertical margin on `#app` centred the whole dashboard whenever its content was shorter than the viewport, so short tabs floated to mid-page while tall tabs stayed at the top. Fixed with `#app { margin: 0 }`. Verified: all five tabs now start at the same y (app top 78, bar top 110, panel top 191). `#app` is admin-only, so the storefront is unaffected.
- Follow-up: Menu tab now shows "Tambah menu" (form) and "Daftar menu" (list) side by side on wide screens. Wrapped each in a `.menu-col` div; `#panel-menu { grid-template-columns: 1fr 1fr }` only at `min-width: 1100px` (below that it stacks as before). Verified at 1440/1200/1100 side-by-side (459/339/291px columns), stacked at 1024/900/390/360, form fields + list cards intact, no overflow at any width. All IDs unchanged so `js/admin.js` needed no edits.

### Business identity filled in (site.json)
- Owner supplied the business name and location. Updated `data/site.json`: `business.name` = "Batakness Foodie", `business.city` = "Entrop, Jayapura Selatan, Papua" (shown under the brand in the footer), and `business.tagline` = "Rasa Batak yang asli, dibuat dengan andaliman sungguhan di Jayapura." (hero line on index.html). Set the delivery area line to "Pengiriman di Jayapura dan sekitarnya."
- Still placeholders (owner facts, not inventable): `business.whatsapp` (628000000000), `halal`, delivery fee/min order + payment method, and the second `story` paragraph (who cooks / whose recipe) and the storage/reheat + halal FAQ answers. `sampleData` stays `true` so the DATA CONTOH banner remains until those are real.
- Verified (headless CDP, real Supabase): all four pages show header "Batakness Foodie" + footer "Entrop, Jayapura Selatan, Papua"; index title "Batakness Foodie | Makanan Batak Asli" with the tagline rendered; tentang has 2 story paragraphs; info has 3 delivery items + 3 FAQ + the halal placeholder; banner visible on all.

### Order status flow (Baru → Diproses → Dikirim → Selesai)
- Admin (js/admin.js): `STATUSES` = baru/diproses/dikirim/selesai; `FILTERS` = semua/baru/diproses/dikirim (orders with status `selesai` stay out of the list). Order cards no longer show one chip per status; each card shows the current status as a `.badge` plus a single **next-step button** driven by `ACTION`/`NEXT` maps — Baru→"Proses order", Diproses→"Dikirim", Dikirim→"Selesai" — so the flow can't be skipped. Clicking patches the status and re-renders.
- On the Diproses→Dikirim step the buyer is notified: `notifyBuyer()` opens WhatsApp to `o.phone` with "pesananmu sedang dikirim". The `window.open` is called **before** the `await setOrderStatus` so the browser still counts it as a user gesture (otherwise the popup is blocked).
- js/whatsapp.js: `waBase()` now normalizes Indonesian numbers (leading `0…` or `8…` → `62…`), so sending to a buyer whose phone was typed as `0812…` reaches `wa.me/62812…`. (`business.whatsapp` is already `62…` and is unaffected.)
- No SQL change: `orders.status` is free text with no check-constraint, and the existing `owner update` RLS policy already permits it, so the new `dikirim` value just works.
- Verified (headless CDP, stubbed session + 4 orders baru/diproses/dikirim/selesai): filters = Semua/Baru/Diproses/Dikirim; selesai hidden (3 cards visible); badges + button labels correct per status; "Proses order" → PATCH `diproses`; "Dikirim" → PATCH `dikirim` + WhatsApp opened to `wa.me/62813` with the delivered text; "Selesai" → PATCH `selesai` + card leaves the list; status-mix widget shows 4 rows; no console errors. Storefront smoke unchanged.
- **Send dialog**: the "Proses order" and "Dikirim" buttons now open a preview pop-up (native `<dialog id="send-dialog">` in admin.html — no custom modal code) showing the message that will be sent, in an editable `<textarea>`. `messageFor(o, step)` builds the default: for `diproses` a receipt-style confirmation (items ×qty, total, address, delivery date), for `dikirim` the "sedang dikirim" notice. "Kirim WhatsApp" sends the **edited** text (window.open runs inside the click gesture, before the `advance()` await) then advances the status; "Batal" (or Esc) closes with no change. "Selesai" is still a direct action (no message). CSS: `dialog` + `::backdrop` styling added; `#send-err` added to the error selector.
- Verified (headless CDP, updated cdp-orderflow probe): "Proses order" opens the dialog with the receipt text; Batal closes it with 0 patches and Budi stays `baru`; reopening + editing the textarea then sending patches `diproses` and opens `wa.me/6281234567890?text=…pesananmu%20diproses.` (the edited text, not the default); "Dikirim" dialog shows the delivered notice → patch `dikirim` + `wa.me/62813…`; "Selesai" takes no dialog and the card leaves the list; no console errors. Admin-live probe and storefront smoke unchanged.
- **Finished orders + Excel export**: `FILTERS` gained `selesai`, and the Pesanan tab now has a **Selesai** chip that shows only finished orders (the other filters, and "Semua", still hide them). A small "Unduh Excel" button — visible only in the Selesai view when there is at least one finished order — downloads **all** finished orders as a CSV Excel opens (`exportFinished()`): columns Tanggal/Pelanggan/Telepon/Metode/Alamat/Tanggal kirim/Item/Total/Catatan, sorted newest first, `;`-separated with a UTF-8 BOM so Excel (id-ID) reads the columns and accented characters correctly, filename `pesanan-selesai-YYYY-MM-DD.csv`. No library (Blob + `URL.createObjectURL` + `<a download>`); `ponytail:` a true `.xlsx` would need SheetJS — CSV opens in Excel fine.
- Verified (headless CDP): 5 filter chips (Semua/Baru/Diproses/Dikirim/Selesai); Selesai view shows the 2 finished orders + reveals the button; export produced `pesanan-selesai-2026-10-14.csv` with a UTF-8 BOM (bytes EF BB BF), header + 2 data rows, `Total` unquoted (numeric); switching back to Semua hides the finished cards and the button; no console errors. Admin-live probe and storefront smoke unchanged.
### Kasir (walk-in) staff page + receipt image *(superseded — kasir.html was folded into admin.html, see "Role-gated single dashboard" below)*
- New page `kasir.html` + `js/kasir.js`: a separate, minimal login for a cashier. It does only three things — build an in-store order, show its receipt, and move it through Baru→Diproses→Selesai. **No buyer info is entered** (an optional name field defaults to "Pelanggan"; phone/address stay empty).
- Data: `orders.channel` (new column via `sql/kasir.sql`, default `'online'`) marks walk-in orders. The kasir page writes `channel:'kasir'`, `method:'ambil'`, `phone:''`, and reads only its own channel via `listOrders('kasir')` (db.js `listOrders` gained an optional `channel` arg; the admin's `listOrders()` is unchanged and still reads everything). **The owner must run `sql/kasir.sql` once**, or inserts / channel-filtered reads fail.
- Receipt: `js/receipt.js` draws the struk onto a `<canvas>` (no library) and offers **download** (PNG via `toBlob`) and **print** (`window.open` + `toDataURL`). Business name/city come from `data/site.json`; prices via `rupiah()`. Written to be reused for the buyer receipt (Step B).
- Admin side: online orders keep the WhatsApp preview dialog; walk-in orders (no phone) advance directly — `renderOrders()` now guards the dialog with `&& o.phone`. Walk-in cards show a muted "Kasir" badge (`.badge.alt`), and the empty phone line is omitted.
- Access is **UI-limited only** (as agreed): RLS still grants every authenticated user full orders read/update, so the restriction is what the page shows, not what the DB permits. A real owner/staff split would need a role column + tighter RLS.
- Verified (headless CDP, stubbed session/menu/orders): kasir boots to the app, renders the menu picker, total updates (2×Arsik = Rp 170.000), "Buat pesanan" inserts `{channel:'kasir', method:'ambil', phone:'', items, total:170000}` and opens the receipt dialog with a real PNG (data:image/png;base64, len 31514); download yields `struk-*.png` (image/png, 23617 bytes); "Struk" reopens from the running list; "Proses" PATCHes `{status:'diproses'}` with **no** WhatsApp popup; print does not throw; no console errors. Admin regression: walk-in card shows the "Kasir" badge and advances directly (no dialog), online orders still open the dialog, and the earlier order-flow / send-dialog / export probes stay green.
- Next: Step B — reuse `js/receipt.js` to generate the **buyer** receipt image and send it on WhatsApp (Web Share API with a download+wa.me fallback), wired into the "Proses order" step. (Owner still: run `sql/kasir.sql`; create the cashier's Supabase auth user.)

### Role-gated single dashboard (kasir folded into admin.html)
- Consolidated the separate cashier page into `admin.html`: one login (the header "Login" link), one dashboard whose tabs are gated by the signed-in user's role. **Removed `kasir.html` + `js/kasir.js`** and the `.kasir-cols` CSS; robots.txt now disallows only /admin.html.
- Roles come from Supabase **user metadata** (`user_metadata.role`): `kasir` → Pesanan only, `admin` → Menu + Jatah, `owner` → all 5 tabs. Missing/unknown → owner (ponytail: only the owner creates staff users). js/db.js `saveSession` now stores `email` + `role` (via `roleOf`, which reads `user_metadata.role`) and exports `currentRole()`; the token-refresh path re-runs roleOf so the role survives refresh.
- js/admin.js: `ROLE_TABS`/`ROLE_LABEL` maps + `applyRole()` hides disallowed tabs, sets `#brand`, and shows the first visible tab; `load()`/`refresh()` are gated by `allow()`/`usesOrders()` so a kasir login makes exactly one orders fetch and an admin login makes none. Keyboard arrow-nav walks only the visible tabs (per-tab closure using the visible-list index).
- The walk-in (in-store) builder moved into a `.widget` inside #panel-pesanan (dish qty inputs, optional name, live total, "Buat pesanan" → insertOrder channel 'kasir' → receipt dialog). Walk-in cards keep the "Kasir" badge + a "Struk" button (bound in renderOrders → showReceipt).
- Verified (headless CDP, port 9369, stubbed session/menu/orders): kasir → brand "Kasir", only Pesanan visible, picker + 2 orders + struk button, 1 orders fetch; admin → brand "Admin", Menu+Jatah, 0 orders fetches; owner → all 5 tabs, brand "Owner"; walk-in create (2×Arsik) inserts `{channel:'kasir',method:'ambil',phone:'',total:170000}`, opens the receipt dialog with a real PNG, resets the builder; signIn stores role 'kasir' + email + tab set ['pesanan']. Regressions green: cdp-tabs, cdp-jatah, cdp-adminkasir, cdp-adminlive, cdp-orderflow. No console errors.
- Owner still must: run `sql/kasir.sql` once, and create staff auth users with User Metadata `{"role":"kasir"|"admin"|"owner"}`.

## Notes for future developers
- Set the WhatsApp number: business.whatsapp currently holds the placeholder "628000000000". Until a real number is set, orders open wa.me with no valid recipient.
- Every "[ISI: ...]" is a placeholder awaiting owner data (business name, WhatsApp, halal, delivery, story). Set site.sampleData to false once real data is in, to hide the "DATA CONTOH" banner.
- Menu prices are realistic samples (matching the PRD examples). Replace with the owner's real prices.
- Cards show a letter placeholder in the .ph block until the dish has images. Photos are per-dish URLs (menu_items.images text[]) entered in the admin; the card click opens a modal with the image carousel (js/dish-modal.js). No file upload yet — URLs only.
- Staff access is the dashboard embedded in `index.html` (hidden `#staff`, opened by the `#login` hash; header "Login" link → index.html#login). Tabs are gated by the user's `user_metadata.role` (kasir/admin/owner; unknown → owner). It needs `sql/kasir.sql` (the `orders.channel` column) for walk-in orders, plus a Supabase auth user per staff member with the role metadata set (Authentication → Users → User Metadata).
- sitemap.xml not created (needs a domain). Add it when the site has a URL.

### Merge staff dashboard into index.html (admin.html removed)
- Per the owner's choice, the staff dashboard is now part of index.html: the whole admin markup moved verbatim into a hidden `<div id="staff">` (the #send-dialog / #receipt-dialog sit just after it) plus a new `#close-staff` button. index.html loads both js/site.js (storefront) and js/admin.js (dashboard). Deleted admin.html.
- js/admin.js is dual-mode: standalone (no #staff → the previous behaviour) or embedded. show() reveals the overlay and sets `body[data-mode="staff"]`; bootStaff() runs on load only when the hash is #login (or a session exists); a `hashchange` to #login re-opens it; `#close-staff` hides it and clears the hash; sign-out closes it. The 30s + visibilitychange refresh is skipped unless the overlay is open, so the login screen never pops up over the storefront.
- css/main.css: added `#staff { position:fixed; inset:0; z-index:60; overflow-y:auto; background:var(--color-bg) }` (above the drawer's z-20) and `body[data-mode="staff"] { overflow:hidden }`.
- js/layout.js: the header "Login" link now points to `index.html#login` (was admin.html). robots.txt: `Allow /` only (no disallow).
- js/site.js: hardened the storefront against a non-array `remaining_today` response (`if (!Array.isArray(remaining)) remaining = []`) so a bad RPC can't crash the whole menu render.
- Verified (headless CDP; 11 harnesses retargeted from admin.html to index.html#login). cdp-roles needed its second navigation changed to a real Page.reload because a same-fragment navigate does not reload the page. cdp-roles ALL PASSED (kasir/admin/owner gating + walk-in insert + receipt PNG); cdp-jatah, cdp-admin, cdp-adminkasir, cdp-adminlive, cdp-adminshot, cdp-menucols, cdp-orderflow, cdp-tidy, cdp-menu, cdp-smoke all green with no console errors. Storefront (site.js) and dashboard (admin.js) coexist on index.html.
- NOTE: the pre-merge index.html storefront was accidentally overwritten with no recoverable backup (HEAD was only a stub); it was reconstructed (hero #tagline, #fav-grid "Menu Favorit", Cara Pesan steps, links). The owner should eyeball the copy. Open item (unchanged): some visible copy is still hardcoded in index.html.
- Some visible copy (hero headline, Cara Pesan steps, Catering blurb, banner text) is hardcoded in index.html, not site.json. Move it into site.json if the owner wants to edit copy without touching HTML.
