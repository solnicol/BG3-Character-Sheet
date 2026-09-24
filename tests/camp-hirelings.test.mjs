import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {adaptCharacter} from '../src/save-adapter.mjs';
// Private fixture remains outside the repository. Rebuild before running.
test('two camp hirelings retain separate names, builds and inventory',{skip:!process.env.HIRELINGS_SAVE},()=>{
 let report;const self={postMessage(m){if(m.kind==='error')throw Error(m.message);if(m.kind==='report')report=m.report;}};
 const context=vm.createContext({self,TextDecoder,TextEncoder,Uint8Array,ArrayBuffer,DataView,console});
 vm.runInContext(readFileSync(new URL('../assets/bg3-worker.js',import.meta.url),'utf8'),context);
 const b=readFileSync(process.env.HIRELINGS_SAVE);
 self.onmessage({data:{buffer:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),name:'Hirelings.lsv'}});
 const find=n=>report.characters.filter(c=>c.name===n);
 assert.equal(find('Athena').length,1);assert.equal(find('Circe').length,1);
 const [athena]=find('Athena'),[circe]=find('Circe');
 assert.equal(athena.at_camp,true);assert.equal(circe.at_camp,true);
 assert.equal(athena.class_levels[0].name,'Monk');assert.equal(athena.class_levels[0].level,5);
 assert.equal(circe.class_levels.map(c=>`${c.name}:${c.level}`).join(','),'Bard:3,Wizard:2');
 assert.equal(athena.hp.max,38);assert.equal(circe.hp.max,31);
 assert.ok(athena.equipped.some(i=>i.stats==='UNI_ARM_OfDefense_Gloves'));
 assert.ok(!circe.equipped.some(i=>i.stats==='UNI_ARM_OfDefense_Gloves'));
 assert.ok(circe.equipped.some(i=>i.name==="Spider's Lyre"));
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const blank=Function('return ('+html.match(/const blank=\(\)=>\((.+)\);/)[1]+')');
 assert.equal(adaptCharacter(report,report.characters.indexOf(circe),blank()).sheet.ac,13);
});
