# Fallback

> Stress-test your household emergency plan against phone, power, internet, or caregiver loss — then print the fallback card that survives all of them.

Describe your plan (contacts, meeting points, critical items and what each depends on),
simulate losing each channel, see every single point of failure, and export a printable
card with the info that must work offline.

**Live app:** https://hndfaw.github.io/app-2026-w30-fallback/

## Using it

1. **Build your plan** — add contacts, meeting points, and critical items (meds, documents,
   utility shutoffs), tagging each with what it depends on: phone, power, internet, or a
   specific person.
2. **Run the stress test** — see per-scenario pass/fail results for losing phone, power,
   internet, or a person, plus every single point of failure flagged up front.
3. **Print your fallback card** — pick the essentials and print a fridge- or wallet-sized
   card with the offline-only info.

Everything is stored in `localStorage` in your browser — no accounts, no server, nothing
to lose access to.

## Run locally

```bash
npm install
npm run dev      # start the dev server
npm test         # run the test suite
npm run build    # type-check and produce a production build in dist/
npm run preview  # preview the production build locally
```

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the app and
publishes `dist/` to GitHub Pages. Every pull request runs `.github/workflows/ci.yml`
(tests + build) before merge.

Built one PR per evening by [weekly-lab](https://github.com/topics/weekly-lab) — week 2026-W30.
See `SPEC.md` for the scope and `TICKETS.md` for the plan.
