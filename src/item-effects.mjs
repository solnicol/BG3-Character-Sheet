// Verified item definitions keyed by saved stats ID. Effects apply only in their
// actual equipment slots. Ability scores and current HP already come from the
// save: do not add an item's Strength/Charisma/temporary-HP effects again.
const wiki=page=>'https://bg3.wiki/wiki/'+page;
export const ITEM_EFFECTS=new Map([
 ['UNI_MassHealRing',{slot:/^Ring/,note:'Blessed Mercy: healed creatures gain +1d4 to attacks and saves for 2 turns; does not stack with Bless.',source:wiki('The_Whispering_Promise')}],
 ['UND_SocietyOfBrilliance_MagicMissileNecklace',{slot:/^Amulet$/,note:'Psychic Missiles: Magic Missile fires one additional dart.',source:wiki('Psychic_Spark')}],
 ['MAG_Acid_AcidDamageOnWeaponAttack_Ring',{slot:/^Ring/,acid:2,source:wiki('Caustic_Band')}],
 ['MAG_Ketheric_Shield',{slot:/Offhand|Shield/,shieldAC:2,spellAttack:1,spellDC:1,note:'Ketheric’s Shield: advantage on Dexterity saves; Shield Bash reaction.',source:wiki('Ketheric%27s_Shield')}],
 ['MAG_Absolute_Protecter_Shield',{slot:/Offhand|Shield/,shieldAC:2,note:'Absolute’s Aegis: spell damage received −1 if branded; Shield Bash reaction.',source:wiki('Absolute%27s_Protector')}],
 ['MAG_RiskyAttack_Ring',{slot:/^Ring/,note:'Risky Ring: advantage on attack rolls; disadvantage on saving throws.',source:wiki('Risky_Ring')}],
 ['MAG_Selunite_Isobel_Robe',{slot:/^(Breast|Body)$/,saveAll:1,note:'Moon Devotion: advantage on Constitution saves. With Mage Armour, successful saves against spells retaliate for 1d4 radiant.',source:wiki('Moon_Devotion_Robe')}],
 ['PLA_SmugglerRing',{slot:/^Ring/,skills:{Stealth:2,'Sleight of Hand':2},source:wiki('Smuggler%27s_Ring')}],
 ['DEN_HellridersPride',{slot:/^Gloves$/,saves:{str:1},note:'Helm’s Protection: healing another creature grants physical weapon-damage resistance for 2 turns.',source:wiki('Hellrider%27s_Pride')}],
 ['UNI_DarkJusticiarArmor_HalfPlate',{slot:/^(Breast|Body)$/,note:'Dark Justiciar: advantage on Constitution saves and Stealth. With Shield of Faith: incoming damage −2; attackers take 1d4 necrotic.',source:wiki('Dark_Justiciar_Half-Plate_(Very_Rare)')}],
 ['MAG_CQCaster_TempHPAfterCast_Cloak',{slot:/^Cloak$/,note:'Arcane Vivaciousness: gain 8 temporary HP after casting a spell while Threatened.',source:wiki('Vivacious_Cloak')}],
 ['MAG_Healer_TempHPOnHeal_Boots',{slot:/^Boots$/,note:'The Comeback: healed targets gain 3 temporary HP.',source:wiki('Boots_of_Aid_and_Comfort')}],
 ['MAG_Illithid_Regen_Circlet',{slot:/^Helmet$/,note:'Psychic Leech: regain 1d4 HP when an enemy fails an INT, WIS or CHA save against your spell.',source:wiki('Circlet_of_Mental_Anguish')}],
 ['MAG_Psychic_MentalOverload_Ring',{slot:/^Ring/,note:'Mental Inhibition: failed saves against your spells or actions inflict Mental Fatigue for 2 turns.',source:wiki('Ring_of_Mental_Inhibition')}],
 ['MAG_Frost_GenerateSurfaceOnColdDamage_Ring',{slot:/^Ring/,note:'Snowburst: dealing cold damage creates a 4.5 m circle of ice around the target.',source:wiki('Snowburst_Ring')}],
 ['MAG_BarbMonk_Offensive_Cloth',{slot:/^(Breast|Body)$/,note:'Bull’s Strength: advantage on Strength checks; double carrying capacity. Cannot be pushed; advantage against restraint.',source:wiki('The_Mighty_Cloth')}],
 ['MAG_Bard_RefreshBardicInspirationSlot_Shoes',{slot:/^Boots$/,note:'Restore Bardic Inspiration: restore one charge, once per long rest.',source:wiki('Boots_of_Brilliance')}],
 ['MAG_ElementalGish_AbsorbElements_Cloak',{slot:/^Cloak$/,note:'Absorb Elements: reaction to halve incoming elemental damage; your next weapon attack adds 1d6 of that element.',source:wiki('Cloak_of_Elemental_Absorption')}],
]);
export function equippedEffects(items=[]){
 const seen=new Set();return items.flatMap(i=>{const rule=ITEM_EFFECTS.get(i.stats);if(!rule||!rule.slot.test(i.slot||'')||seen.has(i.stats))return [];seen.add(i.stats);return [rule];});
}
