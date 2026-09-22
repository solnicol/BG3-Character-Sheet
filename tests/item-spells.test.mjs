import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {adaptCharacter} from '../src/save-adapter.mjs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const blank=Function('return ('+html.match(/const blank=\(\)=>\((.+)\);/)[1]+')');
test('item spells and item actions are separated without duplicate names',()=>{
 const grant=(id,name,level)=>({id,name,level,source:3,category:'spell',prepared:true});
 const c={name:'Monk',level:4,class_levels:[{name:'Monk',level:4}],spells:[
  grant('Target_UND_MonkAmulet_Ability','Shatter',2),
  grant('Shout_MAG_Monk_Restore_Ki_Lesser','Ki Restoration',null),
  grant('Shout_UND_MonkAmulet_TalkToAmulet','Talk to the Sentient Amulet',null),
  {...grant('Target_Shatter','Shatter',2),source:0,prepared:false},
 ]};
 const s=adaptCharacter({characters:[c]},0,blank()).sheet;
 assert.equal(s.spells,'Level 2: Shatter [prepared]');
 assert.match(s.features,/Ki Restoration/);assert.match(s.features,/Talk to the Sentient Amulet/);
});
// Opt in with the user's private binary; never commit the save to the repo.
test('Athena binary retains prepared item grants outside the spellbook',{skip:!process.env.ATHENA_SAVE},()=>{
 let report;
 const self={postMessage(m){if(m.kind==='error')throw Error(m.message);if(m.kind==='report')report=m.report;}};
 const context=vm.createContext({self,TextDecoder,TextEncoder,Uint8Array,ArrayBuffer,DataView,console});
 vm.runInContext(readFileSync(new URL('../assets/bg3-worker.js',import.meta.url),'utf8'),context);
 const bytes=readFileSync(process.env.ATHENA_SAVE);
 self.onmessage({data:{buffer:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),name:'Athena.lsv'}});
 const c=report.characters.find(c=>c.name==='Hireling_Monk');assert.ok(c);
 for(const id of ['Target_UND_MonkAmulet_Ability','Shout_MAG_Monk_Restore_Ki_Lesser']){
  const spell=c.spells.find(s=>s.id===id);assert.ok(spell,id);assert.equal(spell.source,3);assert.equal(spell.prepared,true);
 }
});
