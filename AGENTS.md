# Project rules: Batak Food Website

IMPORTANT (ALWAYS):
- Always read memory-bank/architecture.md before writing any code.
- Always read memory-bank/product-requirements-document.md before writing any code.
- Always read memory-bank/progress.md to know what is already done.
- After finishing a step or a major feature, update memory-bank/progress.md and memory-bank/architecture.md.
- Never start the next implementation step until the user confirms the tests of the current step.

## Code rules
- Modular code: many small files. No monolith. No single giant index.html or script.
- Vanilla HTML, CSS, JavaScript (ES modules). No framework unless tech-stack.md says so.
- All menu content lives in data/menu.json and data/site.json. Never hardcode dishes, prices, phone numbers or dates in HTML or JS.
- Mobile-first. Test at 360px width first, then desktop.
- Indonesian is the main site language. Keep all visible text in one place so it can be edited easily.
- Prices formatted as Rp 85.000 using Intl.NumberFormat('id-ID').
- Accessible: real buttons, labels on inputs, alt text on images, good contrast.

## Content honesty rules
- Never invent reviews, certifications, awards, prices, or halal claims. Use clearly marked placeholders (e.g. "[ISI: harga]") until the owner provides real data.
- Halal status shown on the site must match what the owner states in the PRD.

## Safety
- No secrets or API keys in front-end code. Phase 1 has no backend and no keys.
- Wrap browser storage access in try/catch.

## Working style
- Small steps. One step at a time. Explain what changed in 3 to 5 lines.
- If something in the plan is unclear, ask before coding.
