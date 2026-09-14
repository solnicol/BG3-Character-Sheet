// Active statuses live under each character node as StatusManager > STATUS
// children. They carry no entity id, so they are read from the character's own
// node in the globals tree, the same anchor the parser already uses to
// attribute worn items.
//
// LifeTime separates the two kinds. Statuses the game lists under Conditions
// carry a finite or timed lifetime; the permanent ones (-1) are the bookkeeping
// the panel never shows: item auras, carried-object flags and _TECHNICAL
// appliers. Verified against a save whose panel showed exactly the two
// non-permanent entries and none of the five permanent ones.

export interface StatusRef {id:string; permanent:boolean}

/** Statuses on a character's StatusManager, in save order. */
export function collectStatuses(nodes:any[],charNi:number|undefined):StatusRef[]{
 if(charNi===undefined||!Array.isArray(nodes))return [];
 const out:StatusRef[]=[];
 for(const n of nodes){
  if(n?.name!=='STATUS'||typeof n.parent!=='number'||n.parent<0)continue;
  const manager=nodes[n.parent];
  if(manager?.name!=='StatusManager'||manager.parent!==charNi)continue;
  const id=n.attrs?.ID;
  if(typeof id!=='string'||!id)continue;
  out.push({id,permanent:n.attrs?.LifeTime===-1});
 }
 return out;
}
