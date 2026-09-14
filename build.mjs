import {build} from 'esbuild';
import {readFile, mkdir, copyFile, rm} from 'node:fs/promises';
// Expose class levels on the SAME entity the upstream parser attributes to a
// character. SaveInfo contains total level only; dividing it would invent data.
export const exposeClassLevels={name:'expose-class-levels',setup(b){b.onLoad({filter:/[\\/](model|lsmf)\.ts$/},async({path})=>{
let contents=await readFile(path,'utf8');
if(path.endsWith('lsmf.ts'))return {contents:contents.replace('const nameLen = u64(dv, base + 8);','const nameLen = dv.getUint32(base + 8, true);').replace('const lvl = u64(dv, base + 32);','const lvl = dv.getUint32(base + 32, true);').replace('const replenish = u64(dv, q + 40);','const replenish = dv.getUint32(q + 40, true);').replace('pad !== 0 || lvl < 0', '!Number.isFinite(amount) || !Number.isFinite(max) || lvl < 0').replace('      pad === 0 &&\n',''),loader:'ts'};
contents="import {recoverPlayerNames} from '../../../../../src/multiplayer';\n"+contents;
contents=contents.replace("const partyNodes = findPartyCharacterNodes(nodes0, playerDisplayName);", `const customPlayers=partyInfo.filter(ci=>PLAYER_ORIGINS.has(ci.Origin ?? 'Generic'));
  const recoveredNames=recoverPlayerNames(nodes0,partyInfo,dn);
  const playerNameFor=(ci:any)=>customPlayers.length===1?playerDisplayName:(recoveredNames.get(ci) ?? 'Custom player '+(customPlayers.indexOf(ci)+1));
  const partyNodes = findPartyCharacterNodes(nodes0, playerDisplayName);`);
contents=contents.replace('PLAYER_ORIGINS.has(originI) ? playerDisplayName : originI','PLAYER_ORIGINS.has(originI) ? playerNameFor(ci) : originI');
contents=contents.replace('PLAYER_ORIGINS.has(origin) ? playerDisplayName : origin','PLAYER_ORIGINS.has(origin) ? playerNameFor(charInfo) : origin');
contents=contents.replace("? (statsEntities.get('__player__') ?? null)","? (customPlayers.length===1 ? (statsEntities.get('__player__') ?? null) : null)");
const anchor='const attachSheet = (char: CharacterReport, ent: number): void => {';
if(!contents.includes(anchor))throw Error('Parser changed: review the class-level adapter before rebuilding.');
contents=contents.replace(anchor,anchor+`\n    char.class_levels = (entityClasses.get(ent) ?? []).map(([cg, sg, lvl]: [string, string, number]) => ({ name: dn.classUuidNames[cg] ?? cg, subclass: dn.classUuidNames[sg] ?? '', level: lvl }));`);
return {contents,loader:'ts'};
});}};
await build({entryPoints:['src/bg3-worker.ts'],outfile:'assets/bg3-worker.js',bundle:true,format:'iife',platform:'browser',target:'es2022',minify:true,plugins:[exposeClassLevels]});
await build({entryPoints:['src/import-ui.js'],outfile:'assets/bg3-import.js',bundle:true,format:'iife',platform:'browser',target:'es2022',minify:true});
console.log('Built local save importer and parser worker.');

// Publish only browser assets; never expose source, fixtures or saved sheets.
await rm('dist', {recursive:true,force:true});
await mkdir('dist/assets', {recursive:true});
await copyFile('index.html','dist/index.html');
for (const name of ['bg3-import.js','bg3-worker.js']) await copyFile('assets/'+name,'dist/assets/'+name);
