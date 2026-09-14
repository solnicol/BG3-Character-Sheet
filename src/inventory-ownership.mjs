// Position is used only to identify a character's root owner. Container
// membership then determines all items, including nested bags and moved gear.
export function resolveInventory(anchors, containers, itemEntities) {
 const claims=new Map();
 for(const c of containers)if(!itemEntities.has(c.owner)&&(c.kind===0||c.kind===1))for(const id of c.items){if(!claims.has(id))claims.set(id,new Set());claims.get(id).add(c.owner);}
 const votes=new Map();
 for(const id of new Set(anchors)){const owners=claims.get(id);if(owners?.size===1){const owner=[...owners][0];votes.set(owner,(votes.get(owner)||0)+1);}}
 const ranked=[...votes].sort((a,b)=>b[1]-a[1]);
 if(!ranked.length||ranked[0][1]<2||(ranked[1]&&ranked[0][1]===ranked[1][1]))return null;
 // Reject substantial conflicting attribution instead of choosing another avatar.
 const total=ranked.reduce((n,[,v])=>n+v,0);if(ranked[0][1]<total*.8)return null;
 const owner=ranked[0][0],byOwner=new Map();
 for(const c of containers){if(!byOwner.has(c.owner))byOwner.set(c.owner,[]);byOwner.get(c.owner).push(c);}
 const root=byOwner.get(owner)||[];
 if(!root.some(c=>c.kind===0)||!root.some(c=>c.kind===1))return null;
 const equipped=new Set(root.filter(c=>c.kind===1).flatMap(c=>c.items)),carried=new Set(),seen=new Set();
 const queue=root.filter(c=>c.kind===0);
 while(queue.length){const c=queue.shift();if(seen.has(c.row))continue;seen.add(c.row);for(const id of c.items){if(!equipped.has(id))carried.add(id);queue.push(...(byOwner.get(id)||[]).filter(x=>x.kind===0));}}
 return {owner,equipped:[...equipped],carried:[...carried]};
}
