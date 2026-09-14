# BG3 character sheet

A local browser character-sheet generator with a vendored BG3 save parser. This is a work in progress, not yet a fully accurate save-to-sheet exporter.

## Run

```sh
npm ci
npm run build
npm start
```

Open http://127.0.0.1:8765/. Import an `.lsv` file, select a character, and save a JSON backup. Saves are parsed in a browser worker and are not uploaded. Use a trusted static host when deploying.

## Current limitations

- Live inventory containers determine equipped and carried items when a character owner can be identified. Nested bags are traversed without duplication. Unsupported or ambiguous ownership falls back to upstream attribution.
- Gold uses per-entity stack records with corrected heap offsets. Changed stack bytes are regression-tested; no character-specific values are substituted. Missing attribution leaves gold blank.
- Saved level-up skill selections, expertise, backgrounds and fighting styles are decoded where the build can be uniquely matched. Starting-class saving throws and supported background/racial proficiency grants are applied. Additional feat and temporary-effect grants remain incomplete; see MECHANICS.md.
- Armour and weapon calculations describe base properties; active boosts, conditional effects and some special items require further decoding. Armour class is derived from equipped body armour and shields; unrecognised armour leaves it blank with a warning rather than showing a wrong total.
- Ordinary and pact slots are stored separately. Older JSON backups with `(pact)` values migrate automatically when loaded.
- PDF export uses the browser print dialogue. Inventory is no longer clipped, but long content can exceed two pages. Turn off browser headers and footers in the dialogue.

## Verification

`npm test` runs adapter regression tests. `npm run build` rebuilds the browser worker and importer. `npm run test:browser` runs browser import checks after starting the server; set `CHROME_PATH` if needed. Browser integration fixtures live in the upstream checkout and are excluded from Git. A fresh clone must obtain those fixtures separately.

Private exports, saves, generated PDFs and preview screenshots are excluded from Git. See THIRD_PARTY.md for the vendored source revision, modifications and unresolved redistribution permission. Do not publish the vendored parser until its licence is confirmed.

## Deploy to Vercel

Import the `solnicol/BG3` GitHub repository in Vercel. The committed `vercel.json` uses `npm run build` and publishes only `dist/`. No environment variables, database or server are needed. Parsing remains in the visitor’s browser.

Changes pushed to the connected production branch deploy automatically. The local preview remains available through `npm start`.
