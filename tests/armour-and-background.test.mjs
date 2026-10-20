import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {adaptCharacter} from '../src/save-adapter.mjs';
import {applySavedBuild} from '../src/build-rules.mjs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const blank=Function('return ('+html.match(/const blank=\(\)=>\((.+)\);/)[1]+')');
const sheet=c=>adaptCharacter({characters:[{name:'T',level:5,abilities:{str:16,dex:14,con:14,int:10,wis:10,cha:16},equipment_proficiencies:[],equipped:[],...c}]},0,blank());
test('Draconic Resilience gives 13 + Dexterity unarmoured and keeps it with a shield',()=>{
 const c={class_levels:[{name:'Sorcerer',subclass:'DraconicBloodline',level:5}]};
 assert.equal(sheet(c).sheet.ac,15);
 assert.equal(sheet({...c,equipped:[{name:'Shield',stats:'ARM_Shield',slot:'Melee Offhand Weapon'}]}).sheet.ac,17);
 assert.equal(sheet({...c,equipped:[{name:'Leather Armour',stats:'ARM_Leather_Body',slot:'Breast'}]}).sheet.ac,13);
 assert.equal(sheet({class_levels:[{name:'Sorcerer',subclass:'StormSorcery',level:5}]}).sheet.ac,12);
 assert.equal(sheet({...c,statuses:[{id:'MAGE_ARMOR'}]}).sheet.ac,15);
});
test('magic armour known only by family warns that its class may be low',()=>{
 const r=sheet({class_levels:[{name:'Paladin',level:5}],equipped:[{name:'Armour of Persistence',stats:'MAG_EndGame_Plate_Armor',slot:'Breast'}]});
 assert.equal(r.sheet.ac,18);assert.ok(r.warnings.some(w=>/understated.*Armour of Persistence/.test(w)));
 for(const item of [{name:'Plate Armour',stats:'ARM_Plate_Body',slot:'Breast'},{name:'Plate Armour +1',stats:'ARM_Plate_Body_1',slot:'Breast'},{name:"Reaper's Embrace",stats:'MOO_Ketheric_Armor',slot:'Breast'}])
  assert.ok(!sheet({class_levels:[{name:'Paladin',level:5}],equipped:[item]}).warnings.some(w=>/understated/.test(w)),item.name);
 const s=sheet({class_levels:[{name:'Fighter',level:5}],equipped:[{name:'Adamantine Shield',stats:'MAG_MeleeDebuff_AttackDebuff1_OnDamage_Shield',slot:'Melee Offhand Weapon'}]});
 assert.ok(s.warnings.some(w=>/understated.*Adamantine Shield/.test(w)));
});
const names={rogue:'Rogue'};
const build=background=>{const c={race:'Human'};applySavedBuild(c,{levels:[['rogue','rogue']],skills:['Acrobatics','Insight'],expertise:[],background},names);return c;};
test('Haunted One adds Intimidation and Medicine',()=>{
 const c=build('20d865ea-03bd-47bf-97d3-777e1b36b073');
 assert.equal(c.background,'Haunted One');assert.deepEqual(c.skill_proficiencies.sort(),['Acrobatics','Insight','Intimidation','Medicine']);assert.equal(c.skills_note,undefined);
});
test('an unknown background keeps chosen skills and warns',()=>{
 const c=build('00000000-0000-0000-0000-000000000000');
 assert.equal(c.background,null);assert.deepEqual(c.skill_proficiencies.sort(),['Acrobatics','Insight']);
 const r=sheet({class_levels:[{name:'Rogue',level:5}],skill_proficiencies:c.skill_proficiencies,skills_note:c.skills_note});
 assert.equal(r.sheet.skills.Acrobatics,1);assert.ok(r.warnings.some(w=>/^Skills: background not recognised/.test(w)));
});
test('items confirmed against in-game AC raise no understated warning',()=>{
 for(const [stats,slot,name] of [['GOB_Priest_Shield','Melee Offhand Weapon',"Absolute's Warboard"],['MAG_Safeguard_Shield','Melee Offhand Weapon','Safeguard Shield'],['GOB_DrowCommander_Leather_Armor','Breast','Spidersilk Armour'],['UNI_Leather_Halsin','Breast','Druid Leather Armour'],['UNI_Leather_Jaheira','Breast','Leather Armour']])
  assert.ok(!sheet({class_levels:[{name:'Fighter',level:5}],equipped:[{name,stats,slot}]}).warnings.some(w=>/understated/.test(w)),name);
 // Bob: Spidersilk Armour with Dexterity 16 reads 15 in game.
 assert.equal(sheet({level:6,class_levels:[{name:'Warlock',level:6}],abilities:{str:8,dex:16,con:14,int:8,wis:10,cha:19},equipped:[{name:'Spidersilk Armour',stats:'GOB_DrowCommander_Leather_Armor',slot:'Breast'}]}).sheet.ac,15);
});
