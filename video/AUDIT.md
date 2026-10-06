# Intake — Product & Design Audit (Phase A)

Source of truth: the repository at the root of this branch (README, `src/`, `supabase/`), plus the app
running locally (`next dev` with placeholder Supabase env, public read-only `/demo` routes, no account).

## 1. Product

**One-sentence purpose.** Intake grades each day of eating, drinking, and moving against targets *you*
set, and shows exactly how every point of the score was earned — deterministic, no generative AI.

**Who it's for.** Self-directed trackers (people who lift, run, or follow their own macro and hydration
plan) who already know their targets and want an honest read on alignment, not a prescription.

**Before → after.** Before: scattered logs and a vague feeling of "was today good?" After: one live,
explainable score (e.g. 95 · A · high confidence) that breaks down metric by metric, plus weekly and
monthly reviews that only surface patterns when the evidence holds.

**Core features, ranked by how impressive they look on screen**

| # | Feature | Where in code | Why it reads on screen |
|---|---------|---------------|------------------------|
| 1 | Transparent score breakdown ("Why this score?") — seven metrics, each with actual/target, score /100 and weight %, normalized to one result | `src/components/dashboard/score-details-dialog.tsx`, `src/lib/scoring/*` | One number decomposes into its parts — the product's thesis in one gesture |
| 2 | Live daily alignment: score ring + grade + confidence + generated summary in a liquid-glass hero card | `dashboard-view.tsx`, `liquid-glass.tsx`, `scoring/feedback.ts` | Big tabular number, ring fill, grade letter |
| 3 | Daily targets with overage isolation (emerald up to target, amber/rose for overage) | `progress-card.tsx`, `ui/progress-bar.tsx` | Seven bars filling, colour changes only where honest |
| 4 | Weekly / monthly review: period score, score-trend area chart, coverage tiles, pattern insights with evidence badges | `insights/period-view.tsx`, `insights/period-chart.tsx`, `lib/analytics/*` | Chart draws, insight cards stack |
| 5 | Fast logging: "What did you eat?" meal form, quick water +250/+500/+750, timeline with meal scores, one-tap "Log again" | `logging/meal-form.tsx`, `dashboard-view.tsx` (Quick actions), `timeline-actions.tsx` | Cursor + typing + instant result |

Supporting (real, lower visual payoff): effective-dated goals, custom/saved meals, optional USDA
FoodData Central search, activities, body measurements, light/dark themes, PWA install, opt-in demo data.

## 2. Design system

Tokens live in `src/app/globals.css` (`:root` light, `.dark` dark) as OKLCH, mapped to Tailwind v4
via `@theme inline`. Components are shadcn/ui (radix) in `src/components/ui/`. Hex below is converted
from OKLCH and **verified against rendered pixels** of the running app (sampled from screenshots).

### Colour — dark theme (film theme, see DECISIONS.md)

| Token | OKLCH | Hex | Pixel-verified |
|-------|-------|-----|----------------|
| background | 0.17 0.018 155 | `#09120c` | ✓ login left panel |
| foreground | 0.96 0.008 95 | `#f3f2ec` | |
| card | 0.21 0.018 155 | `#121b15` | ✓ login right panel |
| popover | 0.22 0.018 155 | `#141d17` | |
| primary | 0.72 0.12 153 | `#64ba80` | ✓ Sign in button, active nav |
| primary-foreground | 0.18 0.03 155 | `#06150c` | |
| secondary | 0.27 0.025 155 | `#1d2a21` | |
| muted | 0.25 0.018 155 | `#1b241e` | |
| muted-foreground | 0.70 0.02 145 | `#97a297` | |
| accent | 0.30 0.04 155 | `#1d3425` | |
| border | 1 0 0 / 10% | `#ffffff1a` | |
| input | 1 0 0 / 15% | `#ffffff26` | |
| destructive | 0.704 0.191 22.216 | `#ff6467` | |
| progress fill (emerald-400) | 76.5% 0.177 163.2 | `#00d492` | ✓ |
| overage (amber-400) | 82.8% 0.189 84.4 | `#ffb900` | ✓ |
| heavy overage (rose-500) | 64.5% 0.246 16.4 | `#ff2056` | |
| glow (sky-500/10) | 68.5% 0.169 237.3 | `#00a6f4` | |

### Colour — light theme (default)

background `#fbfaf5` · foreground `#0e1912` · card `#fffefc` (✓) · primary `#1a6f44` (✓) ·
primary-foreground `#fcfcf9` · secondary `#e3efe5` · muted `#f2f0ea` · muted-foreground `#3b4d41` ·
accent `#d5ecd9` · border `#dddbd2` · ring `#428c61` · progress fill emerald-500 `#00bc7d` (✓) ·
overage amber-400 `#ffb900` (✓) · chart-1 `#0d8750`.
Brand icon file colours (`src/app/icon.svg`): green `#386f56`, cream `#fffaf0`; manifest theme `#386f56`.

Unfinished tokens (avoid): `sidebar-*` are untouched shadcn neutrals; dark `chart-1…5` are greys (the
chart actually uses `var(--primary)`, so the visible chart is fine).

### Type
- **Geist** (sans, headings and UI) and **Geist Mono** (declared, effectively unused), via `next/font/google`. OFL licence.
- Weights in use: 400, 500 (`font-medium`), 600 (`font-semibold`).
- Scale (Tailwind v4): xs 12/16 · sm 14/20 · base 16/24 · lg 18 · xl 20 · 2xl 24/32 · 3xl 30/36 · 4xl 36/40 · 5xl 48 · 6xl 60.
- Headings `tracking-tight` (−0.025em). Eyebrows: `text-sm font-medium text-primary`; uppercase labels `text-xs tracking-[0.14em]` (metric cards) and `tracking-[0.22em]` (login).
- Numbers: `.number-tabular` (`font-variant-numeric: tabular-nums`).

### Spacing, radii, elevation
- Spacing base 4px (`--spacing: .25rem`). Page gutters `px-10 py-10` desktop; card padding 16px (`--card-spacing`), hero card `p-8`; section gap `space-y-6` (24px).
- `--radius: .8rem` (12.8px). sm 7.68 · md 10.24 · lg 12.8 · xl 17.92 (cards, nav pills) · 2xl 23.04 · 4xl 33.28 (badges). Liquid-glass panels 24px.
- Cards: `ring-1 ring-foreground/10`, no drop shadow. Liquid glass: inset highlights `inset ±2px ±2px 2px rgba(255,255,255,.35)`, glow `0 4px 4px rgba(0,0,0,.15), 0 0 12px rgba(0,0,0,.08), 0 0 24px rgba(255,255,255,.1)`, `backdrop-blur-lg`, border `white/10` (dark).
- Ambient glows: `bg-primary/16` and `bg-sky-500/8` circles, `blur-3xl` (64px), behind hero card and sidebar.
- Body: radial gradient `circle at 15% 0%, primary 7% → transparent 30rem`.

### Icons
lucide-react 1.34.0 at 16px (`size-4`) in nav and buttons, 20px in metric tiles; stroke 2 (1.5 in the login dial).
Logo glyph: `UtensilsCrossed`. Nav: History, CalendarDays, BarChart3, Settings2. Actions: Droplets, Utensils, Activity, Footprints, Lightbulb, Info, Plus.

### Existing motion
- Login dial (`globals.css`): arcs draw with `dial-draw 1.4s cubic-bezier(0.22,1,0.36,1)`, staggered 240ms + 140ms; weight segments fade in 0.6s staggered 70ms; centre plate fades in 0.8s after 0.7s.
- Link underline: `cubic-bezier(0.65,0.05,0.36,1)` 300ms. Progress bars: `transition-[width]`. Liquid glass (motion): hover scale 1.01.
- Respects `prefers-reduced-motion`.

### Logo & brand files
- `src/app/icon.svg` (512 app icon: fork + spoon on cream disc, green square), `src/app/apple-icon.png`, `public/icons/intake-192.png`, `public/icons/intake-512.png`, `src/app/favicon.ico`.
- In-app lockup: primary rounded square (`rounded-xl`, 36px) with `UtensilsCrossed` + "Intake" (`text-lg font-semibold tracking-tight`).
- **IntakeDial** (`src/components/intake-dial.tsx`) — the brand mark: outer ring of seven segments sized by the *real* scoring weights (calories 30, protein 20, fiber 8, carbs 6, fat 6, water 15, steps 15; 2.4-unit gaps) around three progress arcs (86/68/92, illustrative) and a plate with `UtensilsCrossed`.
- Brand line (login footer): "Track with intention". Eyebrow: "Personal tracking, clearly explained".

## 3. Running the app

`npm ci`, then `next dev` with `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` and a placeholder
publishable key (no `.env.local` written). The proxy finds no session, so `/login` and the public
read-only `/demo/*` routes render fully with the deterministic fictional 70-day dataset.
Authenticated-only screens (meal form, quick actions, finish day) could not be clicked through —
**rebuilt from code** (`meal-form.tsx`, `dashboard-view.tsx` non-demo branch) in the film.

Capture scripts: `video/scripts/capture-app.cjs`, `video/scripts/capture-extra.cjs`.

### Screenshots (`video/audit/screens/`, desktop 1440×900 @2x, mobile 390×844 @3x, light + dark; stored as q90 4:4:4 JPEG to keep the repo light)

| Screen | Files |
|--------|-------|
| Login (always dark) | `login-desktop-light.jpg`, `login-mobile-light.jpg` |
| Today (demo, finished day 98 · A) | `demo-today-{desktop,mobile}-{light,dark}.jpg` |
| Why this score? dialog | `demo-score-dialog-desktop-{light,dark}.jpg` |
| History (day review) | `demo-history-*.jpg`, `demo-history-lowday-desktop-*.jpg` |
| Weekly (current, insufficient) | `demo-weekly-*.jpg` |
| Weekly (Sep 28–Oct 4, graded 89 · B) | `demo-weekly-fullweek-desktop-{light,dark}.jpg` |
| Monthly (current / September) | `demo-monthly-*.jpg`, `demo-monthly-september-desktop-*.jpg` |
| Settings | `demo-settings-*.jpg` |
| Meal form, Quick actions | not reachable without auth → rebuilt from code (marked) |

## 4. Picks

**Three best-looking moments**
1. The liquid-glass hero card in dark mode: score ring, big tabular number, grade, green eyebrow, summary.
2. "Transparent score breakdown": seven clean rows, weights on the right, "Normalized result" footer.
3. The login brand panel: the segmented IntakeDial glowing on `#09120c`.

**The "aha".** Tapping **Why this score?** — one number (95) opens into the seven weighted metrics that
produced it. It's defensible because it *is* the differentiator in the README ("explainable meal
scores", "unavailable metrics removed before weighting… normalized to 100%") and the weight ring in the
brand mark is literally the same data (SCORE_WEIGHTS). No competitor's logo is its scoring formula.

**Avoid (unfinished / misleading on screen)**
- The Next.js dev indicator ("N" bubble) — dev artifact only.
- The demo banner and "Exit demo / sign up" button (demo-only chrome; film shows the signed-in app).
- Current-week/month "More tracking needed / Insufficient confidence" states (true, but read as broken in a 30s film).
- Default Next/Vercel SVGs in `public/`; shadcn sidebar tokens; dark chart greys.
- Liquid glass SVG displacement filter (heavy, invisible at film scale) — reproduce the look with layers.
- Anything implying password recovery, social login, barcode scanning, data export, offline mode.

## 5. Copy claims

**Safe (true in code / README)**
- "Graded against targets you set." / "Intake grades alignment with goals you choose—it does not prescribe them." (in-app copy)
- "Every point, explained." (transparent breakdown with weights and normalization)
- "No generative AI." / deterministic scoring (README)
- "Unknown nutrition stays unknown." / "Intake never invents values from a description." (in-app copy)
- "Patterns, only with evidence." (minimum sample + effect thresholds; "Deterministic observations with explicit evidence thresholds.")
- "Designed for a few seconds, not a few minutes." (Quick actions copy)
- "Track with intention." (brand line) · URL `intake.javiertpadilla.com` (production, README)
- Seven metrics and weights 30/20/8/6/6/15/15.

**Unsafe (never claim)**
- Health outcomes ("get healthier", "lose weight", "clinically", "medical"), calorie prescriptions, exercise calories subtracted.
- "AI-powered", "smart", "learns you", automatic food recognition, barcode scanning.
- Any usage statistic ("thousands of users", "average score 92") — all film data is fictional sample data computed by the real engine.
- Offline, export/import, integrations (Apple Health, wearables), social features.
