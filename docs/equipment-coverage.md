# Equipment coverage: October 2026 save audit

The importer uses saved item stats IDs and equipment slots, not character names or a fixed loadout. The supplied “stole ambush sword” save was audited against the current tables. Source URLs live beside the definitions in `src/item-effects.mjs`, `src/weapon-data.mjs` and `src/save-adapter.mjs`.

## Added or corrected calculations

| Definition | Treatment |
| --- | --- |
| Least Expected | +2 weapon enchantment. Darkveil Precision adds an explicit 1d4 to ranged attack rolls only with its active saved status; the technical owner status alone is insufficient. |
| Caustic Band | +2 acid on weapon attack lines, excluded from unarmed strikes. |
| Ketheric’s Shield | AC +2; spell attack and spell save DC +1. Dexterity save advantage remains descriptive. |
| Absolute’s Protector | AC +2; no invented extra enchantment. Its branded damage reduction is conditional. |
| Dark Justiciar Half-Plate | Separate IDs: rare base AC 16; very rare base AC 17, both with maximum +2 Dexterity. |
| Moon Devotion Robe | +1 to every saving throw; Constitution save advantage described separately. |
| Hellrider’s Pride | +1 Strength saving throws; healing-triggered resistance described separately. |
| Smuggler’s Ring | +2 Stealth and Sleight of Hand. Saved Charisma is retained without subtracting again. |
| Blade of Oppressed Souls | +1 longsword with 1d4 psychic damage, including when equipped in a future save. |
| Drakethroat Glaive | +2 glaive. Merely carrying it does not apply its cast enchantment to another weapon. |
| Absorb Elements resource | GUID `6275ca19-95d9-469c-a649-b26f990882fa` resolves to Absorb Elements, preserving saved current/maximum charges. |
| Swiresy Shoes | +1 Acrobatics; jump distance described. |
| Boots of Striding | +1 Athletics; Focused Stride described. |
| Jhannyl’s Gloves | +1 to every saving throw, stacking with Moon Devotion Robe; Defy Villainy described. |
| Hellrider Longbow | +1 longbow; +3 initiative from the ranged slot only. Perception advantage and Faerie Fire described. |
| Item charge markers | `MAG_…_OWNER` and `MAG_…_RESOURCE` statuses are left off conditions; their charges already appear under resources. Interrupt resources read as names (Misty Escape, Psionic Dominance charge). |

## Additional conditional benefits

Equipped-only notes cover Robe of Supreme Defences, Ring of Twilight, Wapira’s Crown, Ring of Absolute Force, Cloak of Displacement, Incandescent Staff, Disintegrating Night Walkers, Risky Ring, the Whispering Promise, Vivacious Cloak, Boots of Aid and Comfort, Circlet of Mental Anguish, Ring of Mental Inhibition, Snowburst Ring, the Mighty Cloth, Boots of Brilliance, Psychic Spark and Cloak of Elemental Absorption, alongside the armour/shield effects above. Ambusher and Gauntlets of the Warmaster retain the preceding change’s support.

Dice are never converted to an average bonus. Advantage/disadvantage and triggered healing/temporary HP are described rather than silently added to totals. Current HP, temporary HP, ability scores, resources and spell availability continue to come from the save. Item notes do not invent remaining charges or overwrite the saved spellbook.

## Verification and boundaries

Focused regressions cover equipment-versus-carried attribution, both armour variants, conditional attack dice, spell/save/skill bonuses, retained HP and named weapon definitions. Browser verification uses the actual supplied save and downloaded character JSON, including restoration after reload. Generated worker and importer assets must be rebuilt with `npm run build`.

This is an extension of the supported equipment table, not a complete BG3 combat simulator. Target-dependent effects, external buffs and modded item definitions are not universally evaluated. Existing long-sheet print pagination is outside this calculation change. No private saves or exported character sheets belong in the repository.
