// Game enum and mechanics sources are documented in MECHANICS.md.
export const SKILL_ENUM=['Deception','Intimidation','Performance','Persuasion','Acrobatics','Sleight of Hand','Stealth','Arcana','History','Investigation','Nature','Religion','Athletics','Animal Handling','Insight','Medicine','Perception','Survival'];
const backgrounds={
 '8807a6c6-d8cf-494b-aec2-cc01d7517a56':['Sage','Arcana','History'],
 '633aa4be-365f-4358-ba56-e2b85f9a88ec':['Acolyte','Insight','Religion'],
 'ac38525a-222b-4280-9c8e-60d5533b675c':['Urchin','Sleight of Hand','Stealth'],
 '76925f0b-3ec8-4f42-86a9-cd4f745af2ac':['Charlatan','Deception','Sleight of Hand'],
 '1252a86e-9baa-4ccb-b8ce-2378ae006f0b':['Soldier','Athletics','Intimidation'],
 'efcb0b57-5d5a-4a54-a7b3-a618829fe379':['Folk Hero','Animal Handling','Survival'],
 '5b1e726f-52bf-4e93-a798-9f93c067ee7f':['Outlander','Athletics','Survival'],
 'e8c84134-5e91-4ecc-881a-efc47680129b':['Criminal','Deception','Stealth'],
 '229775c9-3044-4779-a3bb-532c39238e03':['Entertainer','Acrobatics','Performance'],
 'e9aeac40-6c4e-4d81-9a24-e9eeb6208e85':['Guild Artisan','Insight','Persuasion'],
 '7e820dee-a8fc-43b2-8661-2b404454bade':['Noble','History','Persuasion']
};
const saves={Barbarian:['str','con'],Bard:['dex','cha'],Cleric:['wis','cha'],Druid:['int','wis'],Fighter:['str','con'],Monk:['str','dex'],Paladin:['wis','cha'],Ranger:['str','dex'],Rogue:['dex','int'],Sorcerer:['con','cha'],Warlock:['wis','cha'],Wizard:['int','wis']};
const basic=['Simple Weapons'];
const weapons={Barbarian:[...basic,'Martial Weapons'],Bard:[...basic,'Hand Crossbows','Longswords','Rapiers','Shortswords'],Cleric:basic,Druid:['Clubs','Daggers','Javelins','Maces','Quarterstaffs','Scimitars','Sickles','Slings','Spears'],Fighter:[...basic,'Martial Weapons'],Monk:[...basic,'Shortswords'],Paladin:[...basic,'Martial Weapons'],Ranger:[...basic,'Martial Weapons'],Rogue:[...basic,'Hand Crossbows','Longswords','Rapiers','Shortswords'],Sorcerer:['Daggers','Quarterstaffs','Light Crossbows'],Warlock:basic,Wizard:['Daggers','Quarterstaffs','Light Crossbows']};
const armour={Barbarian:['Light Armour','Medium Armour','Shields'],Bard:['Light Armour'],Cleric:['Light Armour','Medium Armour','Shields'],Druid:['Light Armour','Medium Armour','Shields'],Fighter:['Light Armour','Medium Armour','Heavy Armour','Shields'],Monk:[],Paladin:['Light Armour','Medium Armour','Heavy Armour','Shields'],Ranger:['Light Armour','Medium Armour','Shields'],Rogue:['Light Armour'],Sorcerer:[],Warlock:['Light Armour'],Wizard:[]};
export function applySavedBuild(char,record,classNames){
 if(!record)return;
 const first=classNames[record.levels[0]?.[0]];
 if(!saves[first])return;
 char.saving_throw_proficiencies=[...saves[first]];
 const bg=backgrounds[record.background];char.background=bg?.[0]??null;
 if(record.skills!==null&&bg){
   const skills=new Set([...record.skills,...bg.slice(1)]);
   if(/^(Elf_|Drow_)/.test(char.race||''))skills.add('Perception');
   if(['Elf_WoodElf','HalfElf_Wood'].includes(char.race))skills.add('Stealth');
   char.skill_proficiencies=[...skills];char.skill_expertise=record.expertise||[];
 }
 char.selected_passives=record.passives||[];
 const equipment=new Set([...(weapons[first]||[]),...(armour[first]||[])]);
 // Apply only known multiclass grants; starting-class heavy armour is retained.
 for(const name of new Set(record.levels.slice(1).map(([id])=>classNames[id]))){
   if(name===first)continue;
   const additions={Fighter:['Simple Weapons','Martial Weapons','Light Armour','Medium Armour','Shields'],Paladin:['Simple Weapons','Martial Weapons','Light Armour','Medium Armour','Shields'],Ranger:['Simple Weapons','Martial Weapons','Light Armour','Medium Armour','Shields'],Barbarian:['Shields','Simple Weapons','Martial Weapons'],Cleric:['Light Armour','Medium Armour','Shields'],Druid:['Light Armour','Medium Armour','Shields'],Bard:['Light Armour'],Rogue:['Light Armour'],Warlock:['Light Armour','Simple Weapons'],Monk:['Simple Weapons','Shortswords']}[name]||[];
   additions.forEach(p=>equipment.add(p));
 }
 if(char.race==='Human'||/^HalfElf_/.test(char.race||''))['Light Armour','Shields','Spears','Pikes','Halberds','Glaives'].forEach(p=>equipment.add(p));
 if(/^Elf_/.test(char.race||''))['Longswords','Shortswords','Longbows','Shortbows'].forEach(p=>equipment.add(p));
 if(/^Drow_/.test(char.race||''))['Rapiers','Shortswords','Hand Crossbows'].forEach(p=>equipment.add(p));
 if(char.race==='Githyanki')['Light Armour','Medium Armour','Shortswords','Longswords','Greatswords'].forEach(p=>equipment.add(p));
 if(/^Dwarf_/.test(char.race||''))['Battleaxes','Handaxes','Light Hammers','Warhammers'].forEach(p=>equipment.add(p));
 if(char.race==='Dwarf_Shield')['Light Armour','Medium Armour'].forEach(p=>equipment.add(p));
 for(const [,sub] of record.levels){const name=classNames[sub];if(['LifeDomain','NatureDomain','TempestDomain','WarDomain'].includes(name))equipment.add('Heavy Armour');if(['TempestDomain','WarDomain'].includes(name))equipment.add('Martial Weapons');}
 char.equipment_proficiencies=[...equipment];
}
