import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {adaptCharacter} from '../src/save-adapter.mjs';
import {weaponProperties,weaponEnhancementUnknown} from '../src/weapon-data.mjs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const blank=Function('return ('+html.match(/const blank=\(\)=>\((.+)\);/)[1]+')');
const sheet=c=>adaptCharacter({characters:[{name:'Test',level:5,class_levels:[{name:'Warlock',level:5}],abilities:{str:8,dex:16,con:14,int:8,wis:10,cha:19},proficiency_bonus:3,equipment_proficiencies:['Simple Weapons','Martial Weapons'],...c}]},0,blank());
test('Sword of Screams is an unenchanted rapier with a psychic rider',()=>{
 const item={name:'Localised name',stats:'UND_Nere_Sword',slot:'Melee Main Weapon'};
 assert.equal(weaponProperties(item).name,'Rapier');assert.equal(weaponEnhancementUnknown(item),false);
 const r=sheet({equipped:[item]});assert.match(r.sheet.attacks,/\+6 to hit, 1d8 \+3 piercing \+ 1d4 psychic/);assert.deepEqual(r.warnings, r.warnings.filter(w=>!w.includes('Localised name')));
});
test('Melf staff applies weapon and spell bonuses only while equipped',()=>{
 const item={name:"Melf's First Staff",stats:'MAG_BasicEnchanted_Quarterstaff',slot:'Melee Main Weapon'};
 let r=sheet({equipped:[item]});assert.match(r.sheet.attacks,/Melf's First Staff: \+3 to hit, 1d8 bludgeoning/);
 assert.equal(r.sheet.spellAttackBonus,1);assert.equal(r.sheet.spellDcBonus,1);assert.equal(weaponEnhancementUnknown(item),false);
 r=sheet({equipped:[item,{name:'Shield',stats:'ARM_Shield',slot:'Melee Offhand Weapon'}]});assert.match(r.sheet.attacks,/1d6 bludgeoning/);
 r=sheet({equipped:[],carried:[item]});assert.equal(r.sheet.spellAttackBonus,0);assert.equal(r.sheet.spellDcBonus,0);assert.equal(r.sheet.attacks,'');
});
test('Greatclub is a two-handed simple 1d8 bludgeoning weapon',()=>{
 const r=sheet({equipped:[{name:'Greatclub',stats:'WPN_Greatclub',slot:'Melee Main Weapon'}]});
 assert.match(r.sheet.attacks,/Greatclub: \+2 to hit, 1d8 -1 bludgeoning/);
 assert.ok(!r.warnings.some(w=>w.includes('No attack line')));
});
test('Infernal Rapier raises spell save DC by one',()=>{
 const r=sheet({equipped:[{name:'Infernal Rapier',stats:'ORI_Wyll_Infernal_Rapier',slot:'Melee Main Weapon'}]});
 assert.equal(r.sheet.spellDcBonus,1);assert.equal(r.sheet.spellAttackBonus,0);
});

test('Ambusher and Warmaster apply equipped bonuses without unconditional streak damage',()=>{
 const sword={name:'Ambusher',stats:'MAG_Ambusher_Shortsword',slot:'Melee Main Weapon'};
 const gloves={name:'Gauntlets',stats:'MAG_OfWarMaster_Gloves',slot:'Gloves'};
 const bow={name:'Shortbow',stats:'WPN_Shortbow',slot:'Ranged Main Weapon'};
 const r=sheet({equipped:[sword,gloves,bow]}).sheet;
 assert.match(r.attacks,/Ambusher: \+8 to hit, 1d6 \+4 piercing/);
 assert.match(r.attacks,/Shortbow: \+7 to hit, 1d6 \+3 piercing/);
 assert.equal(r.initiative,4);assert.equal(r.spellAttackBonus,1);assert.equal(r.spellDcBonus,0);
 assert.match(r.features,/advantage on Perception/);assert.match(r.features,/including ranged/);assert.match(r.features,/have not taken a turn yet/);assert.match(r.features,/disadvantage on saves/);
 assert.doesNotMatch(r.attacks,/necrotic/);assert.equal(weaponEnhancementUnknown(sword),false);
 const carried=sheet({equipped:[bow],carried:[sword,gloves]}).sheet;
 assert.equal(carried.initiative,3);assert.equal(carried.spellAttackBonus,0);assert.doesNotMatch(carried.features,/Sentinel Weapon|Heightened Manoeuvre/);
 assert.equal(sheet({equipped:[sword],initiative:9}).sheet.initiative,9);
});
