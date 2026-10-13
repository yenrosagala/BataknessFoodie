# Architecture

Update after each major step. Explain what every file does.

## Planned structure
```
batak-web/
├── index.html           Page structure and sections
├── css/
│   └── main.css         Design tokens, layout, components
├── js/
│   ├── main.js          App entry: loads data, wires modules
│   ├── menu.js          Fetch and render menu, category filter
│   ├── cart.js          Cart state and calculations (no DOM code)
│   ├── cart-ui.js       Cart drawer and sticky bar
│   ├── checkout.js      Form fields and validation
│   ├── dates.js         Pre-order cutoff and delivery dates
│   ├── whatsapp.js      Build message and open wa.me link
│   └── format.js        Price and date formatting helpers
├── data/
│   ├── menu.json        Categories and items
│   └── site.json        Business info, preorder, delivery, FAQ, story
├── images/              Compressed food photos and logo
├── memory-bank/         Project documents for the AI
├── CLAUDE.md / AGENTS.md
└── README-START-HERE.md
```

## Data schema

menu.json
- categories: list of category names
- items: list of objects with
  id (unique slug), name, category, description, price (number, rupiah), unit (porsi, botol, bungkus), type (fresh, frozen, dry), available (true/false), image (path), bestSeller (true/false)

site.json
- business: name, tagline, whatsapp, city, instagram
- halal: statement shown on the site
- preorder: open (true/false), cutoff rule, delivery days
- delivery: areas, fees, minimum order, notes
- payment: accepted methods and instructions
- faq: list of question and answer pairs
- story: text blocks for Cerita Kami

## Current files (after Step 1)
- index.html: minimal valid HTML shell (charset + title), empty body. Content added in later steps.
- css/main.css: empty placeholder. Layout and tokens added in Step 2.
- js/main.js: empty placeholder. App entry added in later steps.
- data/menu.json: valid JSON with empty categories and items arrays.
- data/site.json: valid JSON placeholder (empty object).
- .gitignore: ignores OS cruft only (Thumbs.db, .DS_Store). No build or dependencies to ignore.
- images/: empty folder for food photos; not tracked by git until the first image lands.

## Design decisions
(add as they are made)
