# Implementation Plan

Rules: small steps, each with a test the user runs. No step starts until the previous test is validated. Focus on Phase 1 base site first. Instructions only, no code here.

## Step 1: Project scaffold
Create folders: css/, js/, data/, images/. Create empty index.html, css/main.css, js/main.js, data/menu.json, data/site.json. Add a .gitignore.
**Test:** Run a local static server. Opening the site shows a blank page with no console errors. Git repo has an initial commit.

## Step 2: Design tokens and base layout
In css/main.css define variables for colors, fonts, spacing and radius from the PRD. Add a mobile-first base: reset, typography, container, buttons. Add a simple header with the business name and a "Pesan" button.
**Test:** At 360px width the header fits with no horizontal scroll. Colors and fonts match the PRD. Contrast is readable.

## Step 3: Site and menu data
Fill data/site.json (business name, tagline, whatsapp, city, halal text, preorder cutoff, delivery info, FAQ items) and data/menu.json (categories, items with id, name, category, description, price, unit, type, available, image, bestSeller). Use placeholders where the owner has not provided values and mark them clearly.
**Test:** Both files are valid JSON. Every menu item has all required fields. Opening each file in the browser or a JSON validator shows no errors.

## Step 4: Load and render the menu
Create js/menu.js to fetch menu.json and render item cards (photo, name, description, price, unit, add button). Show a "Habis" state for items with available false.
**Test:** All items in menu.json appear on the page. Editing a price in menu.json and refreshing changes the displayed price. A sold-out item shows "Habis" and its button is disabled.

## Step 5: Category filter and best sellers
Add category tabs or chips that filter the menu. Add a "Menu Favorit" section from items marked bestSeller.
**Test:** Clicking each category shows only its items. "Semua" shows everything. Best sellers appear in the favorites section.

## Step 6: Cart logic
Create js/cart.js with add, remove, change quantity, clear, subtotal and item count. Keep it independent of the page layout. Handle storage failure safely.
**Test:** In the browser console or a small test page: adding the same item twice gives quantity 2, removing to 0 deletes it, subtotal equals the sum of price times quantity.

## Step 7: Cart UI
Add a cart drawer or panel and a sticky bottom bar on mobile showing item count and subtotal. Allow quantity changes and removal in the cart.
**Test:** Adding items updates the count and subtotal live. The cart opens and closes. On 360px the sticky bar does not cover important content.

## Step 8: Checkout form
Add fields: name, phone, delivery or pickup, address (required for delivery), delivery date, notes. Validate required fields with clear Indonesian error messages.
**Test:** Submitting empty shows errors. Choosing pickup hides the address requirement. Valid input passes validation.

## Step 9: Pre-order dates and cutoff
Create js/dates.js. From site.json compute the allowed delivery dates and whether pre-order is open based on the cutoff. When closed, disable checkout and show a "Pre-order ditutup" message with the next opening info.
**Test:** Changing the cutoff or open flag in site.json changes which dates appear and whether ordering is enabled. Past dates are never selectable.

## Step 10: WhatsApp order message
Create js/whatsapp.js to build the order message (items, quantities, line totals, subtotal, customer details, notes) and open the wa.me link with the encoded text. Add a note that the order is confirmed after the owner replies.
**Test:** Clicking "Kirim via WhatsApp" opens WhatsApp with the right number and a readable message. Totals match the cart. Special characters and line breaks survive.

## Step 11: Content sections
Add Hero, Cerita Kami (story and andaliman explainer), Cara Pesan (3 steps), Pengiriman & FAQ (rendered from site.json), Kontak and footer. Show the halal status clearly.
**Test:** Every section appears in order, text comes from the data files, and nothing contains invented claims or leftover placeholder text that should have been filled.

## Step 12: Catering inquiry
Add a section with event package info and a button that opens WhatsApp with a prefilled inquiry message (event type, date, number of guests fields optional).
**Test:** The button opens WhatsApp with the inquiry text. Optional fields appear in the message only when filled.

## Step 13: SEO and sharing
Add title, meta description, Open Graph and Twitter tags, favicon, and JSON-LD LocalBusiness with real data only. Add a sitemap and robots file.
**Test:** Pasting the URL into a link preview tester shows the correct title, description and image. JSON-LD validates with no errors.

## Step 14: Performance and images
Compress and resize all images, use lazy loading and width/height attributes, minimize CSS and JS if needed.
**Test:** A mobile performance audit (Lighthouse) scores good on performance. Page is usable on a slow connection.

## Step 15: Accessibility and device QA
Check keyboard navigation, focus states, labels, alt text and contrast. Test on a small Android phone, an iPhone size and desktop.
**Test:** Accessibility audit has no critical issues. Full order flow works on both phone sizes and desktop.

## Step 16: Deploy
Push to GitHub, connect to the chosen static host, enable HTTPS, connect the domain if available.
**Test:** The live URL loads over HTTPS. The full order flow works on a real phone with the real WhatsApp number.

## Step 17: Launch checklist
Replace all placeholders with real data. Set up Google Business Profile, WhatsApp Business catalog and Instagram bio link. Do a test order with a friend.
**Test:** No "[ISI]" placeholder remains on the live site. A real test order reaches the owner on WhatsApp.

## After launch: feature files
For each new feature (English toggle, gallery, testimonials, online payment) create a separate `feature-name-implementation.md` with short steps and tests, then implement one at a time.
