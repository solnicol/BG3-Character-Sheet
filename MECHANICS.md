# Mechanics and save coverage

Skill choices and expertise are decoded from each saved level-up selector. Background UUIDs come from the parallel creation table, with matching row counts required. Histories are attributed only when the class/subclass build is unique. Starting-class saving throws come from the recovered first level, not from the order of the current multiclass display.

Skill enum mapping: [BG3 Script Extender definitions](https://github.com/Norbyte/bg3se/blob/main/BG3Extender/GameDefinitions/Enumerations/Stats.inl).

Base proficiency and saving-throw rules: [Proficiency](https://bg3.wiki/wiki/Proficiency). Armour and weapon grants include starting class, supported multiclass grants and racial proficiencies. Additional feat or conditional proficiency grants are not yet comprehensive.

Combat contributions implemented:
- Saved Archery fighting style: +2 ranged weapon attack.
- [Gloves of Archery](https://bg3.wiki/wiki/Gloves_of_Archery): +2 ranged weapon damage, not attack.
- [Sharpshooter: All In](https://bg3.wiki/wiki/Sharpshooter:_All_In): -5 ranged weapon attack and +10 damage only when the owning character's saved toggle is enabled and the weapon is proficient.
- [Defence](https://bg3.wiki/wiki/Defence): +1 AC while wearing recognised body armour.
- Armour class is derived from the live loadout. Body armour and shields are identified
  by the parser's canonical slot, so a `VanityBody` cosmetic overlay never displaces real
  `Breast` armour and a ring named "of Mind-Shielding" never counts as a shield.
- The parser's `armour_class` field is declared but never populated, so it is only a
  forward-compatible fallback and is never the sole basis for a total.
- Armour whose type is not recognised leaves armour class blank with an explicit import
  warning. Scoring it as unarmoured would silently under-report by up to seven points,
  so no number is shown rather than a wrong one. Named magic armour such as Luminous
  Armour, Enraging Heart Garb and The Graceful Cloth needs armour-class game data that
  is not yet vendored.
- Duelling and two-weapon fighting: supported base damage adjustments; special weapons and situational effects still need broader game-data coverage.

[Favourable Beginnings](https://bg3.wiki/wiki/Favourable_Beginnings) is conditional on the first attack against a target. It is not silently added to every attack. Full active-status and target-dependent totals are not yet reconstructed. The sheet's attack numbers are supported baseline totals plus recovered toggles, not a promise to match every in-game target tooltip.

UI: imported records are read-only apart from player name. Spells are grouped by level, ordinary and pact resources stay separate, and inventory uses the full width below the spellbook. Browser printing remains the export mechanism; long records may exceed two pages.
