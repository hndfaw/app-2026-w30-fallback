# Progress — Fallback

**Status:** In progress

## MVP roadmap (mirrors SPEC.md)

- [x] Plan builder (contacts, meeting points, critical items with dependency tags)
- [x] Stress-test engine (channel-loss scenarios + single-point-of-failure flags)
- [x] Results view (per-scenario pass/fail with concrete gaps)
- [x] Printable fallback card (print-CSS, fridge + wallet)
- [x] Offline-first (localStorage, demo plan, no accounts/keys)

## Session log

- 2026-07-24: ticket #1 — Scaffold Vite + React + TypeScript project with npm scripts (PR #1)
- 2026-07-24: ticket #2 — Add Vitest setup, test script, and a smoke test (PR #2)
- 2026-07-27: ticket #3 — Plan data model: contacts, meeting points, critical items, dependency tags + validation + tests (PR #3)
- 2026-07-27: ticket #4 — localStorage persistence with schema version + migration guard + tests (PR #4)
- 2026-07-27: ticket #5 — Stress-test engine: simulate loss of phone/power/internet/person, compute surviving plan + tests (PR #5)
- 2026-08-04: ticket #6 — Single-point-of-failure analyzer: items depending on exactly one channel or person + tests (PR #6)
- 2026-08-04: ticket #7 — Plan builder UI: contacts and meeting points forms (PR #7)
- 2026-08-04: ticket #8 — Plan builder UI: critical items with dependency tagging (PR #8)
- 2026-08-05: ticket #9 — Scenario results UI: per-scenario pass/fail with concrete gap list (PR #9)
- 2026-08-05: ticket #10 — Printable fallback card: essentials selection + print-CSS layout (fridge + wallet) (PR #10)
- 2026-08-05: ticket #11 — Sample demo plan + empty-state onboarding (PR #11)
- 2026-08-05: ticket #12 — Polish pass: navigation, responsive layout, a11y basics (PR #12)
- 2026-08-05: ticket #13 — GitHub Pages deploy + CI: vite base path, ci.yml, deploy.yml (PR #13)
