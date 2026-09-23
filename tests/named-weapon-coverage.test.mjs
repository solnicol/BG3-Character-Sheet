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
