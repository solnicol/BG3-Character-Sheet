---
name: bg3-browser-save-import-testing
description: Exercise local BG3 binary-save import, character attribution, JSON backup and print in the browser.
---

# Local browser testing

This mirrors `.agents/skills/testing-save-import/SKILL.md`, which serves Devin.
The two copies are meant to be the same procedure, so a change to one belongs in
the other.

Run from the BG3-Character-Sheet repo. Install dependencies with `npm ci` if
needed, rebuild parser/UI assets with `npm run build` after source changes, then
run `npm start`. Open http://127.0.0.1:8765/ rather than a file URL; binary-save
import uses a Web Worker and explicitly rejects file URLs.

## Devin Secrets Needed

None. Parsing is local; obtain an authorized `.lsv` fixture/attachment instead.

## Import and attribution

Use **Import BG3 save**, choose the `.lsv`, wait for character options, select
the exact name, then **Import selected character**. Large saves can take tens
of seconds; the UI timeout is 90 seconds. Confirming or cancelling discards the
parsed report, so another character needs another upload.

Check selected identity, equipment and gold together. Scroll to **Equipment &
inventory** (browser Find for `EQUIPPED` is useful). Compare whole equipped lists
between characters; shared individual items are legitimate. Distinguish explicit
coverage warnings/unknown AC from missing character-node failures.

## Backup, print, diagnostics

**Save character** downloads `<name>-bg3.json`; inspect the actual download to
compare equipment, attacks, conditions and gold. **Print / Save PDF** opens native
Chrome preview; check inventory continuation pages and cancel to verify cleanup.
Do not substitute direct application-state assignment for an import-flow test.

Inspect native DevTools console as well as console-log tooling: resource errors
may not appear in the latter. Local Vercel analytics may be blocked/unavailable,
and static assets such as favicon may return 404; report these separately from
parser exceptions rather than claiming a completely clean console.
