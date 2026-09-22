import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {adaptCharacter} from '../src/save-adapter.mjs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const blank=Function('return ('+html.match(/const blank=\(\)=>\((.+)\);/)[1]+')');
function character(){return {name:'Any monk',level:4,class_levels:[{name:'Monk',level:4}],abilities:{str:10,dex:18,con:14,int:8,wis:16,cha:8},equipment_proficiencies:['Simple Weapons','Shortswords','Longswords'],equipped:[{name:"Nature's Snare",stats:'DEN_TunnelStaff',slot:'Melee Main Weapon'}]};}
const attacks=c=>adaptCharacter({characters:[c]},0,blank()).sheet.attacks;
test('Monk quarterstaff and unarmed attacks use higher Dexterity',()=>{
 const c=character();assert.match(attacks(c),/Nature's Snare: \+6 to hit, 1d8 \+4 bludgeoning/);
 assert.match(attacks(c),/Unarmed strike: \+6 to hit, 1d6 \+4 bludgeoning/);
 c.equipped.push({name:'Shield',stats:'ARM_Shield',slot:'Melee Offhand Weapon'});
 assert.match(attacks(c),/Nature's Snare: \+6 to hit, 1d6 \+4 bludgeoning/);
 c.abilities.str=20;assert.match(attacks(c),/Unarmed strike: \+7 to hit, 1d6 \+5 bludgeoning/);
});
test('Monk weapon eligibility respects proficiency and excludes heavy and ranged weapons',()=>{
 const c=character();c.equipped=[{name:'Longsword',slot:'Melee Main Weapon'}];
 assert.match(attacks(c),/Longsword: \+6 to hit, 1d10 \+4 slashing/);
 c.equipment_proficiencies=['Simple Weapons'];assert.match(attacks(c),/Longsword: \+0 to hit, 1d10 slashing/);
 c.equipment_proficiencies.push('Martial Weapons');c.equipped=[{name:'Greatsword',slot:'Melee Main Weapon'}];
 assert.match(attacks(c),/Greatsword: \+2 to hit, 2d6 slashing/);
 c.equipped=[{name:'Hand Crossbow',slot:'Ranged Main Weapon'}];c.class_levels=[{name:'Monk',level:9}];c.level=9;
 assert.match(attacks(c),/Hand Crossbow: \+8 to hit, 1d6 \+4 piercing/);
});
test('Martial Arts upgrades smaller dice at Monk levels 3 and 9 only',()=>{
 for(const [level,die] of [[1,4],[2,4],[3,6],[8,6],[9,8],[12,8]]){
  const c=character();c.level=level;c.class_levels=[{name:'Monk',level}];c.equipped=[{name:'Dagger',slot:'Melee Main Weapon'}];
  assert.match(attacks(c),new RegExp(`Dagger: .*1d${die} \\+4 piercing`));
  assert.match(attacks(c),new RegExp(`Unarmed strike: .*1d${die} \\+4 bludgeoning`));
 }
 const c=character();c.level=10;c.class_levels=[{name:'Monk',level:2},{name:'Fighter',level:8}];
 assert.match(attacks(c),/Unarmed strike: \+8 to hit, 1d4 \+4 bludgeoning/);
 c.class_levels=[{name:'Fighter',level:10}];assert.doesNotMatch(attacks(c),/Unarmed strike/);
 assert.match(attacks(c),/Nature's Snare: \+4 to hit, 1d8 bludgeoning/);
});
