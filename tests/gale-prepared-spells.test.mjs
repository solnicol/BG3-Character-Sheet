import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {adaptCharacter} from '../src/save-adapter.mjs';
test('Gale retains saved prepared Slow and Grant Flight',{skip:!process.env.HIRELINGS_SAVE},()=>{
 let report;const self={postMessage(m){if(m.kind==='error')throw Error(m.message);if(m.kind==='report')report=m.report;}};
 const ctx=vm.createContext({self,TextDecoder,TextEncoder,Uint8Array,ArrayBuffer,DataView,console});
 vm.runInContext(readFileSync(new URL('../assets/bg3-worker.js',import.meta.url),'utf8'),ctx);
 const b=readFileSync(process.env.HIRELINGS_SAVE);
 self.onmessage({data:{buffer:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),name:'Gale.lsv'}});
 const index=report.characters.findIndex(c=>c.name==='Gale');assert.ok(index>=0);
 for(const id of ['Target_Slow','Target_Fly']){
  const s=report.characters[index].spells.find(s=>s.id===id);
  assert.ok(s,id);assert.equal(s.prepared,true);assert.equal(s.source,18);assert.equal(s.level,3);
 }
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const blank=Function('return ('+html.match(/const blank=\(\)=>\((.+)\);/)[1]+')');
 const s=adaptCharacter(report,index,blank()).sheet;
 assert.match(s.spells,/Level 3: Slow \[prepared\]/);
 assert.match(s.spells,/Level 3: Grant Flight \[prepared\]/);
});

test('Gale retains prepared level-four subclass spells outside the main book',{skip:!process.env.LEVEL7_SAVE},()=>{
 let report;const self={postMessage(m){if(m.kind==='error')throw Error(m.message);if(m.kind==='report')report=m.report;}};
 const ctx=vm.createContext({self,TextDecoder,TextEncoder,Uint8Array,ArrayBuffer,DataView,console});
 vm.runInContext(readFileSync(new URL('../assets/bg3-worker.js',import.meta.url),'utf8'),ctx);
 const b=readFileSync(process.env.LEVEL7_SAVE);
 self.onmessage({data:{buffer:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),name:'Gale.lsv'}});
 const index=report.characters.findIndex(c=>c.name==='Gale');assert.ok(index>=0);
 const names=[];
 for(const id of ['Target_IceStorm','Target_ConjureElementals_Minor_Container']){
  const spell=report.characters[index].spells.find(s=>s.id===id);
  assert.ok(spell,id);assert.equal(spell.prepared,true);assert.equal(spell.source,1);assert.equal(spell.level,4);names.push(spell.name);
 }
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const blank=Function('return ('+html.match(/const blank=\(\)=>\((.+)\);/)[1]+')');
 const sheet=adaptCharacter(report,index,blank()).sheet;
 for(const name of names)assert.equal(sheet.spells.split('\n').filter(line=>line===`Level 4: ${name} [prepared]`).length,1);
 assert.equal(sheet.slots[3],'1 / 1');
 console.log('Level 4:',names.join(', '));
});
