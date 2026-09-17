// Base weapon properties. Final attack totals still require saved boosts.
const weapons = [
 ['Heavy Crossbow','1d10','piercing','dex','Martial'],['Light Crossbow','1d8','piercing','dex','Simple'],['Hand Crossbow','1d6','piercing','dex','Martial'],
 ['Longbow','1d8','piercing','dex','Martial'],['Shortbow','1d6','piercing','dex','Simple'],
 ['Rapier','1d8','piercing','finesse','Martial'],['Shortsword','1d6','piercing','finesse','Martial'],['Scimitar','1d6','slashing','finesse','Martial'],['Dagger','1d4','piercing','finesse','Simple'],
 ['Greatsword','2d6','slashing','str','Martial'],['Longsword','1d8','slashing','str','Martial'],['Greataxe','1d12','slashing','str','Martial'],['Battleaxe','1d8','slashing','str','Martial'],['Handaxe','1d6','slashing','str','Simple'],
 ['Warhammer','1d8','bludgeoning','str','Martial'],['Light Hammer','1d4','bludgeoning','str','Simple'],['Maul','2d6','bludgeoning','str','Martial'],['Mace','1d6','bludgeoning','str','Simple'],['Quarterstaff','1d6','bludgeoning','str','Simple'],['Spear','1d6','piercing','str','Simple'],['Javelin','1d6','piercing','str','Simple'],['Club','1d4','bludgeoning','str','Simple'],
 // Polearms and the rest, each checked against its published stat block.
 // gamedata.json agrees on the grip: all 11 glaives and all 12 halberds it
 // lists are flagged two-handed, and none of the tridents, war picks or
 // sickles are.
 ['Glaive','1d10','slashing','str','Martial'],['Halberd','1d10','slashing','str','Martial'],
 ['Trident','1d6','piercing','str','Martial'],['War Pick','1d8','piercing','str','Martial'],
 ['Sickle','1d4','slashing','str','Simple'],
 // Flail and morningstar are one-handed martial; the pike is two-handed with
 // extra reach, so its 1d10 is already the two-handed die and it takes no
 // versatile upgrade. Both flail and morningstar grant Tenacity, which deals
 // damage on a miss and so belongs to neither figure on an attack line.
 ['Flail','1d8','bludgeoning','str','Martial'],['Morningstar','1d8','piercing','str','Martial'],
 ['Pike','1d10','piercing','str','Martial']
];
// Larian spells the quarterstaff three ways across its identifiers: the
// ordinary Quarterstaff, a bare Staff, and a Quaterstaff typo. All three are
// the same weapon. The Staff match deliberately has no closing boundary, so
// that UNI_StaffOfRain counts: its display name, Rain Dancer, says nothing.
// Checked only after the table above, so a real family always wins.
const QUARTERSTAFF=/Quaterstaff|\bStaff/i;
// A magic weapon carries its enhancement in the item, not in its display name,
// so the +N read off the name below finds nothing for it. Each entry here is
// taken from the weapon's published stat block and keyed on the stats ID, which
// is stable across saves and localisations. `extra` names an ability whose
// modifier the weapon adds to damage on top of its own, with `extraMin` as the
// floor the weapon guarantees.
export const NAMED_WEAPONS=new Map([
 // Titanstring Bow: a +1 longbow whose Titan Weapon property adds the wielder's
 // Strength modifier to damage, never less than 1.
 ['MAG_StrongString_Longbow',{name:'Titanstring Bow',enhancement:1,extra:'str',extraMin:1}],
 // `base` names the weapon this is built on, for the items whose identifier
 // says nothing about it, and `ability` overrides how the attack is rolled.
 //
 // Phalar Aluve: a +1 longsword, and finesse, which an ordinary longsword is
 // not. Its identifier, UND_SwordInStone, names the puzzle rather than the
 // weapon.
 ['UND_SwordInStone',{name:'Phalar Aluve',base:'Longsword',enhancement:1,ability:'finesse'}],
 // Sharran Crossbow: a light crossbow, and shown as 'Light Crossbow +1' until
 // a History check reveals the name the save stores. The revealed name is the
 // one that loses the +1.
 ['UND_SharranCrossbow',{name:'Sharran Crossbow',base:'Light Crossbow',enhancement:1}],
 // Least Expected: a shortbow. Its +1d4 applies only while its wielder is
 // obscured, so it is a condition rather than an enhancement and scores as 0.
 ['MAG_Shadow_Blinding_Bow',{name:'Least Expected',base:'Shortbow',enhancement:0}],
 // Rain Dancer: a quarterstaff whose stat block reads 'Enchantment: None'. It
 // is listed for that zero, which is what stops the note below calling its
 // figures possibly understated; its Create Water charge is not an
 // enhancement. An entry is as much use for a verified nothing as for a +1.
 ['UNI_StaffOfRain',{name:'Rain Dancer',base:'Quarterstaff',enhancement:0}],
 // The table already places these; only the enchantment line was unreadable.
 // Each rider they carry is conditional — on low health, on advantage, on a
 // burning target — so none of it reaches a resting attack or damage figure.
 ['MAG_LowHP_IncreaseDamage_Greataxe',{name:'Blooded Greataxe',enhancement:1}],
 ['MAG_BG_Darkfire_Shortbow',{name:'Darkfire Shortbow',enhancement:2}],
 ['MAG_Blindside_Shortsword',{name:'Render of Mind and Body',enhancement:1}],
 ['MAG_Slicing_Shortsword',{name:'Slicing Shortsword',enhancement:1}],
 ['MAG_Orthon_Hellfire_HandCrossbow',{name:'Hellfire Hand Crossbow',enhancement:2}],
 // Firestoker reads 'Enchantment: None'; its 1d4 applies only to a burning
 // target, so the zero is the whole of it.
 ['MAG_Fire_IncreasePiercingDamageToBurning_HandCrossbow',{name:'Firestoker',enhancement:0}],
]);
// An equipped weapon that is not a plain WPN_ entry, carries no +N in its name
// and is not listed above may hold an enhancement the sheet cannot see.
export function weaponEnhancementUnknown(item){
 const stats=item.stats||'';
 return Boolean(stats)&&!/^WPN_/.test(stats)&&!NAMED_WEAPONS.has(stats)&&!/\+(\d+)\b/.test(item.name||'');
}
export function weaponProperties(item) {
 const aliases={DEN_TunnelStaff:'Quarterstaff',UNI_Entangle_Quarterstaff:'Quarterstaff',DEN_Entrap_Quarterstaff:'Quarterstaff'};
 const label=`${item.name||''} ${item.stats||''} ${aliases[item.stats]||''}`.replaceAll('_',' ');
 const named=NAMED_WEAPONS.get(item.stats);
 const row=(named?.base?weapons.find(([name])=>name===named.base):undefined)
  ?? weapons.find(([name])=>new RegExp(`\\b${name.replaceAll(' ','\\s*')}\\b`,'i').test(label))
  ?? (QUARTERSTAFF.test(label)?weapons.find(([name])=>name==='Quarterstaff'):undefined);
 if(!row)return null;
 return {name:row[0],die:row[1],damage:row[2],ability:named?.ability??row[3],group:row[4],
  enhancement:named?named.enhancement:Number((item.name||'').match(/\+(\d+)\b/)?.[1]||0),
  extra:named?.extra??null,extraMin:named?.extraMin??0};
}
