import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const compiled=await build({entryPoints:['vendor/bg3-savefile-parser/ts/parser/src/lsmf.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {parseLsmfOwnedSpells}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
function fixture(){
 const b=new Uint8Array(4096),v=new DataView(b.buffer),q=(p,n)=>v.setBigUint64(p,BigInt(n),true);
 q(16,2000);q(24,512);v.setUint32(32,512,true);v.setUint16(36,3,true);
 let cursor=0;
 [['core.v0.EntityId',16,4,96],['game.spell.v0.LearnedSpells',32,2,512],['game.spell.v0.SpellBookPrepares',80,2,640]].forEach(([name,size,count,absolute],i)=>{
  b.set(new TextEncoder().encode(name),2048+cursor);const p=2560+i*48;
  q(p,cursor);v.setUint32(p+8,name.length,true);v.setUint32(p+24,size,true);q(p+32,count);q(p+40,absolute-48);cursor+=name.length;
 });
 for(let i=0;i<4;i++)v.setUint32(96+i*16,i+1,true);
 // Reverse owner order between components: entity 3 learned both spells but
 // prepared only Confusion; entity 1 prepared Wall of Fire instead.
 for(const [i,owners] of [[0,[3,1]],[1,[1,3]]]){
  const start=1400+i*16,p=1600+i*32;
  owners.forEach((n,j)=>v.setUint32(start+j*4,n,true));q(p,start-48);q(p+8,start-48+8);q(p+16,i+1);q(p+24,2);
 }
 const vector=(p,lo,len)=>{q(p,lo-48);q(p+8,lo-48+len);};
 const str=(p,at,name)=>{b.set(new TextEncoder().encode(name),at);q(p,at-48);v.setUint32(p+8,name.length,true);};
 vector(512,900,32);vector(916,1000,32);
 str(1000,1800,'Wall_WallOfFire');str(1016,1830,'Target_Confusion');
 vector(640,1100,24);str(1100,1800,'Wall_WallOfFire');q(1116,1200-48);
 vector(720,1124,24);str(1124,1830,'Target_Confusion');q(1140,1200-48);
 q(1200,1250-48);q(1250,18);
 return b;
}
const id=n=>String(n).padStart(8,'0')+'-0000-0000-0000-000000000000';
test('scribed and prepared spells join by owner despite different component row orders',()=>{
 const s=parseLsmfOwnedSpells(fixture());assert.deepEqual(s.get(id(4)).known,['Wall_WallOfFire','Target_Confusion']);assert.deepEqual(s.get(id(4)).prepared.map(s=>s[0]),['Target_Confusion']);assert.deepEqual(s.get(id(2)).prepared.map(s=>s[0]),['Wall_WallOfFire']);assert.equal(s.has(id(1)),false);
});
test('invalid spell owners never donate spells to another character',()=>{
 const b=fixture();new DataView(b.buffer).setUint32(1400,999,true);
 assert.deepEqual(parseLsmfOwnedSpells(b).get(id(4)).known,['Target_Confusion']);
});
