import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {adaptCharacter,characterClasses} from '../src/save-adapter.mjs';
const source=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const blank=Function('return ('+source.match(/const blank=\(\)=>\((.+)\);/)[1]+')');
const report=JSON.parse(readFileSync(new URL('../vendor/bg3-savefile-parser/tests/parity/quicksave_469.expected.json',import.meta.url)));
test('real report imports race, HP, abilities, feats and inventory with derived proficiencies',()=>{
 const i=report.characters.findIndex(c=>c.name==='Shadowheart'),c=report.characters[i];
 const {sheet}=adaptCharacter(report,i,blank());
 assert.equal(sheet.race,'Half-Elf');assert.equal(sheet.subrace,'High Half-Elf');assert.deepEqual(sheet.abilities,c.abilities);
 assert.equal(sheet.hp,c.hp.current);assert.equal(sheet.maxHp,c.hp.max);assert.equal(sheet.speed,9);
 assert.equal(sheet.classes[0].level,9);assert.equal(sheet.skills.Perception,-1);assert.equal(sheet.saves.wis,null);
 // Luminous Armour is not a recognised armour type, so AC is withheld rather
 // than silently scored as unarmoured. See the regression tests below.
 assert.equal(sheet.ac,'');assert.match(sheet.importSummary,/Luminous Armour is not a recognised armour type/);
 assert.equal(sheet.initiative,2);assert.match(sheet.features,/War Caster/);
 assert.match(sheet.equipment,/EQUIPPED/);assert.match(sheet.spells,/Cantrip/);
 assert.doesNotMatch(sheet.resources,/Interrupt_/);
 assert.equal(sheet.story,'');assert.equal(sheet.notes,'');
 assert.equal(sheet.slots[3],'2 / 3');assert.equal(sheet.slots[4],'1 / 1');
});
test('pact magic remains separate from normal spell slots',()=>{const {sheet}=adaptCharacter(report,report.characters.findIndex(c=>c.name==='Wyll'),blank());assert.doesNotMatch(sheet.resources,/Warlock Spell Slot/);assert.deepEqual(sheet.slots,Array(6).fill(''));assert.deepEqual(sheet.pactSlots,['','','','','2 / 2','']);});
test('missing ability scores stay unknown and unrecognised race is explicit',()=>{const r=structuredClone(report);r.characters[0].abilities=null;r.characters[0].race='ModdedRace';const {sheet}=adaptCharacter(r,0,blank());assert.equal(sheet.abilities.str,'');assert.equal(sheet.race,'Not recovered');assert.match(sheet.importSummary,/not recovered/);});
test('multiclass requires recovered individual levels; never divides a total',()=>{
 const c={level:12,classes:[{Main:'Fighter'},{Main:'Rogue'}]};assert.throws(()=>characterClasses(c),/multiclass levels/);
 c.class_levels=[{name:'Fighter',subclass:'BattleMaster',level:10},{name:'Rogue',subclass:'Thief',level:2}];assert.deepEqual(characterClasses(c).map(c=>c.level),[10,2]);
 c.class_levels[1].level=3;assert.throws(()=>characterClasses(c),/incomplete/);
});
test('does not mix data from the previous sheet',()=>{const template=blank();const a=adaptCharacter(report,0,template).sheet;const b=adaptCharacter(report,2,template).sheet;assert.notEqual(a.name,b.name);assert.equal(template.name,'Tav');});
test('enhanced medium armour contributes its item bonus to AC',()=>{const r=structuredClone(report);const i=r.characters.findIndex(c=>c.name==='Shadowheart');r.characters[i].equipped=[{stats:'ARM_ScaleMail_Body_1',name:'Scale Mail +1',slot:'Body',count:1}];const s=adaptCharacter(r,i,blank()).sheet;assert.equal(s.ac,17);});
test('breastplate plus shield includes the enhancement and shield bonus',()=>{const r=structuredClone(report);const i=r.characters.findIndex(c=>c.name==='Shadowheart');r.characters[i].abilities.dex=14;r.characters[i].equipped=[{stats:'ARM_Breastplate_Body_1',name:'Breastplate +1',slot:'Body',count:1},{stats:'MAG_Safeguard_Shield',name:'Safeguard Shield',slot:'Shield',count:1}];const s=adaptCharacter(r,i,blank()).sheet;assert.equal(s.ac,19);});
test('named light armour is included in the shared AC calculation',()=>{const r=structuredClone(report);const i=r.characters.findIndex(c=>c.name==='Shadowheart');r.characters[i].abilities.dex=13;r.characters[i].equipped=[{stats:'GOB_DrowCommander_Leather_Armor',name:'Spidersilk Armour',slot:'Body',count:1}];const s=adaptCharacter(r,i,blank()).sheet;assert.equal(s.ac,13);});
test('spell sources are merged into one orderly entry',()=>{const r=structuredClone(report);r.characters[0].spells=[{id:'X',name:'Guiding Bolt',category:'spell',level:1,prepared:false},{id:'X',name:'Guiding Bolt',category:'spell',level:1,prepared:true}];const s=adaptCharacter(r,0,blank()).sheet;assert.equal((s.spells.match(/Guiding Bolt/g)||[]).length,1);assert.match(s.spells,/prepared/);});
test('spells are ordered by level then name',()=>{const r=structuredClone(report);r.characters[0].spells=[{id:'b',name:'Zeta',category:'spell',level:1,prepared:true},{id:'a',name:'Alpha',category:'spell',level:0,prepared:true},{id:'c',name:'Beta',category:'spell',level:1,prepared:true}];const s=adaptCharacter(r,0,blank()).sheet.spells.split('\n');assert.deepEqual(s.map(x=>x.split(': ')[1].split(' [')[0]),['Alpha','Beta','Zeta']);});
test('combat actions are kept out of the spell list',()=>{const r=structuredClone(report);r.characters[0].spells=[{id:'h',name:'Heroism',category:'spell',level:1,prepared:true},{id:'a',name:'Action Surge',category:'spell',level:null,prepared:true}];const s=adaptCharacter(r,0,blank()).sheet;assert.match(s.spells,/Heroism/);assert.doesNotMatch(s.spells,/Action Surge/);assert.match(s.features,/Action Surge/);});
test('inventory is organised and attacks contain derived weapon entries',()=>{const r=structuredClone(report);const i=r.characters.findIndex(c=>c.name==='Shadowheart');const s=adaptCharacter(r,i,blank()).sheet;assert.match(s.equipment,/EQUIPPED/);assert.match(s.equipment,/CARRIED/);assert.equal(typeof s.attacks,'string');});
test('equipment ownership is preserved without item-name substitutions',()=>{
 const r=structuredClone(report),c=r.characters[0];
 c.equipped=[{stats:'ARM_BracersOfDefence',name:'Bracers of Defence',slot:'Gloves',count:1}];
 c.carried=[{stats:'MAG_GlovesOfArchery',name:'Gloves of Archery',count:1}];
 const s=adaptCharacter(r,0,blank()).sheet;
 assert.match(s.equipment,/EQUIPPED\nBracers of Defence \[Gloves\]/);
 assert.match(s.equipment,/Bracers of Defence/);
 assert.match(s.equipment,/CARRIED[\s\S]*Gloves of Archery/);
});
test('torches remain in their dedicated utility slot',()=>{
 const r=structuredClone(report),c=r.characters[0];
 c.equipped=[{stats:'WPN_Torch',name:'Torch',slot:'Melee Main Weapon',count:1}];
 const s=adaptCharacter(r,0,blank()).sheet;
 assert.match(s.equipment,/Torch \[Torch\]/);
 assert.doesNotMatch(s.attacks,/Torch/);
});
test('weapon bonuses use the saved proficiency bonus when present',()=>{
 const r=structuredClone(report),c=r.characters[0];
 c.equipment_proficiencies=['Simple Weapons','Martial Weapons'];c.proficiency_bonus=4;
 c.abilities={str:10,dex:16,con:14,int:10,wis:10,cha:8};
 c.equipped=[{stats:'WPN_Rapier_1',name:'Rapier +1',slot:'Melee Main Weapon',count:1}];
 const s=adaptCharacter(r,0,blank()).sheet;
 assert.match(s.attacks,/Rapier \+1: \+8 to hit/);
});
test('rapiers use the correct d8 weapon die',()=>{
 const r=structuredClone(report),c=r.characters[0];
 c.equipment_proficiencies=['Simple Weapons','Martial Weapons'];c.proficiency_bonus=2;
 c.abilities={str:10,dex:16,con:14,int:10,wis:10,cha:8};
 c.equipped=[{stats:'WPN_Rapier_1',name:'Rapier +1',slot:'Melee Main Weapon',count:1}];
 const s=adaptCharacter(r,0,blank()).sheet;
 assert.match(s.attacks,/Rapier \+1: \+6 to hit, 1d8 \+4 piercing/);
});
test('attack damage includes ability and enhancement modifiers',()=>{const r=structuredClone(report);const i=r.characters.findIndex(c=>c.name==='Shadowheart');r.characters[i].equipment_proficiencies=['Martial Weapons'];r.characters[i].abilities={str:10,dex:17,con:14,int:10,wis:18,cha:8};r.characters[i].equipped=[{stats:'WPN_HeavyCrossbow_1',name:'Heavy Crossbow +1',slot:'Ranged Main Weapon',count:1}];const s=adaptCharacter(r,i,blank()).sheet;assert.match(s.attacks,/\+8 to hit, 1d10 \+4 piercing/);});

test('heavy armour ignores Dexterity and light armour keeps the full modifier',()=>{
 for(const [name,ac] of [['Plate Armour',18],['Leather Armour',14],['Half Plate',17]]) {
 const r=structuredClone(report),c=r.characters[0];c.abilities.dex=16;c.equipped=[{name,stats:'ARM_Test',slot:'Breast'}];
 assert.equal(adaptCharacter(r,0,blank()).sheet.ac,ac);
 }
});
test('adapting is repeatable and preserves the parser report and inventory',()=>{
 const r=structuredClone(report),c=r.characters[0];c.equipped=[{name:'Torch',stats:'WPN_Torch',slot:'Torch'}];c.carried=[{name:'Rapier +1',stats:'WPN_Rapier_1'}];
 const before=structuredClone(r);const a=adaptCharacter(r,0,blank()).sheet,b=adaptCharacter(r,0,blank()).sheet;
 assert.deepEqual(r,before);assert.deepEqual(a,b);assert.match(a.equipment,/Torch/);assert.match(a.equipment,/CARRIED\nRapier/);assert.doesNotMatch(a.attacks,/Rapier/);
});
test('ordinary and pact slots at the same level survive together',()=>{
 const r=structuredClone(report);r.characters[0].resources=[{guid:'d136c5d9-0ff0-43da-acce-a74a07f8d6bf',level:2,current:3,max:3},{name:'Warlock Spell Slot',level:2,current:2,max:2}];
 const s=adaptCharacter(r,0,blank()).sheet;assert.equal(s.slots[1],'3 / 3');assert.equal(s.pactSlots[1],'2 / 2');
});
test('weapon properties, finesse and enchantments are not generic d8 piercing',()=>{
 const r=structuredClone(report),c=r.characters[0];c.abilities={str:18,dex:16};c.proficiency_bonus=2;c.equipment_proficiencies=['Simple Weapons'];c.equipped=[{name:'Dagger +2',stats:'WPN_Dagger_2',slot:'Melee Main Weapon'},{name:'Mace',stats:'WPN_Mace',slot:'Melee Offhand Weapon'}];
 const s=adaptCharacter(r,0,blank()).sheet;assert.match(s.attacks,/Dagger \+2: \+8 to hit, 1d4 \+6 piercing/);assert.match(s.attacks,/Mace: \+6 to hit, 1d6 bludgeoning/);
});
import {ownedStackCount} from '../src/stack-count.mjs';
test('gold counts unique owned instances, follows changing amounts and rejects missing ownership',()=>{
 const amounts=new Map([['bob',1735],['neith',160],['savros',364],['second',5]]);
 assert.equal(ownedStackCount(['bob'],amounts),1735);amounts.set('bob',2001);assert.equal(ownedStackCount(['bob','bob','second'],amounts),2006);
 assert.equal(ownedStackCount([],amounts),null);assert.equal(ownedStackCount(['missing'],amounts),null);assert.equal(ownedStackCount(['neith'],amounts),160);
});
test('saved Archery, equipped gloves and All In toggle apply distinct effects',()=>{
 const r=structuredClone(report),c=r.characters[0];c.abilities={str:10,dex:17};c.proficiency_bonus=2;c.equipment_proficiencies=['Martial Weapons'];c.selected_passives=['FightingStyle_Archery'];c.equipped=[{name:'Heavy Crossbow +1',slot:'Ranged Main Weapon'},{name:'Gloves of Archery',stats:'UNI_ARM_OfArchery_Gloves',slot:'Gloves'}];c.passive_toggles={Sharpshooter_AllIn:false};
 assert.match(adaptCharacter(r,0,blank()).sheet.attacks,/\+8 to hit, 1d10 \+6 piercing/);
 c.passive_toggles.Sharpshooter_AllIn=true;
 assert.match(adaptCharacter(r,0,blank()).sheet.attacks,/\+3 to hit, 1d10 \+16 piercing/);
});
test('AC is derived from the live armour loadout when the saved snapshot is stale',()=>{
 const r=structuredClone(report),c=r.characters[0];c.abilities={str:8,dex:13};c.armour_class=11;c.equipped=[{name:'Spidersilk Armour',slot:'Breast'}];
 assert.equal(adaptCharacter(r,0,blank()).sheet.ac,13);
});

// Regression tests for the armour class defects found in b744622.
test('AC uses the real body slot, never a cosmetic VanityBody overlay',()=>{
 const r=structuredClone(report),c=r.characters[0];c.abilities={str:10,dex:14,con:10,int:10,wis:10,cha:10};
 c.equipped=[{name:'Comfortable Autumnal Outfit',stats:'ARM_Vanity_Body_Citizen_Purple',slot:'VanityBody'},
             {name:'Adamantine Splint Armour',stats:'MAG_OnDamage_SplintMail',slot:'Breast'}];
 // Splint is heavy: base 17 and no Dexterity, not 10 + 2 from the outfit.
 assert.equal(adaptCharacter(r,0,blank()).sheet.ac,17);
});
test('only a shield in a shield or offhand slot adds the shield bonus',()=>{
 const r=structuredClone(report),c=r.characters[0];c.abilities={str:10,dex:14,con:10,int:10,wis:10,cha:10};
 c.equipped=[{name:'Leather Armour',stats:'ARM_Leather',slot:'Breast'},
             {name:'Ring of Mind-Shielding',stats:'UNI_UND_RingOfMindShielding',slot:'Ring'}];
 assert.equal(adaptCharacter(r,0,blank()).sheet.ac,13);
 c.equipped.push({name:'Shield of Devotion',stats:'MAG_BG_OfDevotion_Shield',slot:'Melee Offhand Weapon'});
 assert.equal(adaptCharacter(r,0,blank()).sheet.ac,15);
});
test('unrecognised body armour withholds AC and explains why',()=>{
 const r=structuredClone(report),c=r.characters[0];c.abilities={str:10,dex:14,con:10,int:10,wis:10,cha:10};
 c.equipped=[{name:'Luminous Armour',stats:'MAG_Radiant_RadiatingOrb_Armor',slot:'Breast'}];
 const s=adaptCharacter(r,0,blank()).sheet;
 assert.equal(s.ac,'');
 assert.match(s.importSummary,/Luminous Armour is not a recognised armour type/);
});
test('a genuinely unarmoured character still gets a calculated AC',()=>{
 const r=structuredClone(report),c=r.characters[0];c.abilities={str:10,dex:16,con:10,int:10,wis:10,cha:10};
 c.equipped=[{name:'Gloves of Thievery',stats:'MAG_PHB_OfThievery_Gloves',slot:'Gloves'}];
 const s=adaptCharacter(r,0,blank()).sheet;
 assert.equal(s.ac,13);
 assert.doesNotMatch(s.importSummary,/not a recognised armour type/);
});
test('accessories are never mistaken for body armour',()=>{
 const r=structuredClone(report),c=r.characters[0];c.abilities={str:10,dex:14,con:10,int:10,wis:10,cha:10};
 c.equipped=[{name:'Lute',stats:'ARM_Instrument_Lute',slot:'MusicalInstrument'},
             {name:'Circlet of Blasting',stats:'ARM_CircletOfBlasting',slot:'Helmet'},
             {name:'Leather Boots',stats:'ARM_Boots_Leather',slot:'Boots'}];
 const s=adaptCharacter(r,0,blank()).sheet;
 assert.equal(s.ac,12);
 assert.doesNotMatch(s.importSummary,/not a recognised armour type/);
});
test('the unpopulated armour_class field is never the sole basis for a total',()=>{
 const r=structuredClone(report),c=r.characters[0];c.abilities={str:10,dex:14,con:10,int:10,wis:10,cha:10};
 c.armour_class=11;c.equipped=[{name:'Breastplate',stats:'ARM_Breastplate',slot:'Breast'}];
 assert.equal(adaptCharacter(r,0,blank()).sheet.ac,16);
});
