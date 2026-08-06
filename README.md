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

`vite.config.ts` sets `base: '/app-2026-w30-fallback/'` so assets resolve under the
project-Pages subpath; change it if you fork under a different name.

## Project layout

```
src/core/        pure logic — plan model + validation, stress-test engine,
                 single-point-of-failure analyzer, localStorage layer
src/components/  plan builder forms, results view, fallback card
src/App.tsx      the shell wiring it together
```

The engine and analyzer are pure functions with unit tests next to each module;
React is only the shell around them.

## License

[MIT](./LICENSE)
