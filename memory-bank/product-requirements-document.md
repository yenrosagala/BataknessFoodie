# Product Requirements Document: Batak Food Website

## 1. Purpose
A website that promotes authentic Batak food and lets customers place orders through WhatsApp. It must build trust (story, sourcing, clear halal and delivery info) and make ordering easy on a phone.

## 2. Open Decisions (owner must fill in; use placeholders until then)
| Item | Value |
|---|---|
| Business name | [ISI] |
| Tagline | Rasa Batak yang asli, dikirim ke rumahmu. (draft) |
| City / delivery area | [ISI] |
| WhatsApp number (628xxxxxxxxxx) | [ISI] |
| Instagram / TikTok handle | [ISI] |
| Halal status | [ISI: halal / non-halal / both, separated] |
| Product forms | [ISI: fresh / frozen / dry goods] |
| Sales model | [ISI: pre-order batches / daily stock / catering] |
| Pre-order cutoff and delivery day | [ISI] |
| Payment methods | [ISI: bank transfer, QRIS] |
| Delivery fees and minimum order | [ISI] |
| Business permits to display (PIRT, NIB, halal) | [ISI or none] |

## 3. Users
1. Batak diaspora missing home food (primary)
2. Families, churches and event organizers ordering for gatherings
3. Curious food explorers
4. Gift buyers (holidays, oleh-oleh)

Most visit on a phone, arriving from WhatsApp groups, Instagram or TikTok links.

## 4. Scope: Phase 1 (launch)
Must have:
- Home page with hero, best sellers, story, how to order, delivery info, FAQ, contact
- Full menu with categories, photos, prices, portion sizes, availability
- Cart (add, remove, quantity, subtotal)
- Checkout form: name, phone, delivery or pickup, address, delivery date, notes
- Order sent as a pre-filled WhatsApp message
- Pre-order cutoff logic and "closed" state
- Catering / event inquiry button (prefilled WhatsApp message)
- SEO basics, social share preview, mobile-first design

Nice to have:
- English toggle
- Photo gallery
- Customer testimonials (real ones only, with permission)

## 5. Out of scope for Phase 1
Online payment gateway, user accounts, order tracking, admin dashboard, backend database. (See Phase 2.)

## 6. Phase 2 (later, only when orders are steady)
Online payments (QRIS, e-wallet, virtual account), order tracking, admin page, stock sync via Google Sheets.

## 7. Pages and sections
Single page with anchored sections: Hero, Menu Favorit, Cerita Kami, Menu Lengkap, Cara Pesan, Pengiriman & FAQ, Catering, Kontak. Sticky bottom cart bar on mobile.

## 8. Content
- Language: Indonesian
- Tone: warm, proud, family-like
- Menu data lives in data/menu.json (see schema in architecture.md)
- Dish descriptions reference: use accurate descriptions of arsik, saksang, naniura, mie gomak, sambal andaliman, itak, kopi (do not claim regional origin or certification unless owner states it)

## 9. Brand
Colors: deep red, black, off-white, warm gold accent (Batak textile palette). Owner may override. Typography: one readable body font and one display font for headings.

## 10. Success criteria
- A first-time visitor can find a dish and send an order on WhatsApp in under 2 minutes on a phone
- Page loads fast on mobile data
- Owner can change a price or mark a dish sold out by editing one data file
- No invented claims on the site
