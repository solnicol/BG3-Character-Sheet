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
