# Intake

Intake is a personal nutrition, hydration, activity, body-measurement, and behavior tracker built around a simple loop: log, understand, grade, review, detect patterns, improve.

It measures alignment with targets the user configures. It is not a medical product, does not prescribe calorie targets, does not subtract exercise calories, and does not use generative AI. Unknown nutrition remains unknown instead of being silently treated as zero.

## Product capabilities

- Email/password authentication with protected application routes and server-side session refresh.
- Effective-dated calorie, macro, hydration, step, workout, and late-meal targets.
- Fast meal entry, custom foods, saved meals, recent meals, favorites, and one-tap “Log again.”
- Optional USDA FoodData Central search with editable nutrition estimates and stored snapshots.
- Water quick-add, other drinks, manual activities, and optional metric/imperial body measurements.
- Live daily alignment, explainable meal scores, explicit Finish Day reviews, and automatic completed-day recalculation after edits.
- Day history plus weekly and monthly reviews, prior-period comparisons, selective charts, tracking coverage, and evidence-backed patterns.
- Light and dark themes with responsive navigation and mobile-first logging controls.
- Opt-in deterministic 35-day demo data for testing analytics on a new empty account.
- Public, read-only portfolio demo with a rolling 70-day fictional history and no account requirement.

## Architecture

The application uses Next.js App Router and React Server Components for authenticated reads. Interactive forms are small Client Components that submit to Server Actions. Supabase is the only backend: Auth owns sessions, PostgreSQL stores application data, and Row Level Security enforces ownership. There is no service-role key in the app and no separate API server.

```text
Browser
  ├─ Supabase SSR cookies → Next proxy → protected App Router pages
  ├─ Client forms → Server Actions → Zod → Supabase Data API
  └─ Optional food search → authenticated Next route → USDA FDC

Pure domain modules
  ├─ scoring: curves, normalized weighting, confidence, grades, feedback
  ├─ analytics: aggregation, statistics, evidence thresholds, ranking
  └─ dates: IANA timezone conversion and local period boundaries
```

Important directories:

```text
src/app/                    Routes, layouts, Server Actions, nutrition route
src/components/             Product UI and shadcn primitives
src/lib/scoring/            Pure deterministic scoring engine
src/lib/analytics/          Pure deterministic insight engine
src/lib/data/               Scoped Supabase reads and domain mapping
src/lib/dates/              Timezone-safe local date handling
src/lib/nutrition/          Nutrition-provider abstraction and USDA adapter
src/lib/reviews/            Daily review calculation and persistence
src/lib/demo/               Deterministic opt-in demo dataset builder
src/lib/supabase/           Browser, server, and proxy clients
src/lib/validation/         Zod schemas for application boundaries
supabase/migrations/        Version-controlled remote database history
tests/unit/                 Scoring, analytics, false-positive, timezone tests
tests/e2e/                  Real browser flows against Supabase
```

## Stack

- Next.js 16.3.3, React 19.2.8, TypeScript 5.9.3
- Tailwind CSS 4.3.3 and shadcn/ui
- Supabase JS 2.112.4 and `@supabase/ssr` 0.12.5
- Zod 4.4.3, React Hook Form 7.86.0, Recharts 3.10.1
- Vitest 4.1.11 and Playwright 1.62.1
- Node.js 22 or newer and npm

All direct dependency versions are pinned and `package-lock.json` is committed.

## Supabase data model

The schema is managed by the files in `supabase/migrations` and is already applied to the connected Intake project.

- `profiles`: timezone, units, and optional profile values.
- `user_goals`: non-overlapping effective-dated target records.
- `body_measurements`: optional weight, body-fat, and waist history.
- `meal_logs` and `meal_items`: stable meal/nutrition snapshots and optional composition.
- `custom_foods` and `saved_meals`: reusable user-owned nutrition records.
- `hydration_logs` and `activity_logs`: timestamped drink and movement entries.
- `day_status`: explicit, unique per-user local-day completion state.
- `daily_reviews`: immutable-at-completion inputs plus recalculated deterministic results.
- `period_reviews`: available for persisted weekly/monthly summaries; current pages calculate from bounded source data.

Every public user-data table has RLS enabled. Policies scope SELECT, INSERT, UPDATE, and DELETE with `auth.uid()` ownership checks, including both `USING` and `WITH CHECK` for updates. The `anon` role has no table privileges. The `authenticated` role has explicit Data API grants, while RLS remains the authorization boundary.

`replace_active_goal` is a `SECURITY INVOKER` function available only to authenticated users. A PostgreSQL exclusion constraint prevents overlapping goal periods, so historical reviews can retain the target and goal snapshot that were active when the day occurred.

### Migration workflow

Use the Supabase MCP connection for this project or a linked Supabase CLI. Do not edit an already-applied migration.

```bash
# after authenticating the CLI and linking the intended project
npx supabase@latest migration new descriptive_name
npx supabase@latest db push
npx supabase@latest gen types typescript --linked > src/types/database.ts
```

Review the generated SQL, apply it to only the intended project, rerun security/performance advisors, and commit the migration and regenerated types together.

## Local setup

1. Install Node.js 22 or newer.
2. Install exact dependencies:

   ```bash
   npm ci
   ```

3. Copy `.env.example` to `.env.local` and provide the public project values described below.
4. Start development:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000` and create or sign in to an account.
6. Configure targets in Settings → Goals. To inspect analytics without manually entering a month, use Settings → Data on a new empty account and explicitly add demo data.

The demo action never runs automatically. It refuses accounts that already contain a goal or meal history.

## Install on iPhone

The production site includes a web app manifest, branded 192px/512px maskable icons, an Apple touch icon, and standalone display metadata. To install it:

1. Open the production URL in Safari.
2. Tap Share.
3. Choose **Add to Home Screen**, then **Add**.

The installed app opens directly to Today and uses the same Supabase account as the browser version. Authenticated pages are intentionally not cached for offline use, so logging and review data always come from the live protected database.

## Environment variables

Required:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Optional server-only nutrition search:

```dotenv
FDC_API_KEY=
```

The USDA key is read only by the server route. Without it, manual logging, custom foods, saved meals, and repeat logging continue to work. Do not add a Supabase secret/service-role key or an OpenAI key to the browser environment.

Playwright additionally expects four test-only process variables for two isolated confirmed accounts:

```dotenv
E2E_EMAIL=
E2E_PASSWORD=
E2E_DEMO_EMAIL=
E2E_DEMO_PASSWORD=
```

Do not commit `.env.local` or E2E credentials.

## Scoring engine

The pure modules in `src/lib/scoring` implement algorithm version `1.0.0`.

Daily default weights are calories 30, protein 20, fiber 8, carbohydrates 6, fat 6, water 15, and steps 15. Calories and the two balancing macros use target-alignment curves; protein, fiber, water, and steps use saturating minimum-target curves. Weekly grading blends coverage-weighted sufficient daily scores with a configured workout target. Monthly grading uses coverage-weighted daily scores.

Unavailable or unconfigured metrics are removed before weighting. Available weights are normalized to 100%, and the original available/possible ratio becomes confidence: high at 80%+, medium at 55%+, low at 35%+, and insufficient below 35%. Insufficient results do not receive a letter grade. Weekly grades require four sufficient days; monthly grades require fifteen.

Every completed daily review stores the numeric result, target snapshot, metric breakdown, coverage, confidence, summary, completion time, and algorithm version.

## Insight engine

The pure modules in `src/lib/analytics` aggregate only requested week/month ranges. Pattern rules cover protein, hydration, restaurant-versus-home meals, weekend behavior, late eating, caloric drinks, activity-score association, and takeout change versus the prior period.

Each rule has a minimum sample, material effect threshold, structured evidence, confidence tier, and deterministic text template. Rules return no insight when evidence is weak. Results are ranked by product priority plus confidence and capped to five weekly or six monthly insights. Association wording deliberately avoids causal claims.

## Testing

```bash
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
npm run test:e2e
```

The Playwright suite uses real Supabase Auth and RLS-protected persistence. It covers route protection, sign-in, goal changes, manual meal entry and scoring, independent repeat logging, custom food reuse, quick water, activity, day completion, completed-day edit/recalculation, history, seeded weekly/monthly reviews, and mobile overflow.

The unit suite covers curve boundaries/interpolation, all metric scorers, normalized missing-data weighting, confidence and grade boundaries, meal/day/week/month scores, invariants, aggregation, pattern evidence, false-positive suppression, local-midnight behavior, multiple IANA zones, and both DST transitions.

## Production and Vercel

Production: https://food-intake-app.vercel.app

Public demo: https://food-intake-app.vercel.app/demo

Repository: https://github.com/mastercontrolJavi/food-intake-app (private)

1. Import the repository into Vercel using Node.js 22 or newer.
2. Set the two required Supabase public variables for Production and Preview. Add `FDC_API_KEY` only if USDA lookup is desired.
3. Add production and preview URLs to Supabase Auth redirect configuration.
4. Deploy and run a smoke test for sign-in, one log mutation, Finish Day, and review rendering.
5. Enable Supabase Auth leaked-password protection in the project dashboard when available for the project plan.

No server secret is required for normal application operation.

## Known limitations

- V1 supports email/password auth only; password reset and social providers are not included.
- USDA search imports the database nutrient snapshot returned by the search API and expects the user to review portion context before saving. There is no barcode scanner or automatic arbitrary-text nutrition inference.
- Period pages calculate on request; `period_reviews` is reserved for future caching/auditing.
- Authenticated demo seeding is intentionally limited to a brand-new empty account. The separate public `/demo` experience is read-only, fictional, and never writes to Supabase.
- Data export/import and account deletion UI are not included in V1.
