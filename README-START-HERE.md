# Batak Food Website: Project Starter Pack

Built from the "Ultimate Guide to Vibe Coding" method: plan first, small steps, each step tested, AI always reads the memory bank before coding.

## Folder layout

```
batak-web/
├── CLAUDE.md                 (rules for Claude Code)
├── AGENTS.md                 (same rules, for Codex)
├── README-START-HERE.md
└── memory-bank/
    ├── product-requirements-document.md
    ├── tech-stack.md
    ├── implementation-plan.md
    ├── progress.md           (AI fills as it goes)
    └── architecture.md       (AI fills as it goes)
```

## Setup (once)

1. Install VS Code. Create a folder `batak-web` and copy this pack into it.
2. Open the folder in VS Code, open a terminal.
3. Install a coding AI: `npm i -g @anthropic-ai/claude-code` (or Codex: `npm i -g @openai/codex`).
4. Run `git init`.
5. Fill in section "Open Decisions" in `memory-bank/product-requirements-document.md` (halal status, products, WhatsApp number). Placeholders are fine to start.

## Prompt 1: make sure everything is clear

> Read all the documents in /memory-bank. Is implementation-plan.md clear? What are your questions to make it 100% clear for you? Do not write code yet.

Answer the questions, then say: "Update implementation-plan.md accordingly."

## Prompt 2: Step 1

Start in Plan Mode (`shift+tab` in Claude Code).

> Read all the documents in /memory-bank, and proceed with Step 1 of the implementation plan. I will run the tests. Do not start Step 2 until I validate the tests. Once I validate them, open progress.md and document what you did for future developers. Then add any architectural insights to architecture.md to explain what each file does.

## Every next step

1. `git commit` the finished step.
2. Start a fresh chat (`/clear`).
3. Prompt:

> Now go through all files in the memory-bank, read progress.md to understand prior work, and proceed with Step N. Do not start Step N+1 until I validate the test.

## If stuck

Use `/rewind` (Claude Code) or `git reset` to the last commit, then retry with a sharper prompt. For browser errors, press F12, copy the console error, and paste it to the AI.
