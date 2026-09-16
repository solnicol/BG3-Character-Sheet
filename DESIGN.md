# Character sheet design direction

Preserve the recognisable tabletop sheet: paper, serif character names, ability-score shapes, compact print labels and separate spellbook/inventory page. Use a restrained burgundy accent for actions and plain system type for the application controls. Low motion; medium information density.

## Audit and first pass

The previous toolbar gave import, backup, reset and print nearly equal prominence. Small labels and two-column lists were difficult to read on phones. The import dialogue exposed an empty selector during parsing. Imported text fields resembled editable lined areas despite being read-only.

- Import is the primary action initially. Printing becomes primary once a save is imported.
- Backups and resetting live under Manage sheet. Backup labels explicitly identify JSON files.
- Character/combat and spellbook/inventory have direct navigation links.
- Reading, character selection and failure have distinct import states. Failure offers another file; successful import focuses the optional player name.
- Desktop uses larger text and calmer borders. Mobile uses one column for spells and inventory, with larger touch targets.
- Screen styling is isolated from the print template. No data is removed to make the layout fit.

## Accuracy and release boundaries

Visual hierarchy must never imply unavailable mechanics have been verified. Unknown values retain their existing representation; parser diagnostics remain accessible. The existing combat-body-slot matcher excludes camp clothing; an additional regression check covers all three captured loadouts in either equipment order. The latest typography, print-column layout and parser fixes are retained.

This design pass is a local preview until explicitly published. Verify the actual production domain and deployed assets before claiming a live release. The old deployment-specific URL does not track future deployments.
