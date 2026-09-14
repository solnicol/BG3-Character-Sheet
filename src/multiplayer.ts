import {lsmfComponentIndex,parseLsmfFeats} from '../vendor/bg3-savefile-parser/ts/parser/src/lsmf';
// Creation stats and level-up histories are parallel creation-order tables.
// Match their named build to SaveInfo only when both tables are complete and
// the build is unique. Never reuse the save leader for other custom avatars.
export function recoverPlayerNames(nodes:any[],party:any[],dn:any):Map<any,string>{
 const out=new Map<any,string>();
 const blob=nodes.find(n=>n.name==='NewAge'&&n.parent===-1)?.attrs.NewAge;
 if(!(blob instanceof Uint8Array))return out;
 const comp=lsmfComponentIndex(blob).get('game.character_creation.v1.CharacterCreationStatsComponent');
 const histories=parseLsmfFeats(blob);
 if(comp?.elemSize!==88||histories.length!==comp.rowCount)return out;
 const dv=new DataView(blob.buffer,blob.byteOffset,blob.byteLength),decoder=new TextDecoder('utf-8',{fatal:true});
 const named=new Map<string,string[]>();
 for(let i=0;i<comp.rowCount;i++){
  const p=comp.dataOffset+48+i*88;if(p+88>blob.length)return new Map();
  const ptr=Number(dv.getBigUint64(p+56,true))+48,len=dv.getUint32(p+64,true);
  if(len<1||len>128||ptr<48||ptr+len>blob.length)return new Map();
  let name;try{name=decoder.decode(blob.subarray(ptr,ptr+len))}catch{return new Map()}
  const classes=new Map<string,string>();
  for(const[c,s]of histories[i].levels){const main=dn.classUuidNames[c];if(!main)return new Map();classes.set(main,dn.classUuidNames[s]||classes.get(main)||'');}
  const key=[...classes].map(([c,s])=>c+'|'+s).sort().join(';')+'@'+histories[i].levels.length;
  named.set(key,[...(named.get(key)||[]),name]);
 }
 for(const ci of party){
  const key=(ci.Classes||[]).map((c:any)=>c.Main+'|'+(c.Sub||'')).sort().join(';')+'@'+ci.Level;
  const names=named.get(key);if(names?.length===1)out.set(ci,names[0]);
 }
 return out;
}
