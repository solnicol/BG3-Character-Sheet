// Base weapon properties. Final attack totals still require saved boosts.
const weapons = [
 ['Heavy Crossbow','1d10','piercing','dex','Martial'],['Light Crossbow','1d8','piercing','dex','Simple'],['Hand Crossbow','1d6','piercing','dex','Martial'],
 ['Longbow','1d8','piercing','dex','Martial'],['Shortbow','1d6','piercing','dex','Simple'],
 ['Rapier','1d8','piercing','finesse','Martial'],['Shortsword','1d6','piercing','finesse','Martial'],['Scimitar','1d6','slashing','finesse','Martial'],['Dagger','1d4','piercing','finesse','Simple'],
 ['Greatsword','2d6','slashing','str','Martial'],['Longsword','1d8','slashing','str','Martial'],['Greataxe','1d12','slashing','str','Martial'],['Battleaxe','1d8','slashing','str','Martial'],['Handaxe','1d6','slashing','str','Simple'],
 ['Warhammer','1d8','bludgeoning','str','Martial'],['Light Hammer','1d4','bludgeoning','str','Simple'],['Maul','2d6','bludgeoning','str','Martial'],['Mace','1d6','bludgeoning','str','Simple'],['Quarterstaff','1d6','bludgeoning','str','Simple'],['Spear','1d6','piercing','str','Simple'],['Javelin','1d6','piercing','str','Simple'],['Club','1d4','bludgeoning','str','Simple']
];
export function weaponProperties(item) {
 const aliases={DEN_TunnelStaff:'Quarterstaff',UNI_Entangle_Quarterstaff:'Quarterstaff',DEN_Entrap_Quarterstaff:'Quarterstaff'};
 const label=`${item.name||''} ${item.stats||''} ${aliases[item.stats]||''}`.replaceAll('_',' ');
 const row=weapons.find(([name])=>new RegExp(`\\b${name.replaceAll(' ','\\s*')}\\b`,'i').test(label));
 return row ? {name:row[0],die:row[1],damage:row[2],ability:row[3],group:row[4],enhancement:Number((item.name||'').match(/\+(\d+)\b/)?.[1]||0)} : null;
}
