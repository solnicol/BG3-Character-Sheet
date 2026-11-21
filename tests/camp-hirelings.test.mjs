import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {adaptCharacter} from '../src/save-adapter.mjs';
// Private fixture remains outside the repository. Rebuild before running.
for(const [label,save] of [['original region',process.env.HIRELINGS_SAVE],['after region travel',process.env.HIRELINGS_TRAVEL_SAVE]]){
test(`two camp hirelings retain separate names, builds and inventory: ${label}`,{skip:!save},()=>{
 let report;const self={postMessage(m){if(m.kind==='error')throw Error(m.message);if(m.kind==='report')report=m.report;}};
 const context=vm.createContext({self,TextDecoder,TextEncoder,Uint8Array,ArrayBuffer,DataView,console});
 vm.runInContext(readFileSync(new URL('../assets/bg3-worker.js',import.meta.url),'utf8'),context);
 const b=readFileSync(save);
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
}

test('an active renamed hireling retains her name while another hireling is at camp',{skip:!process.env.HIRELINGS_ACTIVE_SAVE},()=>{
 let report;const self={postMessage(m){if(m.kind==='error')throw Error(m.message);if(m.kind==='report')report=m.report;}};
 const context=vm.createContext({self,TextDecoder,TextEncoder,Uint8Array,ArrayBuffer,DataView,console});
 vm.runInContext(readFileSync(new URL('../assets/bg3-worker.js',import.meta.url),'utf8'),context);
 const b=readFileSync(process.env.HIRELINGS_ACTIVE_SAVE);self.onmessage({data:{buffer:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),name:'Hirelings.lsv'}});
 const circe=report.characters.filter(c=>c.name==='Circe'),athena=report.characters.filter(c=>c.name==='Athena');
 assert.equal(circe.length,1);assert.equal(athena.length,1);
 assert.equal(circe[0].at_camp,false);assert.equal(athena[0].at_camp,true);
 assert.ok(!report.characters.some(c=>c.name==='Hireling_Bard'));
 assert.ok(circe[0].equipped.some(i=>i.stats==='SCL_SpidersLyre'));
 assert.ok(!athena[0].equipped.some(i=>i.stats==='SCL_SpidersLyre'));
});
test('hireling races are fixed per template, including after a class respec',async()=>{
 const {build}=await import('esbuild');
 const out=await build({entryPoints:['src/camp-hirelings.ts'],bundle:true,platform:'node',format:'esm',write:false});
 const {HIRELING_RACES}=await import('data:text/javascript;base64,'+Buffer.from(out.outputFiles[0].text).toString('base64'));
 // Varanna Sunblossom: a Wood Half-Elf hireling, respecced to Paladin in a real save.
 assert.equal(HIRELING_RACES['d61d12ad-dc80-4805-8c6e-fb876da196cd'],'HalfElf_Wood');
 assert.equal(HIRELING_RACES['0b149cab-4438-467a-953d-8697535b953d'],'Githyanki');
});
