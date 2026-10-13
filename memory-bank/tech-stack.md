# Tech Stack: simplest yet robust

## Phase 1
| Layer | Choice | Why |
|---|---|---|
| Markup | HTML5 | Fast, no build needed |
| Styling | CSS with variables (one main stylesheet plus small partials) | Easy theming for brand colors |
| Logic | Vanilla JavaScript, ES modules | No framework needed for a menu and cart |
| Data | data/menu.json and data/site.json | Owner edits content without touching code |
| Cart storage | In memory, with optional localStorage in try/catch | Works even when storage is blocked |
| Ordering | wa.me link with encoded message | No backend, no payment keys, trusted by customers |
| Hosting | Static host: Cloudflare Pages, Netlify or GitHub Pages | Free tier, HTTPS, custom domain |
| Images | Compressed WebP/JPG, lazy loading | Fast on mobile data |
| Analytics | Simple privacy-friendly analytics (e.g. Cloudflare Web Analytics) | See which dishes get attention |
| Version control | Git and GitHub | Required by the workflow (commit after each step) |

## Local development
A simple static server (for example `npx serve` or the VS Code Live Server extension). Needed because ES modules and fetch of JSON do not work from file://.

## Phase 2 (only if needed)
- Payment gateway (Midtrans or Xendit) with a small serverless backend. Payment secrets must stay on the server.
- Google Sheets or a small database for stock and orders.
- Consider migrating to Astro if the site grows to many pages.

## Why not a framework now
A single-page promo and menu site with a cart does not need one. Fewer tools means fewer things that break and an easier handover to the owner.
