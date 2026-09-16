import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {resolveInventory} from '../src/inventory-ownership.mjs';
const compiled=await build({entryPoints:['vendor/bg3-savefile-parser/ts/parser/src/lsmf.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {parseLsmfStackAmounts,parseLsmfStackGroups,parseLsmfInventories}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const compiledParty=await build({entryPoints:['vendor/bg3-savefile-parser/ts/parser/src/party.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {findCharacterNodeAt}=await import('data:text/javascript;base64,'+Buffer.from(compiledParty.outputFiles[0].text).toString('base64'));
// Entirely synthetic heap: the last stack has two members and three entries.
// The final entry lies outside the old, unadjusted descriptor bounds.
function fixture(amount=1735){
 const b=new Uint8Array(4096),v=new DataView(b.buffer),q=(p,n)=>v.setBigUint64(p,BigInt(n),true);
 q(16,2000);q(24,512);v.setUint32(32,512,true);v.setUint16(36,3,true);
 const descriptors=[['core.v0.EntityId',16,3,96],['game.inventory.v0.NewStackComponent',8,2,512],['game.inventory.v0.StackEntry',8,4,720]];
 let cursor=0;descriptors.forEach(([name,size,count,absolute],i)=>{b.set(new TextEncoder().encode(name),2048+cursor);const p=2560+i*48;q(p,cursor);q(p+8,name.length);v.setUint32(p+24,size,true);q(p+32,count);q(p+40,absolute-48);cursor+=name.length;});
 for(let i=0;i<3;i++)v.setUint32(96+i*16,i+1,true);
 q(512,600-48);q(520,632-48);
 for(const [p,lo,hi,start,end] of [[600,800,808,720,728],[632,808,824,728,752]]){q(p,lo-48);q(p+8,hi-48);q(p+16,start-48);q(p+24,end-48);}
 q(800,96-48);q(808,112-48);q(816,128-48);
 for(const [p,member,n] of [[720,0,160],[728,0,1000],[736,1,1],[744,0,amount-1000]]){v.setUint16(p,member,true);v.setUint16(p+2,51259,true);v.setUint32(p+4,n,true);}
 return b;
}
const id=n=>String(n).padStart(8,'0')+'-0000-0000-0000-000000000000';
test('stack parser reads final records, sums member entries and ignores padding',()=>{const amounts=parseLsmfStackAmounts(fixture());assert.equal(amounts.get(id(1)),160);assert.equal(amounts.get(id(2)),1735);assert.equal(amounts.get(id(3)),1);});
test('changed save bytes produce a changed gold count without substitution',()=>{assert.equal(parseLsmfStackAmounts(fixture(2207)).get(id(2)),2207);});
test('stack groups preserve the final stack members',()=>assert.deepEqual(parseLsmfStackGroups(fixture()).get(id(2)),[id(3)]));
test('inventory membership controls equipment and nested carried items',()=>{
 const containers=[{row:1,owner:'avatar',kind:0,items:['torch','bracers','bag']},{row:2,owner:'avatar',kind:1,items:['rapier','gloves']},{row:3,owner:'bag',kind:0,items:['gold']},{row:4,owner:'other',kind:0,items:['other-gold']},{row:5,owner:'other',kind:1,items:['sword']}];
 const result=resolveInventory(['torch','rapier','gloves'],containers,new Set(['bag']));
 assert.deepEqual(result.equipped,['rapier','gloves']);assert.deepEqual(result.carried,['torch','bracers','bag','gold']);
 containers[2].items.push('bag');assert.deepEqual(resolveInventory(['torch','rapier'],containers,new Set(['bag'])).carried,result.carried);
});
test('ambiguous owners and incomplete roots are not guessed',()=>{
 const c=[{row:1,owner:'one',kind:0,items:['a','b']},{row:2,owner:'two',kind:0,items:['c','d']}];
 assert.equal(resolveInventory(['a','b','c','d'],c,new Set()),null);assert.equal(resolveInventory(['a','b'],c,new Set()),null);
});

function inventoryFixture(){
 const b=new Uint8Array(4096),v=new DataView(b.buffer),q=(p,n)=>v.setBigUint64(p,BigInt(n),true);
 q(16,2000);q(24,512);v.setUint32(32,512,true);v.setUint16(36,6,true);
 const desc=[['core.v0.EntityId',16,3,96],['game.inventory.v1.ContainerComponent',32,2,400],['game.inventory.v0.ContainerSlotData',16,0,560],['game.inventory.v1.IsOwnedComponent',8,2,600],['game.inventory.v3.Type',8,2,700],['game.inventory.v4.DataComponent',16,2,720]];
 let cursor=0;desc.forEach(([name,size,count,absolute],i)=>{b.set(new TextEncoder().encode(name),2048+cursor);const p=2560+i*48;q(p,cursor);q(p+8,name.length);v.setUint32(p+24,size,true);q(p+32,count);q(p+40,absolute-48);cursor+=name.length;});
 for(let i=0;i<3;i++)v.setUint32(96+i*16,i+1,true);
 for(let i=0;i<2;i++){q(400+i*32,96+i*16-48);q(408+i*32,2**32+1);q(600+i*8,128-48);q(700+i*8,i);q(720+i*16,700+i*8-48);}
 for(const [i,component] of [1,3,5].entries()){const p=1600+i*32,start=1400+i*16;v.setUint32(start,41,true);v.setUint32(start+4,42,true);q(p,start-48);q(p+8,start-48+8);q(p+16,component);q(p+24,2);}
 return b;
}
test('live inventory decodes heap-relative owner lists, inline entries and type pointers',()=>{
 assert.deepEqual(parseLsmfInventories(inventoryFixture()),[
 {row:41,owner:id(3),kind:0,items:[id(1)]},
 {row:42,owner:id(3),kind:1,items:[id(2)]}
 ]);
});
test('out-of-range inventory owner pointers do not create another owner',()=>{
 const b=inventoryFixture();new DataView(b.buffer).setBigUint64(600,99999999n,true);
 assert.equal(parseLsmfInventories(b).some(c=>c.row===41),false);
});

// A party member standing on a surface carries TargetData bookkeeping nodes
// that repeat its own Translate. Those are not rival characters, so the
// position still identifies one character node and its inventory is attributed.
function nodesAt(pos){
 const nodes=[{name:'Characters',parent:-1,attrs:{},children:[1,4]},
  {name:'Character',parent:0,attrs:{Translate:pos},children:[2]},
  {name:'TargetData',parent:1,attrs:{},children:[3]},
  {name:'SurfaceLayerCheck',parent:2,attrs:{Translate:pos},children:[]},
  {name:'Character',parent:0,attrs:{Translate:[0,0,0]},children:[]}];
 return nodes;
}
test('a character on a surface is still found at its own position',()=>{
 const pos=[19.008907318115234,10.92578125,-185.4700927734375];
 assert.equal(findCharacterNodeAt(nodesAt(pos),pos),1);
});
test('two characters sharing a position remain ambiguous',()=>{
 const pos=[1,2,3],nodes=nodesAt(pos);nodes[4].attrs.Translate=pos;
 assert.equal(findCharacterNodeAt(nodes,pos),null);
});
