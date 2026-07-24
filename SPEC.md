# Fallback

> Stress-test your household emergency plan against phone, power, internet, or caregiver loss — then print the fallback card that survives all of them.

- **Week:** 2026-W30   **Created:** 2026-07-24
- **Repo:** app-2026-w30-fallback

## Problem
Most household emergency planning stops at supplies: water, batteries, a folder of documents.
But real emergencies break *channels*, not just stockpiles — the phone that holds every
contact dies, the power that runs the medical fridge cuts out, the one person who knows the
medication schedule is unreachable. Nobody notices these single points of failure until the
moment they fail. Fallback makes them visible in advance, and produces the one artifact that
works when everything else doesn't: a printed card.

## Target user
Households (parents, caregivers, people managing elder care) whose emergency plan must keep
working with no phone, no power, and no internet.

## MVP features (the week's roadmap)
- [ ] **Plan builder** — enter contacts, meeting points, and critical items (meds, documents,
      utility shutoffs), tagging each with what it depends on: phone, power, internet, or a
      specific person
- [ ] **Stress-test engine** — simulate losing each channel (and combinations); compute what
      part of the plan survives and flag every single point of failure
- [ ] **Results view** — per-scenario pass/fail with the concrete gaps ("no memorized number
      for Dad", "med schedule known only by one caregiver")
- [ ] **Printable fallback card** — a print-CSS card (fridge + wallet size) carrying only the
      offline-essential info, generated from the plan
- [ ] **Offline-first** — localStorage persistence, sample demo plan, no accounts, no keys

## Stretch (only if time)
- Combination scenarios (phone + power together), severity weighting
- Multiple households / plan export-import as JSON

## Tech stack
- **Vite + React + TypeScript** — same proven pipeline as Keydojo; deploys to GitHub Pages.
- **Vitest** — the stress-test engine and SPOF analyzer are pure functions, ideal for unit tests.
- **localStorage + print CSS** — zero backend, zero keys; the deliverable literally must work offline.

## Non-goals
- No accounts, sync, or server storage — a plan never leaves the browser.
- No real-time alerts/notifications (that's a different product).
- No PDF library — the browser's print dialog + print stylesheet is the export path.
- No medical/legal advice content — the app structures *your* plan, it doesn't write one.

## Definition of done (for the week)
All MVP boxes checked; a new user can build a plan, run the stress tests, see at least one
real single point of failure flagged, and print a legible fallback card within 10 minutes,
entirely offline after first load.

Plus the standing lab bar (every weekly app, non-negotiable):
- [ ] Deployed at a public URL (or installable release) that actually responds
- [ ] CI green: tests + build run on every PR
- [ ] README explains how to run, deploy, and use it; LICENSE present
- [ ] Machine cleanup: dev servers killed, test-only installs removed, no stray
      processes/ports/tabs, merged ticket branches pruned
