# BG3 save parser

The local import worker bundles the TypeScript parser and game-data name table from [danielsamuels/bg3-savefile-parser](https://github.com/danielsamuels/bg3-savefile-parser), pinned to commit `9578ff7c46a1aa40c805f6b7beecf907f10fb3b8`.

The checkout is in `vendor/bg3-savefile-parser`. Its TypeScript source has local modifications; it is not an unchanged upstream checkout. `build.mjs` applies explicit build-time compatibility patches. Name lengths, class levels and resource replenish flags are read as 32-bit fields, excluding the non-zero padding found in the multiplayer save. Resource padding is ignored, while finite amounts and valid ranges are still required. Custom-player names are recovered from complete parallel creation/level-up tables and matched only by unique class builds; positions remain separate for inventory attribution. A further extension exposes each attributed character’s class levels from the already-decoded ECS classes. This avoids guessing multiclass levels from SaveInfo’s total level. The build fails if its source anchor changes.

`src/save-adapter.mjs` translates the report into the character sheet. The parser’s [limitations](https://github.com/danielsamuels/bg3-savefile-parser/blob/9578ff7c46a1aa40c805f6b7beecf907f10fb3b8/LIMITS.md) still apply, including ambiguous hireling builds, some feat attribution and item-name variants. The adapter derives base AC and initiative from the recovered loadout and abilities. Selected proficiencies and background are not inferred from class. Live equipment uses decoded inventory containers, with an upstream fallback for ambiguous owners. Active combat boosts remain incomplete.

Armour class is derived by matching the equipped body armour to its family. `gamedata.json` carries names, slots and rarity but no armour-class data, and named magic armour such as Luminous Armour (`MAG_Radiant_RadiatingOrb_Armor`) encodes no family in either its display name or its stats ID. Those items are held in `NAMED_ARMOUR` in `src/save-adapter.mjs`, keyed on the stats ID and taken from the item's published stat block on [bg3.wiki](https://bg3.wiki/wiki/Luminous_Armour), whose rarity agrees with the one `gamedata.json` records; the import summary says when a total rests on such a value. Armour that matches neither route still withholds the total rather than scoring it as unarmoured.

Position lookup for a party member without a recognised template considers only `Character` nodes. When two `Character` nodes still share the position, the one carrying a `PlayerData` child wins: a creature can stand on the very tile a player occupies, which an extended party makes common, and only a player-controlled character has that child. Two player characters on one tile remain ambiguous. A character's own subtree repeats its Translate on bookkeeping nodes such as `TargetData/SurfaceLayerCheck`, and counting those as rivals made a unique position look ambiguous, so a second custom player standing on a surface was left with no character node and therefore no equipment, inventory or conditions.

Ownerlist record offsets take the same 48-byte heap base as every other pointer in the blob. Read raw, each component's ownerlist starts twelve entries early: it opens with the tail of the previous component's list and loses its own last twelve entities. Those are the highest entity rows, which is where a multiplayer save puts its custom player characters, so `game.stats.v3.StatsComponent` had no owner for them and their ability scores could not be attached. Hit points survived because `HealthComponent` is long enough that its own twelve-entry loss falls elsewhere. Corrected, every ownerlist reads as a complete `0..rowCount-1`; in the reference multiplayer save the change is strictly additive, adding ability scores for both custom players and altering nothing else for any character.

Local inventory changes correct the 48-byte heap base for stack tables, stack groups, container tables and owner lists. Container kind is read through DataComponent into the Type pool; equipped and carried membership is determined by containers rather than item names. Stack counts are summed per member, including final records and stacks of one.

No upstream licence file was found in this checkout. Redistribution permission must be established before publishing the vendored parser.

The runtime also bundles `fzstd` 0.1.1 (MIT). esbuild 0.25.12 (MIT) is used only to build the local scripts. Their notices are retained in the installed packages and generated bundle legal comments.

# Fonts

Three open-licensed families are self-hosted in `assets/fonts`, so the sheet makes no
third-party request and keeps working offline:

- [Yeseva One](https://fonts.google.com/specimen/Yeseva+One) — the sheet masthead only.
- [Alegreya SC](https://fonts.google.com/specimen/Alegreya+SC) — section headings; it has
  genuine small capitals rather than synthesised ones.
- [Alegreya Sans](https://fonts.google.com/specimen/Alegreya+Sans) — small labels and the
  stat figures, set with lining tabular numerals because the family's default old-style
  figures read a zero as a letter O.

- [Kalam](https://fonts.google.com/specimen/Kalam) — the character name alone, which is the
  one field a person writes onto the printed form. The family ships Light, Regular and Bold
  and has no Medium, so Regular is used. It is set smaller than the printed name it replaced
  so it reads as a written line rather than a display heading, and the field's height and the
  gap between the writing and its rule are pinned so the form does not move around it.

All four are under the SIL Open Font License 1.1, which permits redistribution. The licence
text for each is committed beside the font files as `OFL-<family>.txt`. Only the Latin subset
and the weights actually used are included.

Handwriting is confined to that one field: stats, skills, equipment, headings and labels all
stay in the printed typography. Body copy stays on Georgia. Every stack keeps its previous family as a fallback, so glyphs a
web font lacks still render.

