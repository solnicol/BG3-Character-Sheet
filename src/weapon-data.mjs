// Base weapon properties. Final attack totals still require saved boosts.
const weapons = [
 ['Heavy Crossbow','1d10','piercing','dex','Martial'],['Light Crossbow','1d8','piercing','dex','Simple'],['Hand Crossbow','1d6','piercing','dex','Martial'],
 ['Longbow','1d8','piercing','dex','Martial'],['Shortbow','1d6','piercing','dex','Simple'],
 ['Rapier','1d8','piercing','finesse','Martial'],['Shortsword','1d6','piercing','finesse','Martial'],['Scimitar','1d6','slashing','finesse','Martial'],['Dagger','1d4','piercing','finesse','Simple'],
 ['Greatsword','2d6','slashing','str','Martial'],['Longsword','1d8','slashing','str','Martial'],['Greataxe','1d12','slashing','str','Martial'],['Battleaxe','1d8','slashing','str','Martial'],['Handaxe','1d6','slashing','str','Simple'],
 ['Warhammer','1d8','bludgeoning','str','Martial'],['Light Hammer','1d4','bludgeoning','str','Simple'],['Maul','2d6','bludgeoning','str','Martial'],['Mace','1d6','bludgeoning','str','Simple'],['Quarterstaff','1d6','bludgeoning','str','Simple'],['Spear','1d6','piercing','str','Simple'],['Javelin','1d6','piercing','str','Simple'],['Club','1d4','bludgeoning','str','Simple']
];
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
 const row=weapons.find(([name])=>new RegExp(`\\b${name.replaceAll(' ','\\s*')}\\b`,'i').test(label));
 if(!row)return null;
 const named=NAMED_WEAPONS.get(item.stats);
 return {name:row[0],die:row[1],damage:row[2],ability:row[3],group:row[4],
  enhancement:named?named.enhancement:Number((item.name||'').match(/\+(\d+)\b/)?.[1]||0),
  extra:named?.extra??null,extraMin:named?.extraMin??0};
}
