import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {adaptCharacter} from '../src/save-adapter.mjs';
import {weaponProperties} from '../src/weapon-data.mjs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const blank=Function('return ('+html.match(/const blank=\(\)=>\((.+)\);/)[1]+')');
const make=c=>adaptCharacter({characters:[{name:'Test',level:8,class_levels:[{name:'Fighter',level:8}],abilities:{str:10,dex:20,con:16,int:8,wis:14,cha:8},proficiency_bonus:3,equipment_proficiencies:['Simple Weapons','Martial Weapons'],...c}]},0,blank()).sheet;
const item=(stats,slot)=>({stats,slot,name:stats});
test('Least Expected has +2 enchantment and a saved Darkveil attack die, never damage',()=>{
 const bow=item('MAG_Shadow_Blinding_Bow','Ranged Main Weapon');
 let s=make({equipped:[bow],statuses:[{id:'MAG_SHADOW_OBSCURITY_ATTACK_BONUS'}]});
 assert.match(s.attacks,/\+10 \+1d4 to hit, 1d6 \+7 piercing/);
 s=make({equipped:[bow],statuses:[{id:'MAG_SHADOW_OBSCURITY_ATTACK_BONUS_OWNER_TECHNICAL'}]});assert.doesNotMatch(s.attacks,/1d4/);
});
test('Caustic Band applies to weapons but not unarmed strikes or carried rings',()=>{
 const ring=item('MAG_Acid_AcidDamageOnWeaponAttack_Ring','Ring 1'),sword=item('WPN_Shortsword','Melee Main Weapon');
 const c={class_levels:[{name:'Monk',level:8}],equipped:[sword,ring]};
 const s=make(c);assert.match(s.attacks.split('\n')[0],/\+ 2 acid/);assert.doesNotMatch(s.attacks.split('\n')[1],/acid/);
 assert.doesNotMatch(make({...c,equipped:[sword],carried:[ring]}).attacks,/acid/);
});
test('shield and armour variants use fixed definitions, spell bonuses and correct save bonuses',()=>{
 const s=make({equipped:[item('UNI_DarkJusticiarArmor_HalfPlate','Breast'),item('MAG_Ketheric_Shield','Melee Offhand Weapon'),item('DEN_HellridersPride','Gloves')]});
 assert.equal(s.ac,21);assert.equal(s.spellAttackBonus,1);assert.equal(s.spellDcBonus,1);assert.equal(s.saveBonuses.str,1);assert.equal(s.saveBonuses.dex,0);
 const r=make({equipped:[item('MAG_DarkJusticiar_HalfPlate','Breast')]});assert.equal(r.ac,18);
});
test('Moon Devotion save bonus and Smuggler skills survive sheet calculations without changing saved abilities',()=>{
 const s=make({equipped:[item('MAG_Selunite_Isobel_Robe','Breast'),item('PLA_SmugglerRing','Ring 1')]});
 assert.ok(Object.values(s.saveBonuses).every(v=>v===1));assert.equal(s.skillBonuses.Stealth,2);assert.equal(s.skillBonuses['Sleight of Hand'],2);assert.equal(s.abilities.cha,8);
 assert.deepEqual(make({carried:[item('MAG_Selunite_Isobel_Robe','Breast')]}).saveBonuses,{str:0,dex:0,con:0,int:0,wis:0,cha:0});
});
test('triggered temporary HP is described, not fabricated from equipped items',()=>{
 const s=make({hp:{current:20,max:30,temp:3},equipped:[item('MAG_CQCaster_TempHPAfterCast_Cloak','Cloak'),item('MAG_Healer_TempHPOnHeal_Boots','Boots')]});
 assert.equal(s.tempHp,3);assert.equal(s.hp,20);assert.match(s.features,/8 temporary HP/);
});
test('carried named weapons have complete base definitions for future equipment changes',()=>{
 const blade=weaponProperties(item('MAG_Illithid_MindOverload_Weapon_Longsword','Melee Main Weapon'));
 assert.equal(blade.enhancement,1);assert.deepEqual(blade.bonusDamage,{die:'1d4',type:'psychic'});
 assert.equal(weaponProperties(item('MAG_BG_DragonsBreath_Glaive','Melee Main Weapon')).enhancement,2);
});
test('Fistbreaker Helm grants initiative and spell DC, not spell attack, only while equipped',()=>{
 const helm=item('MAG_BarbMonk_Cloth_Hat_A_1_Late','Helmet');
 const c={abilities:{str:8,dex:16,con:14,int:8,wis:10,cha:20},equipped:[helm]};
 const s=make(c);assert.equal(s.initiative,4);assert.equal(s.spellDcBonus,1);assert.equal(s.spellAttackBonus,0);
 const carried=make({...c,equipped:[],carried:[helm]});assert.equal(carried.initiative,3);assert.equal(carried.spellDcBonus,0);
 const wrongSlot=make({...c,equipped:[{...helm,slot:'Inventory'}]});assert.equal(wrongSlot.initiative,3);assert.equal(wrongSlot.spellDcBonus,0);
 assert.equal(make({...c,initiative:4}).initiative,4,'a saved initiative total must not receive the bonus twice');
 assert.equal(make({...c,abilities:{...c.abilities,dex:null}}).initiative,'','unknown Dexterity must not produce an estimated initiative');
});
test('Swiresy Shoes and Boots of Striding add their skill bonuses only while worn',()=>{
 assert.equal(make({equipped:[item('MAG_Jumping_Shoes','Boots')]}).skillBonuses.Acrobatics,1);
 assert.equal(make({equipped:[item('MAG_Paladin_MomentumOnConcentration_Boots','Boots')]}).skillBonuses.Athletics,1);
 assert.equal(make({carried:[item('MAG_Jumping_Shoes','Boots')]}).skillBonuses.Acrobatics,0);
});
test('Jhannyl’s Gloves add +1 to every save and stack with Moon Devotion Robe',()=>{
 const s=make({equipped:[item('MAG_Harpers_JhannylGloves','Gloves'),item('MAG_Selunite_Isobel_Robe','Breast')]});
 assert.ok(Object.values(s.saveBonuses).every(v=>v===2));assert.match(s.features,/Defy Villainy/);
});
test('Hellrider Longbow is a +1 longbow granting +3 initiative from the ranged slot only',()=>{
 const bow=item('MAG_WYR_Hellrider_Longbow','Ranged Main Weapon');
 const s=make({equipped:[bow]});
 assert.equal(s.initiative,8);assert.match(s.attacks,/1d8 \+6 piercing/);assert.match(s.features,/Faerie Fire/);
 assert.equal(make({carried:[bow]}).initiative,5);
});
test('conditional item effects are described without changing totals',()=>{
 const s=make({equipped:[item('MAG_OfArcanicDefense_Robe','Breast'),item('MAG_Harpers_RingOfTwilight','Ring 1'),item('MAG_PHB_CloakOfDisplacement_Cloak','Cloak'),item('FOR_NightWalkers','Boots'),item('MAG_Healer_HealSelf_Helmet','Helmet'),item('UND_KC_RingOfAbsolute','Ring 2')]});
 for(const text of ['Exquisite Focus','Treader by Twilight','Displacement','Night Walker','Crowning Glory','Absolute’s Tempest'])assert.match(s.features,new RegExp(text));
 assert.equal(s.ac,15);assert.deepEqual(s.saveBonuses,{str:0,dex:0,con:0,int:0,wis:0,cha:0});
});
test('item charge markers stay off conditions and interrupt resources read as names',()=>{
 const s=make({statuses:[{id:'MAG_PARALYZING_CRITICAL_OWNER'},{id:'MAG_ABSORB_ELEMENT_RESOURCE'},{id:'LONGSTRIDER'}],
  resources:[{name:'Interrupt_MistyEscape',guid:'a',current:1,max:1},{name:'Interrupt_TAD_PsionicDominance_Charge',guid:'b',current:1,max:1}]});
 assert.equal(s.conditions,'Longstrider');
 assert.match(s.resources,/^Misty Escape: 1 \/ 1$/m);assert.match(s.resources,/^Psionic Dominance charge: 1 \/ 1$/m);
});
test('unarmoured defensive equipment stacks with Mage Armour, with conditional AC kept separate',()=>{
 const c={level:9,class_levels:[{name:'Warlock',level:9}],abilities:{str:8,dex:16,con:14,int:8,wis:10,cha:20},equipped:[item('MAG_OfArcanicDefense_Robe','Breast'),item('UNI_ARM_OfDefense_Gloves','Gloves'),item('MAG_Barbarian_BoneSpike_Shoes','Boots'),item('MAG_Harpers_RingOfTwilight','Ring 1')],statuses:[{id:'MAGE_ARMOR'},{id:'MAG_ARCANIC_DEFENSE_TECHNICAL'},{id:'MAG_HARPERS_TWILIGHT_HIDE_TECHNICAL'}]};
 const base=make(c);assert.equal(base.ac,19);assert.ok(Object.values(base.saveBonuses).every(n=>n===1));
 const focus=make({...c,concentration:{id:'Target_Hex'}});assert.equal(focus.ac,20);assert.ok(Object.values(focus.saveBonuses).every(n=>n===6));
 assert.equal(make({...c,concentration:{id:'Target_Hex'},statuses:[...c.statuses,{id:'MAG_HARPERS_TWILIGHT_HIDE'}]}).ac,21);
 assert.equal(make({...c,statuses:[...c.statuses,{id:'MAG_HARPERS_TWILIGHT_HIDE'}]}).ac,20);
 assert.equal(make({...c,statuses:[{id:'MAG_ARCANIC_DEFENSE'}]}).ac,17);
 const shield=make({...c,equipped:[...c.equipped,item('ARM_Shield','Melee Offhand Weapon')]});assert.equal(shield.ac,18);assert.ok(Object.values(shield.saveBonuses).every(n=>n===0));
 const armour=make({...c,equipped:[...c.equipped.filter(i=>i.slot!=='Breast'),{...item('ARM_Leather_Body','Breast'),name:'Leather Armour'}]});assert.equal(armour.ac,14);assert.ok(Object.values(armour.saveBonuses).every(n=>n===0));
 const noBoots=make({...c,equipped:c.equipped.filter(i=>i.slot!=='Boots'),carried:[item('MAG_Barbarian_BoneSpike_Shoes','Boots')]});assert.equal(noBoots.ac,18);
});
test('Agility armour, Sentinel Shield and Dead Shot use exact rules, not name enhancements',()=>{
 const equipped=[item('MAG_EndGame_HalfPlate','Breast'),item('MAG_PHB_Sentinel_Shield','Melee Offhand Weapon'),item('MAG_DeadShot_Longbow','Ranged Main Weapon')];
 const c={level:10,class_levels:[{name:'Fighter',level:10}],proficiency_bonus:4,selected_passives:['FightingStyle_Archery'],equipped};
 const result=adaptCharacter({characters:[{name:'Test',abilities:{str:10,dex:20,con:16,int:8,wis:14,cha:8},equipment_proficiencies:['Martial Weapons'],...c}]},0,blank());
 assert.equal(result.sheet.ac,24);assert.equal(result.sheet.initiative,8);
 assert.ok(Object.values(result.sheet.saveBonuses).every(n=>n===2));
 assert.match(result.sheet.attacks,/\+17 to hit, 1d8 \+7 piercing/);
 assert.match(result.sheet.attacks,/subtract 4 from attack bonus with disadvantage/);
 assert.doesNotMatch(result.warnings.join('\n'),/understated|enhancement/);
 const untrained=make({proficiency_bonus:4,equipped:[equipped[2]],equipment_proficiencies:[]});
 assert.match(untrained.attacks,/\+11 to hit/);
 const carried=make({carried:equipped});assert.equal(carried.ac,15);assert.equal(carried.initiative,5);assert.ok(Object.values(carried.saveBonuses).every(n=>n===0));
});
test('Sword of the Emperor has +2 enchantment and conditional effects, not unconditional save boosts',()=>{
 const sword=item('LOW_Elfsong_EmperorSword_LongSword','Melee Main Weapon');
 const c={abilities:{str:8,dex:14,con:16,int:8,wis:19,cha:10},proficiency_bonus:4,equipped:[sword,item('MAG_Ketheric_Shield','Melee Offhand Weapon')]};
 const s=make(c);assert.match(s.attacks,/\+5 to hit, 1d8 \+1 slashing/);
 assert.match(s.features,/\+2 to saving throws against spells/);assert.match(s.features,/shapeshifters or polymorphed/);
 assert.ok(Object.values(s.saveBonuses).every(n=>n===0));
 const twoHanded=make({...c,equipped:[sword]});assert.match(twoHanded.attacks,/1d10 \+1 slashing/);
 const carried=make({...c,equipped:[],carried:[sword]});assert.doesNotMatch(carried.features,/Magical Durability/);
});
test('Birthright preserves final saved Charisma, and confers no effect while carried',()=>{
 const hat=item('MAG_GleamingSorcery_Hat','Helmet');
 for(const cha of [20,22,24]){
  const s=make({abilities:{str:8,dex:16,con:14,int:8,wis:10,cha},equipped:[hat]});
  assert.equal(s.abilities.cha,cha);assert.match(s.features,/Birthright: \+2 Charisma/);
 }
 const s=make({abilities:{str:8,dex:16,con:14,int:8,wis:10,cha:20},carried:[hat]});
 assert.equal(s.abilities.cha,20);assert.doesNotMatch(s.features,/Birthright:/);
});
test('Spineshudder adds its ranged spell damage trigger only in the amulet slot',()=>{
 const amulet=item('MAG_Thunder_ReverberationOnRangeSpellDamage_Amulet','Amulet');
 assert.match(make({equipped:[amulet]}).features,/ranged spell attack inflicts 2 turns of Reverberation/);
 assert.doesNotMatch(make({carried:[amulet]}).features,/Crackling Resonance/);
 assert.doesNotMatch(make({equipped:[{...amulet,slot:'Ring 1'}]}).features,/Crackling Resonance/);
});
