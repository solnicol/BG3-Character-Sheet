// Verified item definitions keyed by saved stats ID. Effects apply only in their
// actual equipment slots. Ability scores and current HP already come from the
// save: do not add an item's Strength/Charisma/temporary-HP effects again.
const wiki=page=>'https://bg3.wiki/wiki/'+page;
export const ITEM_EFFECTS=new Map([
 ['MAG_BarbMonk_Cloth_Hat_A_1_Late',{slot:/^Helmet$/,initiative:1,spellDC:1,source:wiki('Fistbreaker_Helm')}],
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
 ['MAG_Jumping_Shoes',{slot:/^Boots$/,skills:{Acrobatics:1},note:'Refined Vaulting: jump distance +1.5 m.',source:wiki('Swiresy_Shoes')}],
 ['MAG_OfArcanicDefense_Robe',{slot:/^(Breast|Body)$/,note:'Exquisite Focus: while concentrating, add your spellcasting modifier to saving throws and gain +1 AC.',source:wiki('Robe_of_Supreme_Defences')}],
 ['MAG_Harpers_RingOfTwilight',{slot:/^Ring/,note:'Treader by Twilight: +1 AC while obscured.',source:wiki('Ring_of_Twilight')}],
 ['MAG_Healer_HealSelf_Helmet',{slot:/^Helmet$/,note:'Crowning Glory: regain 1d6 HP when you heal another creature.',source:wiki('Wapira%27s_Crown')}],
 ['UND_KC_RingOfAbsolute',{slot:/^Ring/,note:'Absolute’s Tempest: +1 thunder damage on thunder spells and attacks if you bear the Absolute’s brand.',source:wiki('Ring_of_Absolute_Force')}],
 ['MAG_PHB_CloakOfDisplacement_Cloak',{slot:/^Cloak$/,note:'Displacement: each turn, attacks against you have disadvantage until you take damage.',source:wiki('Cloak_of_Displacement')}],
 ['MAG_FlamingFist_StaffOfFire',{slot:/^Melee Main Weapon$/,note:'Incandescent Staff: resistance to fire damage.',source:wiki('Incandescent_Staff')}],
 ['FOR_NightWalkers',{slot:/^Boots$/,note:'Night Walker: cannot be Enwebbed, Entangled or Ensnared, and cannot slip on grease or ice.',source:wiki('Disintegrating_Night_Walkers')}],
 ['MAG_Harpers_JhannylGloves',{slot:/^Gloves$/,saveAll:1,note:'Defy Villainy: automatically cast Lesser Restoration on yourself when Blinded, Paralysed or Poisoned.',source:wiki('Jhannyl%27s_Gloves')}],
 ['MAG_Paladin_MomentumOnConcentration_Boots',{slot:/^Boots$/,skills:{Athletics:1},note:'Focused Stride: casting a concentration spell grants Momentum; cannot be pushed or knocked prone while concentrating.',source:wiki('Boots_of_Striding')}],
 ['MAG_WYR_Hellrider_Longbow',{slot:/^Ranged Main Weapon$/,initiative:3,note:'Hellrider Longbow: advantage on Perception checks; hits may inflict Faerie Fire.',source:wiki('Hellrider_Longbow')}],
]);
export function equippedEffects(items=[]){
 const seen=new Set();return items.flatMap(i=>{const rule=ITEM_EFFECTS.get(i.stats);if(!rule||!rule.slot.test(i.slot||'')||seen.has(i.stats))return [];seen.add(i.stats);return [rule];});
}
