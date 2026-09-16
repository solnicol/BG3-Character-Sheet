import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const compiled=await build({entryPoints:['src/statuses.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {collectStatuses}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));

// Mirrors the real tree: Character > StatusManager > STATUS.
const tree=()=>[
 {name:'Character',parent:-1,attrs:{}},                                     // 0, ours
 {name:'StatusManager',parent:0,attrs:{}},                                  // 1
 {name:'STATUS',parent:1,attrs:{ID:'MAG_AID',LifeTime:-6}},                 // 2
 {name:'STATUS',parent:1,attrs:{ID:'HAS_SHOVEL',LifeTime:-1}},              // 3
 {name:'Character',parent:-1,attrs:{}},                                     // 4, someone else
 {name:'StatusManager',parent:4,attrs:{}},                                  // 5
 {name:'STATUS',parent:5,attrs:{ID:'DYING',LifeTime:-6}},                   // 6
 {name:'STATUS',parent:-1,attrs:{ID:'ORPHAN',LifeTime:-6}},                 // 7, no manager
];

test('statuses are read from the character’s own node, never a neighbour’s',()=>{
 assert.deepEqual(collectStatuses(tree(),0),[{id:'MAG_AID',permanent:false},{id:'HAS_SHOVEL',permanent:true}]);
 assert.deepEqual(collectStatuses(tree(),4),[{id:'DYING',permanent:false}]);
});
test('a character with no recovered node yields nothing rather than everything',()=>{
 assert.deepEqual(collectStatuses(tree(),undefined),[]);
 assert.deepEqual(collectStatuses(null,0),[]);
});
test('permanence comes from LifeTime, which is how the game separates the two',()=>{
 const [aid,shovel]=collectStatuses(tree(),0);
 assert.equal(aid.permanent,false);
 assert.equal(shovel.permanent,true);
});
