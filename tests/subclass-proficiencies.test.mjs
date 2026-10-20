import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applySavedBuild} from '../src/build-rules.mjs';
const names={bard:'Bard',valour:'ValorCollege',swords:'SwordsCollege',lore:'LoreCollege'};
const build=sub=>{const c={race:'Tiefling_Zariel'};applySavedBuild(c,{levels:[['bard','bard'],['bard','bard'],['bard',sub]],skills:null},names);return c.equipment_proficiencies;};
test('College of Valour grants medium armour, shields and martial weapons',()=>{
 const p=build('valour');for(const x of ['Medium Armour','Shields','Martial Weapons'])assert.ok(p.includes(x),x);
});
test('College of Swords grants medium armour and scimitars only',()=>{
 const p=build('swords');assert.ok(p.includes('Medium Armour'));assert.ok(p.includes('Scimitars'));assert.ok(!p.includes('Shields'));
});
test('College of Lore grants no extra armour',()=>{
 assert.ok(!build('lore').includes('Medium Armour'));
});
