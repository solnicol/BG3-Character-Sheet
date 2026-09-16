import {weaponProperties} from './weapon-data.mjs';
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
const itemLine=i=>`${i.count_known===false?'? × ':i.count>1?i.count+' × ':''}${i.name||i.stats||'Unresolved item'}${i.slot?' ['+i.slot+']':''}`;
const groupItems=(name,items)=>items?.length?name+'\n'+items.map(itemLine).join('\n'):'';
const integer=(n,min=0,max=1000000)=>Number.isInteger(n)&&n>=min&&n<=max;
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
 const race=RACES[c.race];[out.race,out.subrace]=race||['Not recovered',''];
  if(!race)warnings.push('Race not recognised: '+(c.race||'unavailable')+'.');
 for(const a of ABILITIES){out.abilities[a]=integer(c.abilities?.[a],1,30)?c.abilities[a]:'';out.saves[a]=c.saving_throw_proficiencies?.includes(a)??null;}
 if(ABILITIES.some(a=>out.abilities[a]===''))warnings.push('One or more ability scores were not recovered within the supported range.');
 out.skills=Object.fromEntries(SKILLS.map(n=>[n,c.skill_expertise?.includes(n)?2:c.skill_proficiencies?c.skill_proficiencies.includes(n)?1:0:-1]));
 out.background=text(c.background)||'';
 out.armour=(c.equipment_proficiencies||[]).filter(x=>/Armour|Shield/.test(x)).join('\n');
 out.weapons=(c.equipment_proficiencies||[]).filter(x=>!/Armour|Shield/.test(x)).join('\n');
 out.hp=integer(c.hp?.current)?c.hp.current:'';out.maxHp=integer(c.hp?.max)?c.hp.max:'';out.tempHp=integer(c.hp?.temp)?c.hp.temp:'';
 if(!c.hp)warnings.push('Hit points were not recovered.');
 const resources=c.resources||[];
 const movement=resources.find(r=>r.guid==='d6b2369d-84f0-4ca4-a3a7-62d2d192a185');
 out.speed=movement&&Number.isFinite(movement.max)&&movement.max>=0&&movement.max<=1000?movement.max:'';
 // Resolve the combat body slot exactly: VanityBody is camp clothing.
 // Keep an explicit saved total as a fallback for unsupported armour.
 const wornItems=c.equipped||[];
 const passives=new Set(c.selected_passives||[]);
 if(Number.isInteger(out.abilities.dex)) {
   const dex=Math.floor((out.abilities.dex-10)/2);
   const armourItem=wornItems.find(i=>/^(Body|Breast)$/i.test(i.slot||''))||wornItems.find(i=>!i.slot&&!/Camp|Underwear|Helmet|Glove|Boot|Hat/i.test(i.stats||'')&&/ARM_|Armor/i.test(i.stats||''));
   const armourText=`${armourItem?.name||''} ${armourItem?.stats||''}`;
   const armourBases=[[/Spidersilk/i,12,Infinity],[/Breastplate/i,14,2],[/Half.?Plate/i,15,2],[/Scale Mail|ScaleMail/i,14,2],[/Studded Leather|Studded/i,12,Infinity],[/Leather/i,11,Infinity],[/Plate/i,18,0],[/Splint/i,17,0],[/Chain Mail|ChainMail/i,16,0],[/Chain Shirt|ChainShirt/i,13,2],[/Hide/i,12,2],[/Ring Mail|RingMail/i,14,0]];
   const match=armourBases.find(([pattern])=>pattern.test(armourText));
   const base=match?match[1]:10, dexCap=match?match[2]:Infinity;
   const enhancement=Number((armourItem?.name||'').match(/\+(\d+)/)?.[1]||0);
   const shieldItem=wornItems.find(i=>/Shield|Warboard/i.test(`${i.name||''} ${i.stats||''}`));
   const shieldBonus=shieldItem?2+Number((shieldItem.name||'').match(/\+(\d+)/)?.[1]||0):0;
   const derived=base+enhancement+(dexCap===0?0:Math.min(dexCap,dex))+shieldBonus+(match&&passives.has('FightingStyle_Defense')?1:0);
   out.ac=match||shieldItem?derived:(Number.isFinite(c.armour_class)?c.armour_class:'');
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
 const attackItems=equippedOrdered.filter(i=>weaponProperties(i));
 const attackLines=attackItems.map(i=>{
   const w=weaponProperties(i),str=modifier(out.abilities.str),dex=modifier(out.abilities.dex);
   const m=w.ability==='finesse'?(str===null||dex===null?null:Math.max(str,dex)):w.ability==='dex'?dex:str;
   const proficiencies=c.equipment_proficiencies;
   const ranged=w.ability==='dex',archery=ranged&&passives.has('FightingStyle_Archery')?2:0;
   const archeryGloves=ranged&&wornItems.some(x=>x.stats==='UNI_ARM_OfArchery_Gloves')?2:0;
   const proficient=proficiencies?.some(p=>p===w.group+' Weapons'||p.toLowerCase()===w.name.toLowerCase()||p.toLowerCase()===w.name.toLowerCase()+'s');
   const prof=integer(c.proficiency_bonus,0,10)?c.proficiency_bonus:2+Math.floor((out.classes.reduce((n,x)=>n+x.level,0)-1)/4);
   const allIn=ranged&&proficient&&c.passive_toggles?.Sharpshooter_AllIn===true;
   const bonus=m===null||!proficiencies?null:m+(proficient?prof:0)+w.enhancement+archery-(allIn?5:0);
   const offhand=/Offhand/.test(i.slot||'');
   const damageAbility=offhand&&m>0&&!passives.has('FightingStyle_TwoWeaponFighting')?0:m;
   const twoHanded=!ranged&&!offhand&&['Quarterstaff','Spear','Longsword','Battleaxe','Warhammer'].includes(w.name)&&!equippedOrdered.some(x=>/Melee Offhand/.test(x.slot||''));
   const die=twoHanded?(w.die==='1d6'?'1d8':'1d10'):w.die;
   const duelling=!twoHanded&&!ranged&&passives.has('FightingStyle_Dueling')&&!equippedOrdered.some(x=>/Melee Offhand/.test(x.slot||'')&&weaponProperties(x))&&!/Great|Maul|Glaive|Halberd|Pike/.test(w.name)?2:0;
   const damageMod=m===null?null:damageAbility+w.enhancement+archeryGloves+duelling+(allIn?10:0);
   const sign=n=>n>=0?'+'+n:String(n);
   return `${i.name||i.stats}: ${bonus===null?'?':sign(bonus)} to hit, ${die}${damageMod===null?' + ?':damageMod?' '+sign(damageMod):''} ${w.damage}`;
 });
 out.attacks=attackLines.join('\n');
 const gold=(c.carried||[]).filter(i=>['OBJ_GoldCoin','OBJ_GoldPile'].includes(i.stats));
 out.gold=gold.length&&gold.every(i=>i.count_known!==false&&integer(i.count))?gold.reduce((sum,i)=>sum+i.count,0):'';
 out.features=(c.feats||[]).map(f=>`${f.name||f.guid} (level ${f.level})${f.picks?.length?': '+f.picks.join(', '):''}`).join('\n');
 if(c.illithid_powers?.length)out.features+='\n\nIllithid powers\n'+c.illithid_powers.join('\n');
 const spells=c.spells||[];
 const combatActions=/^(Action Surge|Flourish|Menacing Attack(?: \((?:Melee|Ranged)\))?|Piercing Shot|Piercing Strike|Second Wind|Sweeping Attack|Weakening Strike|Astral Knowledge|Fey Presence|Radiance of the Dawn|Turn Undead)$/i;
 // A spell can be present once for its class list, once for its subclass and
 // again in the prepared list. Merge those records before printing.
 const uniqueSpells=new Map();
 for(const s of spells) if(s.category==='spell'&&!combatActions.test(String(s.name||''))){
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
 out.conditions=c.concentration?'Concentrating: '+(c.concentration.name||c.concentration.id):'';
 if(Object.hasOwn(c.passive_toggles||{},'Sharpshooter_AllIn'))out.conditions+=(out.conditions?'\n':'')+'Sharpshooter: All In '+(c.passive_toggles.Sharpshooter_AllIn?'ON (−5 ranged attack, +10 damage)':'OFF');
 if(c.spells_note)warnings.push('Spellbook: '+c.spells_note+'.');
 if(c.equipment_note)warnings.push('Equipment: '+c.equipment_note+'.');
 if(!c.feats)warnings.push('Feat choices were not recovered; an empty list does not mean no feats.');
 out.spellAbility=text(c.spellcasting_ability)||'';
 out.importSummary='Imported from '+text(report.source)+'. '+warnings.join(' ');
 // These are deliberately left as clean writing areas. Save metadata and
 // parser diagnostics belong in the import notice, never in the character's
 // personal notes or appearance section.
 out.story='';
 out.notes='';
 return {sheet:out,warnings,missing:''};
}
