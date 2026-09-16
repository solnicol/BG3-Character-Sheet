import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {adaptCharacter,characterClasses,xpProgress,XP_LEVELS,statusName,activeConditions,itemLabel} from '../src/save-adapter.mjs';
const source=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const blank=Function('return ('+source.match(/const blank=\(\)=>\((.+)\);/)[1]+')');
const report=JSON.parse(readFileSync(new URL('../vendor/bg3-savefile-parser/tests/parity/quicksave_469.expected.json',import.meta.url)));
test('real report imports race, HP, abilities, feats and inventory with derived proficiencies',()=>{
 const i=report.characters.findIndex(c=>c.name==='Shadowheart'),c=report.characters[i];
 const {sheet}=adaptCharacter(report,i,blank());
 assert.equal(sheet.race,'Half-Elf');assert.equal(sheet.subrace,'High Half-Elf');assert.deepEqual(sheet.abilities,c.abilities);
 assert.equal(sheet.hp,c.hp.current);assert.equal(sheet.maxHp,c.hp.max);assert.equal(sheet.speed,9);
 assert.equal(sheet.classes[0].level,9);assert.equal(sheet.skills.Perception,-1);assert.equal(sheet.saves.wis,null);
 // Luminous Armour carries no family word, so its class comes from the named
 // lookup: 15, plus her +2 Dexterity at the medium cap, plus two for the
 // Shield of Devotion in her offhand. The summary names the published source.
 assert.equal(sheet.ac,19);assert.match(sheet.importSummary,/published value for Luminous Armour/);
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
test('a named armour caps Dexterity at its own category and adds no phantom enchantment',()=>{
 const r=structuredClone(report);const i=r.characters.findIndex(c=>c.name==='Shadowheart');
 r.characters[i].abilities.dex=20;
 r.characters[i].equipped=[{stats:'MAG_Radiant_RadiatingOrb_Armor',name:'Luminous Armour',slot:'Breast',count:1}];
 // +5 Dexterity, but medium armour allows only +2, and 15 is already final.
 const s=adaptCharacter(r,i,blank()).sheet;assert.equal(s.ac,17);
});
// Clothing in the body slot is not unrecognised armour: it is the absence of
// armour, which the sheet can score exactly.
function clothed(name,stats,over={}){
 const r=structuredClone(report),i=r.characters.findIndex(c=>c.name==='Shadowheart'),c=r.characters[i];
 c.abilities={str:10,dex:16,con:18,int:10,wis:16,cha:10,...(over.abilities||{})};
 c.selected_passives=over.passives||[];
 c.equipped=[{stats,name,slot:'Breast',count:1},...(over.extra||[])];
 if(over.classes)c.class_levels=over.classes;
 return adaptCharacter(r,i,blank()).sheet;
}
test('a robe scores as unarmoured rather than withholding the total',()=>{
 // Base 10 and the whole +3, with no medium-armour cap in the way.
 const s=clothed('Potent Robe','MAG_CharismaCaster_Robe');
 assert.equal(s.ac,13);assert.doesNotMatch(s.importSummary,/not a recognised armour type/);
});
test('a barbarian in clothing keeps her Constitution',()=>{
 const s=clothed('Enraging Heart Garb','MAG_Barbarian_Magic_Armor_1',{classes:[{name:'Barbarian',subclass:'',level:9}]});
 assert.equal(s.ac,17); // 10 + 3 Dexterity + 4 Constitution
});
test('a monk loses unarmoured defence the moment a shield is held',()=>{
 const monk={classes:[{name:'Monk',subclass:'',level:9}]};
 assert.equal(clothed('Simple Robe','ARM_Robe_Body',monk).ac,16); // 10 + 3 Dex + 3 Wis
 assert.equal(clothed('Simple Robe','ARM_Robe_Body',{...monk,extra:[{name:'Iron-Banded Shield',stats:'ARM_Shield',slot:'Shield',count:1}]}).ac,15); // 10 + 3 + shield
});
test('the Defence fighting style needs armour, which clothing is not',()=>{
 const s=clothed('Simple Robe','ARM_Robe_Body',{passives:['FightingStyle_Defense']});
 assert.equal(s.ac,13);
});
test('a named heavy armour ignores Dexterity entirely',()=>{
 const s=clothed("Reaper's Embrace",'MOO_Ketheric_Armor');
 assert.equal(s.ac,19);assert.match(s.importSummary,/published value for Reaper's Embrace/);
});
test('named light armour is included in the shared AC calculation',()=>{const r=structuredClone(report);const i=r.characters.findIndex(c=>c.name==='Shadowheart');r.characters[i].abilities.dex=13;r.characters[i].equipped=[{stats:'GOB_DrowCommander_Leather_Armor',name:'Spidersilk Armour',slot:'Body',count:1}];const s=adaptCharacter(r,i,blank()).sheet;assert.equal(s.ac,13);});
// A status id carries its content prefix and, where it has one, its magnitude.
// Neither belongs in what the sheet prints.
test('a status name drops its region prefix, its magnitude and a doubled word',()=>{
 assert.equal(statusName('AID_5'),'Aid');
 assert.equal(statusName('MAG_CRITICAL_CRITICAL_EXECUTION'),'Critical Execution');
 assert.equal(statusName('MOO_POTION_BLOODOPTION_ASTARION'),'Potion Bloodoption Astarion');
 // A number that is part of the name is not a magnitude suffix.
 assert.equal(statusName('TAD_PEACE_BREAKER'),'Peace Breaker');
});
test('a spell the game data cannot name is left out, and the count is reported',()=>{
 const r=structuredClone(report),c=r.characters[0];
 c.spells=[{id:'Guiding Bolt',name:'Guiding Bolt',category:'spell',level:1,prepared:true},
  {id:'Target_Smite_Branding_Container_3',name:null,category:'spell',level:2,prepared:false},
  {id:'Shout_Macro_Mods_Camp_Night_Utils',name:null,category:'spell',level:null,prepared:true}];
 const {sheet}=adaptCharacter(r,0,blank());
 assert.doesNotMatch(sheet.spells,/Target_Smite|Shout_Macro/);
 assert.match(sheet.spells,/Guiding Bolt/);
 assert.match(sheet.importSummary,/2 spell entries have no name in the game data/);
});
// A magic weapon holds its enhancement in the item, not in its display name.
test('a named weapon contributes its enhancement and its extra damage ability',()=>{
 const r=structuredClone(report),i=r.characters.findIndex(c=>c.name==='Shadowheart'),c=r.characters[i];
 c.abilities={str:20,dex:10,con:14,int:8,wis:10,cha:16};
 c.proficiency_bonus=4;c.equipment_proficiencies=['Martial Weapons'];
 c.equipped=[{name:'Titanstring Bow',stats:'MAG_StrongString_Longbow',slot:'Ranged Main Weapon',count:1}];
 const {sheet,warnings}=adaptCharacter(r,i,blank());
 // +0 Dexterity, +4 proficiency, +1 enhancement to hit; +1 and +5 Strength to damage.
 assert.equal(sheet.attacks,'Titanstring Bow: +5 to hit, 1d8 +6 piercing');
 assert.equal(warnings.some(w=>/item bonus on/.test(w)),false);
});
test('an unlisted magic weapon keeps its figures but says they may be low',()=>{
 const r=structuredClone(report),i=r.characters.findIndex(c=>c.name==='Shadowheart'),c=r.characters[i];
 c.abilities={str:20,dex:10,con:14,int:8,wis:10,cha:16};
 c.proficiency_bonus=4;c.equipment_proficiencies=['Martial Weapons'];
 c.equipped=[{name:'Blooded Greataxe',stats:'MAG_LowHP_IncreaseDamage_Greataxe',slot:'Melee Main Weapon',count:1}];
 const {sheet,warnings}=adaptCharacter(r,i,blank());
 assert.match(sheet.attacks,/\+9 to hit, 1d12 \+5 slashing/);
 assert.match(warnings.join(' '),/item bonus on Blooded Greataxe is not included/);
});
test('a plain weapon raises no doubt about a hidden enhancement',()=>{
 const r=structuredClone(report),i=r.characters.findIndex(c=>c.name==='Shadowheart'),c=r.characters[i];
 c.equipped=[{name:'Dagger',stats:'WPN_Dagger',slot:'Melee Main Weapon',count:1}];
 assert.equal(adaptCharacter(r,i,blank()).warnings.some(w=>/item bonus on/.test(w)),false);
});
// An item the game data cannot name occupies a slot regardless, so its id is
// read into words rather than printed as an identifier or dropped.
test('an item with no name is read from its stats id, prefix and all',()=>{
 assert.equal(itemLabel({stats:'UND_SharranCrossbow'}),'Sharran Crossbow');
 assert.equal(itemLabel({stats:'FOR_SchoolOgres_Horn'}),'School Ogres Horn');
 assert.equal(itemLabel({stats:'SHA_BrokenLever'}),'Broken Lever');
 assert.equal(itemLabel({name:'Titanstring Bow',stats:'MAG_StrongString_Longbow'}),'Titanstring Bow');
 assert.equal(itemLabel({stats:''}),'Unresolved item');
});
test('an unnamed item keeps its place in the equipped list',()=>{
 const r=structuredClone(report),i=r.characters.findIndex(c=>c.name==='Shadowheart'),c=r.characters[i];
 c.equipped=[{name:null,stats:'UND_SharranCrossbow',slot:'Ranged Main Weapon',count:1}];
 const {sheet}=adaptCharacter(r,i,blank());
 assert.match(sheet.equipment,/Sharran Crossbow \[Ranged Main Weapon\]/);
 assert.doesNotMatch(sheet.equipment,/UND_/);
});
test('an unnamed weapon of a known base type still gets its attack line',()=>{
 const r=structuredClone(report),i=r.characters.findIndex(c=>c.name==='Shadowheart'),c=r.characters[i];
 c.abilities={str:10,dex:16,con:14,int:10,wis:10,cha:10};
 c.proficiency_bonus=3;c.equipment_proficiencies=['Martial Weapons'];
 c.equipped=[{name:null,stats:'UND_DeadInWater_HandCrossbow',slot:'Ranged Main Weapon',count:1}];
 const {sheet}=adaptCharacter(r,i,blank());
 assert.match(sheet.attacks,/^Dead In Water Hand Crossbow: \+6 to hit, 1d6 \+3 piercing/);
});
// A weapon whose base type is unknown used to leave no trace at all: its
// attack line simply did not appear, which reads as an empty hand.
test('an unrecognised weapon in a weapon slot is named rather than dropped',()=>{
 const r=structuredClone(report),i=r.characters.findIndex(c=>c.name==='Shadowheart'),c=r.characters[i];
 c.equipped=[{name:'Phalar Aluve',stats:'UND_SwordInStone',slot:'Melee Main Weapon',count:1}];
 const {sheet,warnings}=adaptCharacter(r,i,blank());
 assert.equal(sheet.attacks,'');
 assert.match(warnings.join(' '),/No attack line for Phalar Aluve/);
 // The equipped list stays the record of it.
 assert.match(sheet.equipment,/Phalar Aluve \[Melee Main Weapon\]/);
});
test('a shield in an offhand weapon slot is owed no attack line',()=>{
 const r=structuredClone(report),i=r.characters.findIndex(c=>c.name==='Shadowheart'),c=r.characters[i];
 c.equipped=[{name:'Shield of Devotion',stats:'MAG_BG_OfDevotion_Shield',slot:'Melee Offhand Weapon',count:1}];
 assert.equal(adaptCharacter(r,i,blank()).warnings.some(w=>/No attack line/.test(w)),false);
});
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
test('camp clothing before combat armour never changes AC',()=>{
 for(const [name,stats,dex,shield,expected] of [
  ['Spidersilk Armour','GOB_DrowCommander_Leather_Armor',13,null,13],
  ['Breastplate +1','ARM_Breastplate_Body_1',14,'Safeguard Shield',19],
  ['Scale Mail +1','ARM_ScaleMail_Body_1',17,"Absolute's Warboard",19]
 ]){
  const r=structuredClone(report),c=r.characters[0];c.armour_class=null;c.abilities.dex=dex;c.selected_passives=[];
  c.equipped=[{name:'Camp clothes',stats:'ARM_Camp_Body',slot:'VanityBody'},{name,stats,slot:'Breast'},...(shield?[{name:shield,slot:'Melee Offhand Weapon'}]:[])];
  assert.equal(adaptCharacter(r,0,blank()).sheet.ac,expected,name);
  c.equipped.reverse();assert.equal(adaptCharacter(r,0,blank()).sheet.ac,expected,name+' reordered');
 }
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
 c.equipped=[{name:'Mystery Armour',stats:'MAG_Unknown_Mystery_Armor',slot:'Breast'}];
 const s=adaptCharacter(r,0,blank()).sheet;
 assert.equal(s.ac,'');
 assert.match(s.importSummary,/Mystery Armour is not a recognised armour type/);
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

// Experience. The table is verified against a live save: Neith is level 4 on
// 3542 cumulative XP and the game reports 842 earned with 2958 remaining.
test('experience progress matches the values the game itself reports',()=>{
 assert.deepEqual(xpProgress(3542,4),{within:842,band:3800,remaining:2958});
 assert.deepEqual(xpProgress(3502,4),{within:802,band:3800,remaining:2998});
});
test('the experience table is cumulative, ascending and ends at the level 12 total',()=>{
 assert.equal(XP_LEVELS[1],0);assert.equal(XP_LEVELS[4],2700);assert.equal(XP_LEVELS[5],6500);
 assert.equal(XP_LEVELS[12],100000);
 for(let l=2;l<=12;l++)assert.ok(XP_LEVELS[l]>XP_LEVELS[l-1],'level '+l+' must exceed level '+(l-1));
});
test('the sheet keeps an identical copy of the experience table',()=>{
 const copy=JSON.parse(source.match(/const XP_LEVELS=(\[[^\]]*\]);/)[1]);
 assert.deepEqual(copy,XP_LEVELS,'index.html XP_LEVELS has drifted from src/save-adapter.mjs');
});
test('progress is withheld when experience and level disagree',()=>{
 assert.equal(xpProgress(2699,4),null);  // below the level 4 floor
 assert.equal(xpProgress(6500,4),null);  // already past the level 5 threshold
 assert.equal(xpProgress(-1,4),null);
 assert.equal(xpProgress(3542,13),null);
 assert.equal(xpProgress(3542.5,4),null);
});
test('level 12 has a band but no remaining experience',()=>{
 assert.deepEqual(xpProgress(100000,12),{within:0,band:null,remaining:null});
});
test('experience is imported and an inconsistent total is flagged',()=>{
 const r=structuredClone(report),c=r.characters[0];
 c.xp=3542;c.level=4;c.class_levels=[{name:'Fighter',subclass:'',level:4}];
 const s=adaptCharacter(r,0,blank()).sheet;
 assert.equal(s.xp,3542);
 assert.doesNotMatch(s.importSummary,/does not match the expected range/);
 c.xp=99999;
 assert.match(adaptCharacter(r,0,blank()).sheet.importSummary,/does not match the expected range/);
});
test('a missing experience total stays blank without a warning',()=>{
 const r=structuredClone(report),c=r.characters[0];delete c.xp;
 const s=adaptCharacter(r,0,blank()).sheet;
 assert.equal(s.xp,'');
 assert.doesNotMatch(s.importSummary,/does not match the expected range/);
});

test('padded armour is light armour keeping the full Dexterity modifier',()=>{
 // Astarion's starter kit in a real save: UNI_Astarion_StarterArmor, Dex 17.
 const r=structuredClone(report),c=r.characters[0];
 c.abilities={str:10,dex:17,con:10,int:10,wis:10,cha:10};
 c.equipped=[{name:"Astarion's Eccentric Clothes",stats:'ARM_Camp_Body_Astarion',slot:'VanityBody'},
             {name:'Padded Armour',stats:'UNI_Astarion_StarterArmor',slot:'Breast'}];
 const s=adaptCharacter(r,0,blank()).sheet;
 assert.equal(s.ac,14);
 assert.doesNotMatch(s.importSummary,/not a recognised armour type/);
});

// Active conditions. Ground truth from a save whose panel showed exactly
// "See Invisibility" and "Aid" for this character.
test('status ids are transcribed the way the game presents them',()=>{
 assert.equal(statusName('MAG_AID'),'Aid');
 assert.equal(statusName('MAG_SEE_INVISIBILITY_HIDDEN_IGNORE_RESTING'),'See Invisibility');
 assert.equal(statusName('EXPEDITIOUS_RETREAT'),'Expeditious Retreat');
 assert.equal(statusName(''),'');
});
test('permanent item and flag statuses stay off the sheet',()=>{
 const raw=[{id:'MAG_GOB_PRIEST_AMULET_TECHNICAL',permanent:true},{id:'MAG_SEE_INVISIBILITY_HIDDEN_IGNORE_RESTING',permanent:false},
            {id:'HAS_SHOVEL',permanent:true},{id:'MAG_AID',permanent:false}];
 assert.deepEqual(activeConditions(raw),['See Invisibility','Aid']);
 assert.deepEqual(activeConditions([]),[]);
 assert.deepEqual(activeConditions(undefined),[]);
});
test('the same condition from two sources is listed once',()=>{
 assert.deepEqual(activeConditions([{id:'MAG_AID',permanent:false},{id:'AID',permanent:false}]),['Aid']);
});
test('conditions reach the sheet alongside concentration',()=>{
 const r=structuredClone(report),c=r.characters[0];
 c.statuses=[{id:'MAG_AID',permanent:false},{id:'HAS_SHOVEL',permanent:true}];
 c.concentration={name:'Bless'};
 assert.equal(adaptCharacter(r,0,blank()).sheet.conditions,'Aid\nConcentrating: Bless');
});
test('a character with no statuses keeps the conditions box empty',()=>{
 const r=structuredClone(report),c=r.characters[0];
 delete c.statuses;c.concentration=null;
 assert.equal(adaptCharacter(r,0,blank()).sheet.conditions,'');
});
