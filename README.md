# EventCraft AI 🎉

A GenAI-powered celebration & event planner. Describe a wedding, birthday or community event and get a **budget breakdown, a working-backward timeline, an interactive vendor checklist, and 5 personalized ideas** — with a refine-chat to iterate and text/PDF export to share.

Built with **Next.js 14 (App Router) + TypeScript (strict) + Tailwind CSS**, powered by **Groq (`llama-3.3-70b-versatile`)** and gracefully degrading to a deterministic demo plan when no API key is configured.

> **Runs with zero secrets.** Without `GROQ_API_KEY` the app never crashes: every request returns a deterministic sample plan computed from the user's inputs and a clear "Demo mode" banner.

---

## Problem-statement → feature mapping

| Problem statement requirement | Where it lives |
| --- | --- |
| Event form (type, name, date, guests, budget INR, city, theme, notes) | `components/EventForm.tsx` |
| One "Generate Plan" action → `POST /api/plan` | `components/Planner.tsx` → `app/api/plan/route.ts` |
| Budget: categories with amount, percentage, tip; sums to total | `lib/groq.ts` (LLM) + `lib/sanitize.ts` (`reconcileBudget`) → `components/BudgetChart.tsx` |
| Timeline: dated milestones working backward from event date | `lib/sanitize.ts` (`buildTimelineFromOffsets`) — the model returns `daysBefore` offsets, the server derives real dates |
| Vendor checklist by category, with what to ask/verify | `lib/prompt.ts` schema + `components/VendorChecklist.tsx` |
| 5 personalized ideas (theme / activities / food) | prompt contract + `lib/sanitize.ts` (`reconcileIdeas`) → `components/IdeasList.tsx` |
| Results in tabs (Budget / Timeline / Vendors / Ideas) | `components/PlanTabs.tsx` (ARIA tabs pattern) |
| Interactive checklist, localStorage, progress bar | `components/VendorChecklist.tsx` |
| Accessible CSS bar chart (no chart libs) | `components/BudgetChart.tsx` (+ hidden data table) |
| "Refine" chat with current plan as context | `components/RefineChat.tsx` (lazy-loaded) → `mode: 'refine'` requests |
| Copy as text / Print-Save-PDF | `lib/exportPlan.ts`, print stylesheet in `app/globals.css` |
| Demo mode fallback + banner | `lib/fallback.ts`, `components/DemoBanner.tsx` |

## Architecture

```
app/
  layout.tsx               # server component: landmarks, skip link, metadata
  page.tsx                 # server component → <Planner/>
  globals.css              # Tailwind, focus rings, reduced-motion, print styles
  api/plan/route.ts        # POST handler: rate limit → zod validate → createPlan
components/
  Planner.tsx              # client orchestrator: abortable fetch, status, tabs
  EventForm.tsx            # labelled form, client zod validation, role=alert errors
  PlanTabs.tsx             # ARIA tabs (arrow keys, Home/End)
  BudgetChart.tsx          # pure-CSS bars + sr-only table alternative
  TimelineList.tsx         # chronologically dated milestones
  VendorChecklist.tsx      # tick state in localStorage, progress bar
  IdeasList.tsx            # 5 personalized ideas
  RefineChat.tsx           # lazy-loaded (next/dynamic, ssr:false)
  DemoBanner.tsx           # demo-mode notice
  PlanLoader.tsx          # loading state
lib/
  schema.ts                # zod schemas: request, LLM JSON contract, limits
  prompt.ts                # compact, injection-hardened prompt builders
  groq.ts                  # server-only Groq client, single call + one retry
  sanitize.ts              # budget rescale, date derivation, idea padding
  fallback.ts              # deterministic demo plan (no LLM needed)
  rateLimit.ts             # in-memory per-IP fixed-window limiter
  result.ts                # tiny typed Result
  utils.ts                 # date/currency/hash helpers
  exportPlan.ts            # plain-text export
types/plan.ts              # domain types
tests/                     # Vitest unit + React Testing Library
```

Request flow: `Planner` POSTs the validated form → `route.ts` rate-limits per IP, zod-validates (400 with a safe message on failure) → `lib/groq.createPlan()` makes **one** Groq call (JSON mode, temperature 0.7, `max_tokens` 3000, request timeout) → response is **zod-parsed + sanitized** (budget rescaled to sum exactly, timeline dates computed server-side, ideas padded to 5) → any Groq/parse failure after one retry falls back to the deterministic plan with `demoMode: true`.

## Setup

```bash
npm install
cp .env.example .env.local   # add your Groq key (optional)
npm run dev                  # http://localhost:3000
```

Production:

```bash
npm run build
npm run start
```

## Environment variables

| Variable | Required | Meaning |
| --- | --- | --- |
| `GROQ_API_KEY` | No | Server-side only; without it the app runs in deterministic demo mode. Get one at [console.groq.com/keys](https://console.groq.com/keys). |
| `GROQ_TIMEOUT_MS` | No | LLM request timeout in ms (default 30000). |

The key is read **only** in `lib/groq.ts` on the server. It never appears in client bundles, HTML, or API responses.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run lint` | ESLint (`next/core-web-vitals` + Prettier) |
| `npm run typecheck` | `tsc --noEmit` (strict, `noUncheckedIndexedAccess`) |
| `npm test` | Vitest — 76 tests, **no network or API key needed** |

## Testing

- **Unit (Vitest):** zod request/LLM-contract schemas, budget-sum reconciliation (`reconcileBudget`, `repairSum`), deterministic fallback plan, prompt builder (injection guards, delimiting), rate limiter (fake timers), API route success / invalid-JSON-with-retry / Groq-failure / missing-key / 400s / 429 / no-stack-leak (Groq mocked).
- **RTL:** form validation (labels, `aria-describedby` + `role="alert"`), tab navigation (click, arrow keys, Home/End), vendor checklist toggling + localStorage persistence, demo banner.

## Security notes

- `GROQ_API_KEY` server-side only; `.env*` gitignored (`.env.example` committed); no secrets in repo.
- Every request body is size-capped (64 KB) and zod-validated (enums, ranges, length limits); malformed input ⇒ 400 with a safe message; unexpected errors ⇒ opaque 500 (no stack traces).
- Rate limiting: in-memory per-IP fixed window (10 req/min, `Retry-After` on 429), hard-capped key store. Single-instance only — use Redis/Upstash for multi-replica deployments.
- Prompt-injection defense: user text is wrapped in `<event_data>…</event_data>` (and `<refinement>…</refinement>` in refine mode); the system prompt treats those blocks as inert data and forbids prompt/rule changes from inside them.
- Model output validated with a zod schema; one retry on parse failure, then deterministic demo fallback. Budget amounts are server-rescaled to sum exactly to the user's total; timeline dates are derived server-side from offsets.
- Headers (`next.config.mjs`): CSP (`default-src 'self'`, no remote origins), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
- Dependencies pinned to exact versions; `npm audit` has **4 remaining findings that require breaking upgrades** (mainly Next.js ≥16) that this project intentionally does not take to honor the Next 14 requirement; the bundled `postcss` is overridden to the patched 8.5.31 and `glob` to ^11.
- `next lint`/CSP note: `'unsafe-inline'` for `script-src`/`style-src` is required by Next's inline bootstrap and Tailwind runtime CSS.

## UI & Design System

### Design Tokens

- **Color palette:** Dark theme default `#0F1115` background, warm coral accent `#FF6B35`, rose `#FF8B6C`, amber `#FFB84D`, teal `#4ADE80`, muted `#A0A4A8`, light-mode support via `prefers-color-scheme` with localStorage persistence
- **Typography:** Plus Jakarta Sans (system font fallback); fluid type scale using `clamp()`; headline tracking `-0.02em`
- **Spacing scale:** 8-based rhythm (1px = 0.25rem, 4px = 1rem, 8px = 2rem, 16px = 4rem, 24px = 6rem, 32px = 8rem)
- **Radii:** Pill `100px`, card `12px`, focus ring `2px`
- **Motion:** `prefers-reduced-motion` honored; all animations use `transform`/`opacity` only

### Reusable Components

| Component | Variants | Notes |
| --- | --- | --- |
| **Button** | primary, ghost, pill | `border-radius: 100px` for pill; focus-visible rings; contrast-compliant in both themes |
| **Badge/Label** | rose, amber, teal, primary | Uppercase, letter-spaced; bg with 15% opacity in dark mode |
| **Card** | — | `bg-[var(--bg-elevated)]`, `border: 1px solid var(--border)`, `border-radius: 12px` |
| **Tile** | — | Hover lift `translate-y-2`; border on focus-visible |
| **Section** | — | `padding: 3rem 1rem`; max-width `1240px` container; section header with horizontal line |
| **Tabs** | ARIA pattern | Roving focus with arrow keys, Home/End keys; panels focusable |
| **Input** | — | Floating-label appearance; focus ring `var(--primary)` |
| **Select** | — | SVG dropdown icon; appearance: none |
| **ThemeToggle** | dark/light | `prefers-color-scheme` + localStorage persistence; no flash on load |
| **Progress bar** | — | CSS-stroked circle; `aria-valuenow/min/max` attributes |
| **Stat** | — | Oversized number display with theme-appropriate color |

### Accessibility

- WCAG AA contrast checked for all text/background pairs in both light and dark themes
- Semantic landmarks, one `h1` per page, logical heading order
- Skip-to-content link, visible focus rings (`2px solid var(--primary)`)
- Full keyboard support: Tab navigation, Arrow/Home/End keys for tabs
- `prefers-reduced-motion` honored; transitions disabled in reduced-motion mode
- All non-text content has alt/aria-labels
- Aria-expanded on accordion details, role="radiogroup" on event type buttons
- Color is supplementary; information not conveyed by color alone

### Performance

- No CDN scripts (Tailwind via PostCSS, `lucide-react` or inline SVG icons, `next/font`)
- No hotlinked or large images; repo stays under 10 MB using SVG, CSS gradients, and emoji only
- Server components for static sections; client components only for theme toggle, mobile menu, FAQ, tabs, form;
- Dynamic-import heavy panels (refine chat via `next/dynamic`)
- SVG, CSS gradients, and emoji only — no raster images
- `prefers-reduced-motion` media query honored everywhere

### Files defining the design system

- `tailwind.config.ts` — Tailwind theme tokens extending CSS variables
- `app/globals.css` — CSS custom properties (design tokens), base styles, component utilities, print stylesheet
- `components/ThemeToggle.tsx` — Theme toggle with color-scheme detection and persistence
- `components/ui/` — Reusable primitive components (button, badge, card, tile, etc.)

## Accessibility notes (WCAG 2.1 AA)

- Semantic landmarks (`header`/`main`/`footer`), skip-to-content link, single `h1`-ordered headings.
- Every control has a visible `<label>`; errors use `aria-describedby` and `role="alert"`; status updates announced via `aria-live="polite"`.
- Tabs implement the ARIA tabs pattern with roving focus and Arrow/Home/End keys; panels are focusable.
- Checklist uses real checkboxes; progress bar exposes `aria-valuenow/min/max`.
- Budget chart has an `aria-label` summary plus a visually hidden data table.
- Visible 3px focus rings, ≥4.5:1 text contrast, `prefers-reduced-motion` honored (transitions disabled), responsive down to 320px (single-column grid).

## Limitations

- Rate limiting is in-memory — resets on deploy, not shared across replicas.
- The demo plan is intentionally generic; per-city vendor names/prices are illustrative.
- Vendor checklist state is per-browser (localStorage), not synced to an account.
- `npm audit` flags fixed only in Next 16 / Tailwind 4 (breaking upgrades beyond this stack).

## 60-second demo video script

1. **0:00–0:05** — Landing page: "EventCraft AI — plan celebrations with AI." Skip-link flash for a11y.
2. **0:05–0:15** — Fill the form: Wedding, *Sharma–Iyer Wedding*, date, 150 guests, ₹7,50,000, Pune, theme "marigold x retro".
3. **0:15–0:22** — Hit **✨ Generate Plan**; loading skeleton appears; explain one compact Groq call, zod-validated output.
4. **0:22–0:32** — Walk the four tabs: Budget (bars + tips, "sums exactly to ₹7,50,000"), Timeline (dated milestones working backward), Vendors (tick two items — progress bar climbs, note localStorage persistence), Ideas (5 personalized ideas).
5. **0:32–0:42** — Refine chat: type *"shift 5% from Decor to Catering and add a sangeet night"* → plan updates in place.
6. **0:42–0:50** — **📋 Copy as text** in clipboard → paste into a doc; **🖨️ Print / Save PDF** showing the print stylesheet (forms/chat hidden, all panels printed).
7. **0:50–0:60** — DevTools: delete `.env.local`, restart — **Demo mode** banner appears, the app still produces a full sample plan. Close on "never crashes without a key — budgets, timelines, vendor checklists, ideas covered."

## CI

`.github/workflows/ci.yml` runs `npm ci`, lint, typecheck and tests on every push/PR (Node 20 and 22).
