import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const compiled=await build({entryPoints:['vendor/bg3-savefile-parser/ts/parser/src/lsmf.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {parseLsmfAbilityScoresByGuid}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const id=n=>String(n).padStart(8,'0')+'-0000-0000-0000-000000000000';
// Entirely synthetic heap. Descriptor offsets and ownerlist starts are
// heap-relative (48 bytes short of the absolute position), and the stats
// ownerlist is deliberately not in entity order: row k belongs to the entity
// named in ownerlist slot k, never to a neighbouring row.
function fixture(records,owners){
 const b=new Uint8Array(8192),v=new DataView(b.buffer),q=(p,n)=>v.setBigUint64(p,BigInt(n),true);
 const names=['core.v0.EntityId','game.stats.v3.StatsComponent'];
 q(16,2000);q(24,64);v.setUint32(32,512,true);v.setUint16(36,2,true);
 const n=records.length,comps=[[16,3000,3400],[36,3200,3440]];
 let cursor=0;names.forEach((name,i)=>{b.set(new TextEncoder().encode(name),2048+cursor);const p=2560+i*48;q(p,cursor);v.setUint32(p+8,name.length,true);v.setUint32(p+24,comps[i][0],true);q(p+32,n);q(p+40,comps[i][1]-48);cursor+=name.length;});
 for(let e=0;e<n;e++)b[3000+e*16]=e+1;
 records.forEach((r,k)=>{v.setUint32(3200+k*36,7,true);r.forEach((x,i)=>v.setInt32(3200+k*36+8+i*4,x,true));});
 for(let k=0;k<n;k++){v.setUint32(3400+k*4,k,true);v.setUint32(3440+k*4,owners[k],true);}
 comps.forEach(([,,list],i)=>{const p=3600+i*32;q(p,list-48);q(p+8,list-48+n*4);q(p+16,i);q(p+24,n);});
 return b;
}
const savros=[8,14,16,8,19,10,3],neith=[10,20,16,8,14,8,3],bob=[8,16,14,8,10,20,3];
test('ability scores follow the explicit stats ownerlist, not row order',()=>{
 const scores=parseLsmfAbilityScoresByGuid(fixture([savros,neith,bob],[2,0,1]));
 assert.deepEqual(scores.get(id(3)),savros);assert.deepEqual(scores.get(id(1)),neith);assert.deepEqual(scores.get(id(2)),bob);
});
test('records outside the valid score and proficiency ranges are skipped',()=>{
 const scores=parseLsmfAbilityScoresByGuid(fixture([[0,10,10,10,10,10,2],neith,[10,10,10,10,10,10,11]],[0,1,2]));
 assert.equal(scores.size,1);assert.deepEqual(scores.get(id(2)),neith);
});
