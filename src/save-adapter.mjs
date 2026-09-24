import {weaponProperties,weaponEnhancementUnknown} from './weapon-data.mjs';
// Explicit translation from the pinned parser's report to the editable sheet.
export const PARSER_REVISION='9578ff7c46a1aa40c805f6b7beecf907f10fb3b8';
const CLASSES=['Barbarian','Bard','Cleric','Druid','Fighter','Monk','Paladin','Ranger','Rogue','Sorcerer','Warlock','Wizard'];
const ABILITIES=['str','dex','con','int','wis','cha'];
const SKILLS=['Acrobatics','Animal Handling','Arcana','Athletics','Deception','History','Insight','Intimidation','Investigation','Medicine','Nature','Perception','Performance','Persuasion','Religion','Sleight of Hand','Stealth','Survival'];
const RACES={Human:['Human',''],Githyanki:['Githyanki',''],HalfOrc:['Half-Orc',''],Elf_HighElf:['Elf','High Elf'],Elf_WoodElf:['Elf','Wood Elf'],Drow_LolthSworn:['Drow','Lolth-Sworn Drow'],Drow_Seldarine:['Drow','Seldarine Drow'],Tiefling_Asmodeus:['Tiefling','Asmodeus Tiefling'],Tiefling_Mephistopheles:['Tiefling','Mephistopheles Tiefling'],Tiefling_Zariel:['Tiefling','Zariel Tiefling'],Dwarf_Gold:['Dwarf','Gold Dwarf'],Dwarf_Shield:['Dwarf','Shield Dwarf'],Dwarf_Duergar:['Dwarf','Duergar'],HalfElf_High:['Half-Elf','High Half-Elf'],HalfElf_Wood:['Half-Elf','Wood Half-Elf'],HalfElf_Drow:['Half-Elf','Drow Half-Elf'],Halfling_Lightfoot:['Halfling','Lightfoot Halfling'],Halfling_Strongheart:['Halfling','Strongheart Halfling'],Gnome_Rock:['Gnome','Rock Gnome'],Gnome_Forest:['Gnome','Forest Gnome'],Gnome_Deep:['Gnome','Deep Gnome']};
for(const colour of ['Black','Blue','Brass','Bronze','Copper','Gold','Green','Red','Silver','White'])RACES['Dragonborn_'+colour]=['Dragonborn',colour];
const SUBCLASSES={BattleMaster:'Battle Master',TotemWarriorPath:'Wildheart',BerserkerPath:'Berserker',WildMagicPath:'Wild Magic',ArcaneTrickster:'Arcane Trickster',EldritchKnight:'Eldritch Knight',Fiend:'The Fiend',GreatOldOne:'The Great Old One',Archfey:'The Archfey'};
const text=v=>typeof v==='string'?v:'';
const title=v=>SUBCLASSES[v]||text(v).replace(/([a-z])([A-Z])/g,'$1 $2').replaceAll('_',' ');
const amount=n=>Number.isFinite(n)?String(Math.round(n*100)/100):'?';
// Larian prefixes a status or an item with the content it belongs to. The
// regional ones here are the prefixes gamedata.json itself uses on stats and
// spells, so a status picked up at Moonrise reads 'Potion …' rather than 'Moo
// Potion …'.
const STATUS_PREFIX=/^(MAG|TAD|CAMP|GOB|UNI|WPN|ARM|LOW|SHA|MOO|COL|FOR|UND|TWN|DEN|WYR|HAG|CRE)_/;
// An item the game data cannot name still occupies a slot or a bag, so unlike
// a technical spell it has to stay on the sheet. Read its stats id the way a
// status id is read, dropping the content prefix and splitting the identifier
// into words: UND_SharranCrossbow is a Sharran Crossbow, not an identifier
// printed on a character sheet.
export const itemLabel=i=>i?.name||(i?.stats?title(String(i.stats).replace(STATUS_PREFIX,'')):'')||'Unresolved item';
const itemLine=i=>`${i.count_known===false?'? × ':i.count>1?i.count+' × ':''}${itemLabel(i)}${i.slot?' ['+i.slot+']':''}`;
const groupItems=(name,items)=>items?.length?name+'\n'+items.map(itemLine).join('\n'):'';
const integer=(n,min=0,max=1000000)=>Number.isInteger(n)&&n>=min&&n<=max;
// Larian's status ids are screaming snake case with a source prefix
// (MAG_ for an item or spell effect, TAD_ for tadpole powers) and sometimes a
// trailing engine qualifier. There is no display-name table in the vendored
// game data, so the id is cleaned and title cased. This is a transcription of
// the id, not a lookup: an unusual status may read a little raw.
// Larian prefixes a status with the content it belongs to. The regional ones
// here are the prefixes gamedata.json itself uses on stats and spells, so a
// status picked up at Moonrise reads 'Potion …' rather than 'Moo Potion …'.

const STATUS_QUALIFIER=/_(HIDDEN|TECHNICAL|APPLIER|STARTER|IGNORE_RESTING|DISPLAY|VFX|SFX)(?=_|$)/g;
export function statusName(id){
 const core=String(id||'').replace(STATUS_PREFIX,'').replace(STATUS_QUALIFIER,'')
  // A trailing number is the effect's magnitude, not part of its name: AID_5
  // is Aid for five hit points, and the sheet already shows the game's own
  // wording without it.
  .replace(/_\d+$/,'')
  .replace(/_+/g,'_').replace(/^_|_$/g,'');
 if(!core)return '';
 const words=core.split('_').map(w=>w[0]+w.slice(1).toLowerCase());
 // Stripping the prefix can leave the same word twice, as MAG_CRITICAL_
 // CRITICAL_EXECUTION does. Say it once.
 return words.filter((w,i)=>i===0||w.toLowerCase()!==words[i-1].toLowerCase()).join(' ');
}
// Only the non-permanent entries reach the sheet; the permanent ones are the
// item auras and carried-object flags the game's own panel leaves out.
export function activeConditions(statuses){
 const seen=new Set(),out=[];
 for(const s of statuses||[]){
  if(!s||s.permanent)continue;
  const name=statusName(s.id);
  if(!name||seen.has(name))continue;
  seen.add(name);out.push(name);
 }
 return out;
}
// Cumulative experience required to reach each level, indexed by level.
// Verified against a live save rather than taken from a secondary source:
// Neith is level 4 holding 3542 total XP, and the game's own tooltip reads
// "Current experience: 842. Remaining experience needed to gain a level:
// 2958." Level 4 therefore begins at 3542 - 842 = 2700 and level 5 at
// 2700 + 3800 = 6500. The series ends at exactly 100000, BG3's level 12
// total, which corroborates the remaining rows.
// index.html holds an identical copy for live display; a test asserts they
// stay in step.
// Dexterity contribution allowed by each armour category.
const DEX_CAP={light:Infinity,medium:2,heavy:0};
// Named magic armour whose display name and stats ID carry no family word.
// gamedata.json cannot settle these: it holds names, slots and rarity but no
// armour-class data at all. Each entry is keyed on the stats ID, which is
// stable across saves and localisations where a display name is not, and its
// class is the item's finished number, enchantment included.
//
// Luminous Armour: medium, class 15, Dexterity capped at +2, per its stat
// block on bg3.wiki. The rarity there agrees with the Uncommon that
// gamedata.json records for this stats ID.
// Reaper's Embrace: heavy, class 19, per its stat block on bg3.wiki.
export const NAMED_ARMOUR=new Map([
 // https://bg3.wiki/wiki/Simple_Jerkin
 ['ARM_Bard',{name:'Simple Jerkin',type:'light',ac:11}],
 ['MAG_Radiant_RadiatingOrb_Armor',{name:'Luminous Armour',type:'medium',ac:15}],
 ['MOO_Ketheric_Armor',{name:"Reaper's Embrace",type:'heavy',ac:19}],
]);
// Body-slot clothing is not armour. A robe, a garb or a set of camp clothes
// leaves the wearer unarmoured, which scores as base 10 and the whole
// Dexterity modifier, so it is something the sheet knows rather than something
// it must withhold. Of the 169 body-slot entries in gamedata.json, 48 of the
// 75 that carry no family word are clothing, and none of the 94 that do also
// match this, so the two tests cannot disagree about an item.
export const CLOTHING=/Robe|Cloth|Garb|Outfit|Clothes|Vanity|Underwear/i;
export const XP_LEVELS=[null,0,300,900,2700,6500,13000,21000,30000,42000,56000,76000,100000];
// Progress through the current level, or null when the totals disagree with
// the table (a modded XP curve, or a future patch retuning it). A wrong
// "XP to next level" is worse than none, so callers show nothing instead.
export function xpProgress(xp,level){
 if(!integer(xp,0,10000000)||!integer(level,1,12))return null;
 const floor=XP_LEVELS[level],ceiling=level<12?XP_LEVELS[level+1]:null;
 if(xp<floor||(ceiling!==null&&xp>=ceiling))return null;
 return {within:xp-floor,band:ceiling===null?null:ceiling-floor,remaining:ceiling===null?null:ceiling-xp};
}
export function characterClasses(c){
 const total=Number(c.level);
 if(!integer(total,1,12))throw Error('This character’s level is unavailable or outside the supported range of 1–12.');
 let classes=c.class_levels;
 if(!classes?.length){
  if(c.classes?.length!==1)throw Error('Individual multiclass levels were not recovered. This character cannot be imported accurately.');
  classes=[{name:c.classes[0].Main,subclass:c.classes[0].Sub||'',level:total}];
 }
 if(classes.some(x=>!CLASSES.includes(x.name)||!integer(x.level,1,12))||classes.reduce((a,x)=>a+x.level,0)!==total)throw Error('This character has an unsupported class or incomplete class levels.');
 return classes.map(x=>({name:x.name,subclass:title(x.subclass),level:x.level}));
}
export function adaptCharacter(report,index,template){
 const c=structuredClone(report.characters?.[index]);if(!c)throw Error('Choose a character from the save.');
 const out=structuredClone(template),warnings=[];
 out.name=text(c.name).replace(/ \(player\)$/,'')||'Unnamed character';
 out.classes=characterClasses(c);
 // The parser fills spellcasting_ability for the active party but not for camp
 // companions, so a camp druid arrives without one. A single class settles it,
 // which is enough for every full caster; a multiclass character is left alone
 // rather than guessed at.
 const CASTING_ABILITY={Bard:'cha',Sorcerer:'cha',Warlock:'cha',Paladin:'cha',Cleric:'wis',Druid:'wis',Ranger:'wis',Wizard:'int'};
 const spellAbility=text(c.spellcasting_ability)
  ||(out.classes.length===1?(CASTING_ABILITY[out.classes[0].name]??''):'');
 const race=RACES[c.race];[out.race,out.subrace]=race||['Not recovered',''];
  if(!race)warnings.push('Race not recognised: '+(c.race||'unavailable')+'.');
 for(const a of ABILITIES){out.abilities[a]=integer(c.abilities?.[a],1,30)?c.abilities[a]:'';out.saves[a]=c.saving_throw_proficiencies?.includes(a)??null;}
 if(ABILITIES.some(a=>out.abilities[a]===''))warnings.push('One or more ability scores were not recovered within the supported range.');
 out.skills=Object.fromEntries(SKILLS.map(n=>[n,c.skill_expertise?.includes(n)?2:c.skill_proficiencies?c.skill_proficiencies.includes(n)?1:0:-1]));
 out.background=text(c.background)||'';
 out.armour=(c.equipment_proficiencies||[]).filter(x=>/Armour|Shield/.test(x)).join('\n');
 out.weapons=(c.equipment_proficiencies||[]).filter(x=>!/Armour|Shield/.test(x)).join('\n');
 // Experience is stored cumulatively in the save; the game's own UI shows
 // progress within the current level instead. Keep the save's number and let
 // the sheet derive the in-level figures from it.
 out.xp=integer(c.xp,0,10000000)?c.xp:'';
 if(out.xp!==''&&!xpProgress(out.xp,out.classes.reduce((n,x)=>n+x.level,0)))warnings.push('Experience total '+out.xp+' does not match the expected range for this level, so progress to the next level is not shown.');
 out.hp=integer(c.hp?.current)?c.hp.current:'';out.maxHp=integer(c.hp?.max)?c.hp.max:'';out.tempHp=integer(c.hp?.temp)?c.hp.temp:'';
 if(!c.hp)warnings.push('Hit points were not recovered.');
 const resources=c.resources||[];
 const movement=resources.find(r=>r.guid==='d6b2369d-84f0-4ca4-a3a7-62d2d192a185');
 out.speed=movement&&Number.isFinite(movement.max)&&movement.max>=0&&movement.max<=1000?movement.max:'';
 // Reconstruct AC from the live loadout. The parser declares armour_class in
 // its model but never assigns it, so it is retained only as a forward
 // -compatible fallback and is never the sole basis for a total.
 //
 // Body armour and shields are identified by the parser's canonical slot,
 // which comes from the game's own stats_slots table, rather than guessed
 // from item names: 'VanityBody' is a cosmetic overlay that must not displace
 // real 'Breast' armour, and a 'Ring' called "Ring of Mind-Shielding" is not
 // a shield.
 const wornItems=c.equipped||[];
 const passives=new Set(c.selected_passives||[]);
 const armourBases=[[/Spidersilk/i,12,Infinity],[/Breastplate/i,14,2],[/Half.?Plate/i,15,2],[/Scale ?Mail/i,14,2],[/Studded/i,12,Infinity],[/Padded/i,11,Infinity],[/Leather/i,11,Infinity],[/Splint/i,17,0],[/Plate/i,18,0],[/Chain ?Mail/i,16,0],[/Chain ?Shirt/i,13,2],[/Ring ?Mail/i,14,0],[/Hide/i,12,2]];
 const armourFamily=i=>{
   const named=NAMED_ARMOUR.get(i.stats);
   if(named)return {base:named.ac,dexCap:DEX_CAP[named.type],named};
   const text=`${i.name||''} ${i.stats||''}`;
   // A real armour family wins over an accidental clothing word.
   const row=armourBases.find(([pattern])=>pattern.test(text));
   if(row)return {base:row[1],dexCap:row[2],named:null,clothing:false};
   return CLOTHING.test(text)?{base:10,dexCap:Infinity,named:null,clothing:true}:null;
 };
 if(Number.isInteger(out.abilities.dex)) {
   const dex=Math.floor((out.abilities.dex-10)/2);
   // Only a genuine body slot counts. Items with no recovered slot are
   // accepted only when they name a known armour type, so a lute or a
   // circlet can never be mistaken for a cuirass.
   const armourItem=wornItems.find(i=>i.slot==='Breast'||i.slot==='Body')||wornItems.find(i=>!i.slot&&armourFamily(i));
   const match=armourItem?armourFamily(armourItem):null;
   const shieldItem=wornItems.find(i=>(i.slot==='Shield'||/Offhand/i.test(i.slot||''))&&/Shield|Warboard/i.test(`${i.name||''} ${i.stats||''}`));
   const shieldBonus=shieldItem?2+Number((shieldItem.name||'').match(/\+(\d+)/)?.[1]||0):0;
   if(armourItem&&!match) {
     // Armour is worn but its class is unknown to us. Treating it as
     // unarmoured would silently under-report by up to seven points, so the
     // sheet reports nothing rather than a number it cannot stand behind.
     out.ac=Number.isFinite(c.armour_class)?c.armour_class:'';
     warnings.push('Armour class was not calculated: '+(armourItem.name||armourItem.stats||'the equipped body armour')+' is not a recognised armour type.');
   } else {
     // Barbarian and Monk carry their own unarmoured defence, and clothing
     // counts as wearing nothing. Without this a Barbarian in a garb scores
     // her Constitution short. The Monk's version is lost the moment a shield
     // is held; the Barbarian may hold one and keep it. A character with both
     // takes whichever is higher, since the two never stack.
     const unarmoured=!match||match.clothing;
     const classNames=new Set(out.classes.map(x=>x.name));
     const abilityMod=a=>Number.isInteger(out.abilities[a])?Math.floor((out.abilities[a]-10)/2):null;
     const con=abilityMod('con'), wis=abilityMod('wis');
     const defences=[];
     if(unarmoured&&classNames.has('Barbarian')&&con!==null)defences.push(con);
     if(unarmoured&&classNames.has('Monk')&&!shieldItem&&wis!==null)defences.push(wis);
     const unarmouredDefence=defences.length?Math.max(...defences):0;
     const base=match?match.base:10, dexCap=match?match.dexCap:Infinity;
     // A looked-up class is the item's finished number, so a +N is only read
     // off the display name of armour recognised by family.
     const enhancement=match?.named?0:Number((armourItem?.name||'').match(/\+(\d+)/)?.[1]||0);
     // Become the Bulwark is an equipped-item effect, not a selected passive.
     // Use the stable stats ID, never the character's name or carried items.
     // https://bg3.wiki/wiki/Bracers_of_Defence
     const bracers=wornItems.some(i=>i.slot==='Gloves'&&i.stats==='UNI_ARM_OfDefense_Gloves');
     const bracersBonus=bracers&&unarmoured&&!shieldItem?2:0;
     out.ac=base+enhancement+(dexCap===0?0:Math.min(dexCap,dex))+shieldBonus+unarmouredDefence+bracersBonus+(match&&!match.clothing&&passives.has('FightingStyle_Defense')?1:0);
     // Recognised item definitions are normal calculation inputs. Their
     // sources live with NAMED_ARMOUR, rather than appearing as import errors.
   }
 } else if(Number.isFinite(c.armour_class)) out.ac=c.armour_class;
 out.initiative=Number.isFinite(c.initiative)?c.initiative:(Number.isInteger(out.abilities.dex)?Math.floor((out.abilities.dex-10)/2):'');
 out.slots=Array(6).fill('');out.pactSlots=Array(6).fill('');
 for(const r of resources){if(r.guid==='d136c5d9-0ff0-43da-acce-a74a07f8d6bf'&&integer(r.level,1,6))out.slots[r.level-1]=amount(r.current)+' / '+amount(r.max)}
 const pact=resources.filter(r=>/warlock.*slot/i.test(r.name||''));
 for(const r of pact){if(integer(r.level,1,6)&&(r.max>0||r.current>0))out.pactSlots[r.level-1]=amount(r.current)+' / '+amount(r.max)}
 const resourceLabel=r=>({Interrupt_LuckOfTheFarRealms_Charge:'Luck of the Far Realms charge',LuckOfFarRealmsCharge:'Luck of the Far Realms charge',SuperiorityDie:'Superiority Die'}[r.name]||String(r.name||'Unresolved resource '+r.guid).replaceAll('_',' '));
 out.resources=resources.filter(r=>r.guid!=='d136c5d9-0ff0-43da-acce-a74a07f8d6bf'&&!/warlock.*slot/i.test(r.name||'')&&(r.max>0||r.current>0)).map(r=>`${resourceLabel(r)}${r.level?' (level '+r.level+')':''}: ${amount(r.current)} / ${amount(r.max)}`).join('\n');
 out.inspiration=integer(report.save_info?.inspiration,0,4)?report.save_info.inspiration:'';
 // BG3's gamedata labels torches as melee weapons for combat purposes, but
 // the character panel gives them their own torch slot. Preserve that UI
 // distinction in the character sheet (and likewise keep instruments apart).
 const normaliseUtilitySlot=i=>{
   const label=`${i.name||''} ${i.stats||''}`;
   if(/Torch/i.test(label))return {...i,slot:'Torch'};
   if(i.slot==='MusicalInstrument'||/MusicalInstrument|Instrument_/i.test(label))return {...i,slot:'MusicalInstrument'};
   return i;
 };
 c.equipped=(c.equipped||[]).map(normaliseUtilitySlot);
 const resolvedWorn=c.equipped||[];
 const confirmed=resolvedWorn;
 const slotOrder=new Map(['Breast','Body','Helmet','Gloves','Boots','Amulet','Ring 1','Ring 2','Melee Main Weapon','Melee Offhand Weapon','Ranged Main Weapon','Ranged Offhand Weapon','Torch','MusicalInstrument'].map((s,i)=>[s,i]));
 const equippedOrdered=[...confirmed].sort((a,b)=>(slotOrder.get(a.slot)??99)-(slotOrder.get(b.slot)??99)||String(a.name||a.stats).localeCompare(String(b.name||b.stats),'en'));
 const carriedOrdered=[...(c.carried||[]),...(c.undetermined||[])].sort((a,b)=>String(a.name||a.stats).localeCompare(String(b.name||b.stats),'en'));
 const equipment=[groupItems('EQUIPPED',equippedOrdered),groupItems('CARRIED',carriedOrdered)].filter(Boolean);
 out.equipment=equipment.join('\n\n');
 const modifier=n=>Number.isInteger(n)?Math.floor((n-10)/2):null;
 // Martial Arts scales with Monk levels, not total character level.
 // Versatile weapons qualify even when held in both hands; inherently
 // two-handed/heavy weapons and ranged weapons do not.
 // https://bg3.wiki/wiki/Monk
 const monkLevel=out.classes.filter(x=>x.name==='Monk').reduce((n,x)=>n+x.level,0);
 const martialDie=monkLevel>=9?8:monkLevel>=3?6:4;
 const monkWeaponTypes=new Set(['Rapier','Shortsword','Scimitar','Dagger','Longsword','Battleaxe','Handaxe','Warhammer','Light Hammer','Mace','Quarterstaff','Spear','Javelin','Club','Trident','War Pick','Sickle','Flail','Morningstar']);
 const prof=integer(c.proficiency_bonus,0,10)?c.proficiency_bonus:2+Math.floor((out.classes.reduce((n,x)=>n+x.level,0)-1)/4);
 const attackItems=equippedOrdered.filter(i=>weaponProperties(i));
 out.spellAttackBonus=attackItems.reduce((sum,i)=>sum+weaponProperties(i).spellAttackBonus,0);
 out.spellDcBonus=attackItems.reduce((sum,i)=>sum+weaponProperties(i).spellDcBonus,0);
 const attackLines=attackItems.map(i=>{
   const w=weaponProperties(i),str=modifier(out.abilities.str),dex=modifier(out.abilities.dex);
   const proficiencies=c.equipment_proficiencies;
   const proficient=proficiencies?.some(p=>p===w.group+' Weapons'||p.toLowerCase()===w.name.toLowerCase()||p.toLowerCase()===w.name.toLowerCase()+'s');
   const monkWeapon=monkLevel>0&&proficient&&monkWeaponTypes.has(w.name);
   // A Melee Caster weapon rolls on the spellcasting modifier instead. Without
   // a recovered spellcasting ability there is no figure to give, and the line
   // says so rather than quietly falling back to the arm that is not swinging.
   const m=w.ability==='spell'?(Object.hasOwn(out.abilities,spellAbility)?modifier(out.abilities[spellAbility]):null)
     :w.ability==='finesse'||monkWeapon?(str===null||dex===null?null:Math.max(str,dex)):w.ability==='dex'?dex:str;
   const ranged=w.ability==='dex',archery=ranged&&passives.has('FightingStyle_Archery')?2:0;
   const archeryGloves=ranged&&wornItems.some(x=>x.stats==='UNI_ARM_OfArchery_Gloves')?2:0;
   const allIn=ranged&&proficient&&c.passive_toggles?.Sharpshooter_AllIn===true;
   const bonus=m===null||!proficiencies?null:m+(proficient?prof:0)+w.enhancement+archery-(allIn?5:0);
   const offhand=/Offhand/.test(i.slot||'');
   const damageAbility=offhand&&m>0&&!passives.has('FightingStyle_TwoWeaponFighting')?0:m;
   const twoHanded=!ranged&&!offhand&&['Quarterstaff','Spear','Longsword','Battleaxe','Warhammer','Trident'].includes(w.name)&&!equippedOrdered.some(x=>/Melee Offhand/.test(x.slot||''));
   const weaponDie=twoHanded?(w.die==='1d6'?'1d8':'1d10'):w.die;
   const die=monkWeapon&&/^1d\d+$/.test(weaponDie)&&Number(weaponDie.slice(2))<martialDie?`1d${martialDie}`:weaponDie;
   const duelling=!twoHanded&&!ranged&&passives.has('FightingStyle_Dueling')&&!equippedOrdered.some(x=>/Melee Offhand/.test(x.slot||'')&&weaponProperties(x))&&!/Great|Maul|Glaive|Halberd|Pike/.test(w.name)?2:0;
   // A weapon that adds a second ability's modifier to its damage, such as the
   // Titanstring Bow's Strength, never gives less than the floor it guarantees.
   const extra=w.extra?Math.max(w.extraMin,modifier(out.abilities[w.extra])??w.extraMin):0;
   const damageMod=m===null?null:damageAbility+w.enhancement+extra+archeryGloves+duelling+(allIn?10:0);
   const sign=n=>n>=0?'+'+n:String(n);
   // A second damage type the weapon adds on every hit rides after the first.
   const bonusApplies=w.bonusDamage&&(!w.bonusDamage.race||w.bonusDamage.race===text(c.race));
   const rider=bonusApplies?` + ${w.bonusDamage.die} ${w.bonusDamage.type}`:'';
   return `${itemLabel(i)}: ${bonus===null?'?':sign(bonus)} to hit, ${die}${damageMod===null?' + ?':damageMod?' '+sign(damageMod):''} ${w.damage}${rider}`;
 });
 if(monkLevel>0){
   const str=modifier(out.abilities.str),dex=modifier(out.abilities.dex);
   const m=str===null||dex===null?null:Math.max(str,dex);
   const signed=n=>n>=0?'+'+n:String(n);
   attackLines.push(`Unarmed strike: ${m===null?'?':signed(m+prof)} to hit, 1d${martialDie}${m===null?' + ?':m?' '+signed(m):''} bludgeoning`);
 }
 out.attacks=attackLines.join('\n');
 // An enhancement the sheet cannot see makes every figure on a weapon's line
 // one or two low. Saying which weapons that applies to is better than a
 // number that looks settled.
 // A weapon slot holds a weapon. When its base type is not one the table
 // knows, the line simply vanishes from Attacks & damage and the character
 // reads as though that hand were empty. A shield sits in an offhand weapon
 // slot without being a weapon, so it is not owed an attack line.
 const shieldLike=i=>/Shield|Warboard/i.test(`${i.name||''} ${i.stats||''}`);
 const unrecognisedWeapons=equippedOrdered.filter(i=>/Weapon$/.test(i.slot||'')&&!shieldLike(i)&&!weaponProperties(i)).map(itemLabel);
 if(unrecognisedWeapons.length)warnings.push('No attack line for '+unrecognisedWeapons.join(', ')+': the base weapon type was not recognised, so the equipped list is the only record of it.');
 const uncertainWeapons=attackItems.filter(weaponEnhancementUnknown).map(itemLabel);
 if(uncertainWeapons.length)warnings.push('Any item bonus on '+uncertainWeapons.join(', ')+' is not included: the enhancement is held in the item rather than its name, so attack and damage may be understated.');
 const gold=(c.carried||[]).filter(i=>['OBJ_GoldCoin','OBJ_GoldPile'].includes(i.stats));
 out.gold=gold.length&&gold.every(i=>i.count_known!==false&&integer(i.count))?gold.reduce((sum,i)=>sum+i.count,0):'';
 out.features=(c.feats||[]).map(f=>`${f.name||f.guid} (level ${f.level})${f.picks?.length?': '+f.picks.join(', '):''}`).join('\n');
 if(c.illithid_powers?.length)out.features+='\n\nIllithid powers\n'+c.illithid_powers.join('\n');
 const spells=c.spells||[];
 const combatActions=/^(Action Surge|Flourish|Menacing Attack(?: \((?:Melee|Ranged)\))?|Piercing Shot|Piercing Strike|Second Wind|Sweeping Attack|Weakening Strike|Astral Knowledge|Fey Presence|Radiance of the Dawn|Turn Undead|Ki Restoration|Talk to the Sentient Amulet)$/i;
 // A spell can be present once for its class list, once for its subclass and
 // again in the prepared list. Merge those records before printing.
 // A spell the game data cannot name is a technical container or a mod's own
 // entry, never something the in-game spellbook shows. Printing its raw id
 // puts 'Target_Smite_Branding_Container_3' on a printed sheet, so leave it
 // out and say how many were left out rather than pretending the list is
 // complete.
 const unnamedSpells=spells.filter(s=>s.category==='spell'&&!s.name).length;
 if(unnamedSpells)warnings.push(unnamedSpells+' spell '+(unnamedSpells===1?'entry has':'entries have')+' no name in the game data, so '+(unnamedSpells===1?'it is':'they are')+' not listed. Mod-added spells appear this way.');
 const uniqueSpells=new Map();
 for(const s of spells) if(s.category==='spell'&&s.name&&!combatActions.test(String(s.name))){
   const key=String(s.name||s.id||'').trim().toLowerCase();
   const prev=uniqueSpells.get(key);
   if(!prev || (s.prepared===true && prev.prepared!==true)) uniqueSpells.set(key,{...prev,...s,prepared:s.prepared===true||prev?.prepared===true});
 }
 const orderedSpells=[...uniqueSpells.values()].sort((a,b)=>{
   const la=Number.isInteger(a.level)?a.level:99, lb=Number.isInteger(b.level)?b.level:99;
   return la-lb || String(a.name||a.id).localeCompare(String(b.name||b.id),'en',{sensitivity:'base'});
 });
 out.spells=orderedSpells.map(s=>`${s.level===0?'Cantrip':s.level?'Level '+s.level:'Spell'}: ${s.name||s.id}${s.prepared===true?' [prepared]':s.prepared===false?' [not prepared]':''}`).join('\n');
 const other=[...spells.filter(s=>s.category!=='spell'&&s.category!=='basic-action'&&s.category!=='sub-spell'),...spells.filter(s=>s.category==='spell'&&combatActions.test(String(s.name||'')))];
 out.features+=[other.length?'\n\nOther abilities\n'+[...new Set(other.map(s=>s.name||s.id))].join('\n'):'',c.reactions?.length?'\n\nReactions\n'+c.reactions.join('\n'):''].join('');
 out.features=out.features.trim();
 const choices=[...passives].map(x=>title(x.replace('FightingStyle_','Fighting style: '))).filter(x=>!out.features.toLowerCase().replace(/[^a-z]/g,'').includes(x.toLowerCase().replace(/[^a-z]/g,'')));if(choices.length)out.features+='\n\nBuild choices\n'+choices.join('\n');
 out.conditions=[...activeConditions(c.statuses),c.concentration?'Concentrating: '+(c.concentration.name||c.concentration.id):''].filter(Boolean).join('\n');
 if(Object.hasOwn(c.passive_toggles||{},'Sharpshooter_AllIn'))out.conditions+=(out.conditions?'\n':'')+'Sharpshooter: All In '+(c.passive_toggles.Sharpshooter_AllIn?'ON (−5 ranged attack, +10 damage)':'OFF');
 if(c.spells_note)warnings.push('Spellbook: '+c.spells_note+'.');
 if(c.equipment_note)warnings.push('Equipment: '+c.equipment_note+'.');
 if(!c.feats)warnings.push('Feat choices were not recovered; an empty list does not mean no feats.');
 out.spellAbility=spellAbility;
 out.importSummary='Imported from '+text(report.source)+'. '+warnings.join(' ');
 // These are deliberately left as clean writing areas. Save metadata and
 // parser diagnostics belong in the import notice, never in the character's
 // personal notes or appearance section.
 out.story='';
 out.notes='';
 return {sheet:out,warnings,missing:''};
}
