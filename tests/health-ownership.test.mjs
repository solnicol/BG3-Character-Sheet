import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {adaptCharacter} from '../src/save-adapter.mjs';
const compiled=await build({entryPoints:['vendor/bg3-savefile-parser/ts/parser/src/lsmf.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {parseLsmfHealth}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
function fixture(values=[26,77,3,3]){
 const b=new Uint8Array(4096),v=new DataView(b.buffer),q=(p,n)=>v.setBigUint64(p,BigInt(n),true);
 q(16,2000);q(24,512);v.setUint32(32,512,true);v.setUint16(36,2,true);
 let cursor=0;
 [['core.v0.EntityId',16,4,96],['game.stats.v0.HealthComponent',32,2,512]].forEach(([name,size,count,absolute],i)=>{
  b.set(new TextEncoder().encode(name),2048+cursor);const p=2560+i*48;
  q(p,cursor);v.setUint32(p+8,name.length,true);v.setUint32(p+24,size,true);q(p+32,count);q(p+40,absolute-48);cursor+=name.length;
 });
 for(let i=0;i<4;i++)v.setUint32(96+i*16,i+1,true);
 // Sparse owners, reverse order: record 0 belongs to entity 3, record 1 to 1.
 v.setUint32(1400,3,true);v.setUint32(1404,1,true);
 q(1600,1400-48);q(1608,1408-48);q(1616,1);q(1624,2);
 [values,[0,60,0,0]].forEach((row,i)=>row.forEach((n,k)=>v.setInt32(512+i*32+k*4,n,true)));
 return b;
}
const id=n=>String(n).padStart(8,'0')+'-0000-0000-0000-000000000000';
test('health follows explicit sparse owners, including damaged and zero-current HP',()=>{
 const h=parseLsmfHealth(fixture());assert.deepEqual(h.get(id(4)),[26,77,3,3]);assert.deepEqual(h.get(id(2)),[0,60,0,0]);assert.equal(h.has(id(1)),false);
});
test('health preserves changed saved totals without a class formula or arbitrary cap',()=>{
 assert.deepEqual(parseLsmfHealth(fixture([4010,5000,250,300])).get(id(4)),[4010,5000,250,300]);
});
test('invalid owner or absent health does not substitute another record',()=>{
 const b=fixture();new DataView(b.buffer).setUint32(1400,1000,true);const h=parseLsmfHealth(b);assert.equal(h.has(id(4)),false);assert.deepEqual(h.get(id(2)),[0,60,0,0]);assert.equal(parseLsmfHealth(new Uint8Array(48)).size,0);
});
test('level-seven save imports Neith exact health through the worker and adapter',{skip:!process.env.LEVEL7_SAVE},()=>{
 let report;const self={postMessage(m){if(m.kind==='error')throw Error(m.message);if(m.kind==='report')report=m.report;}};
 const ctx=vm.createContext({self,TextDecoder,TextEncoder,Uint8Array,ArrayBuffer,DataView,console});
 vm.runInContext(readFileSync(new URL('../assets/bg3-worker.js',import.meta.url),'utf8'),ctx);
 const b=readFileSync(process.env.LEVEL7_SAVE);self.onmessage({data:{buffer:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),name:'save.lsv'}});
 const i=report.characters.findIndex(c=>c.name==='Neith');assert.ok(i>=0);
 assert.equal(JSON.stringify(report.characters[i].hp),JSON.stringify({current:77,max:77,temp:3,temp_max:3}));
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');const blank=Function('return ('+html.match(/const blank=\(\)=>\((.+)\);/)[1]+')');
 const {sheet}=adaptCharacter(report,i,blank());assert.equal(sheet.hp,77);assert.equal(sheet.maxHp,77);assert.equal(sheet.tempHp,3);
});
