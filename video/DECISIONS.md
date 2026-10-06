# Decisions log

One line each: **decision** — reason — *alternative rejected*.

## Phase A
- **Commit to the session branch `claude/wizardly-newton-kymfyu`, not `motion-film`** — the execution environment only permits pushing the designated branch; the brief's intent (isolated branch, never main, never force-push, never merge) is preserved — *creating/pushing `motion-film` (blocked by environment rules)*.
- **Run the app with placeholder Supabase env vars passed on the command line** — `/demo` is public and fully deterministic, so no real backend is needed and no file is written into the app — *writing `.env.local` (touches the app tree)*.
- **Authenticated-only screens (meal form, quick actions) rebuilt from component code** — they cannot be reached without an account; rebuilt 1:1 from `meal-form.tsx` / `dashboard-view.tsx` and marked in AUDIT.md — *skipping logging entirely (weakens "log → understand" story)*.
- **Film theme: dark mode throughout** — the brand mark (IntakeDial) only ever appears on the forced-dark login panel; dark keeps one continuous surface from logo to UI, and the dark tokens are complete for every screen used — *light (default) theme: would split the film between a dark brand open and light UI*.
- **Use OKLCH token strings directly in the film's CSS** — Chromium renders them identically to the app; hex kept in AUDIT.md for reference — *hand-converted hex (rounding drift)*.
- **All film numbers computed by the app's real scoring/analytics engine via `scripts/build-fixtures.ts`** — truth rule; fictional inputs, real outputs — *hand-typed numbers*.
