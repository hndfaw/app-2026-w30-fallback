# Tickets — Fallback

- **Deadline:** 2026-08-07 (extended from 2026-07-31 — missed nights while the runbook was incomplete)
- **Total:** 14
- **Cadence:** one PR per build firing, hourly 6–11 PM ET,
  quota = ceil((remaining + opened_today) / days_left) — start-of-day remaining

Ordered so the repo stays runnable throughout: scaffolding first, pure logic next,
UI on top, deploy + done-pass last.

| # | Ticket | Status | PR | Date |
|---|--------|--------|----|------|
| 1 | Scaffold Vite + React + TypeScript project with npm scripts | done | #1 | 2026-07-24 |
| 2 | Add Vitest setup, test script, and a smoke test | done | #2 | 2026-07-24 |
| 3 | Plan data model: contacts, meeting points, critical items, dependency tags + validation + tests | done | #3 | 2026-07-27 |
| 4 | localStorage persistence with schema version + migration guard + tests | done | #4 | 2026-07-27 |
| 5 | Stress-test engine: simulate loss of phone/power/internet/person, compute surviving plan + tests | done | #5 | 2026-07-27 |
| 6 | Single-point-of-failure analyzer: items depending on exactly one channel or person + tests | done | #6 | 2026-08-04 |
| 7 | Plan builder UI: contacts and meeting points forms | done | #7 | 2026-08-04 |
| 8 | Plan builder UI: critical items with dependency tagging | done | #8 | 2026-08-04 |
| 9 | Scenario results UI: per-scenario pass/fail with concrete gap list | done | #9 | 2026-08-05 |
| 10 | Printable fallback card: essentials selection + print-CSS layout (fridge + wallet) | done | #10 | 2026-08-05 |
| 11 | Sample demo plan + empty-state onboarding | done | #11 | 2026-08-05 |
| 12 | Polish pass: navigation, responsive layout, a11y basics | done | #12 | 2026-08-05 |
| 13 | GitHub Pages deploy + CI: vite base path, ci.yml (vitest+build on PR), deploy.yml | done | #13 | 2026-08-05 |
| 14 | Definition-of-done pass: LICENSE, live-URL check, machine cleanup, mark Done | todo | | |

## Specs for tickets 13–14 (so any Builder session implements exactly this)

**Ticket 13 — deploy + CI:**
- `vite.config.ts`: add `base: '/app-2026-w30-fallback/'`.
- `.github/workflows/ci.yml`: `on: pull_request` → checkout@v4, setup-node@v4 (node 22,
  `cache: npm`), `npm ci`, `npm test`, `npm run build`.
- `.github/workflows/deploy.yml`: `on: push` to `main`; permissions contents:read,
  pages:write, id-token:write; concurrency group `pages`; build job (`npm ci && npm run
  build`, configure-pages@v5, upload-pages-artifact@v3 with `path: dist`) then deploy job
  (`environment: github-pages`, deploy-pages@v4).
- Enable Pages once: `gh api -X POST repos/hndfaw/app-2026-w30-fallback/pages -f build_type=workflow`
  (PUT if it already exists). Live URL: `https://hndfaw.github.io/app-2026-w30-fallback/`.

**Ticket 14 — definition-of-done pass (must be the last ticket):**
- README: live URL, run/deploy instructions, how to use (build plan → stress-test → print card).
- MIT `LICENSE` (copyright 2026 Hindreen Abdullah).
- Verify `curl -sIL https://hndfaw.github.io/app-2026-w30-fallback/ | head -1` → 200 and the
  latest CI + deploy runs are green.
- **Machine cleanup — non-negotiable before Done:** kill any vite dev/preview servers
  (ports 5173/4173), uninstall anything installed only for testing, `git fetch --prune`,
  delete merged `ticket/*` branches locally and on origin.
- Only then set `PROGRESS.md` status to `Done` and flip `"status": "done"` in
  `~/code/weeklylab/state.json`.
