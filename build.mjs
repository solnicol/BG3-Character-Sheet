import {build} from 'esbuild';
import {readFile, mkdir, copyFile, rm, readdir} from 'node:fs/promises';
// Expose class levels on the SAME entity the upstream parser attributes to a
// character. SaveInfo contains total level only; dividing it would invent data.
export const exposeClassLevels={name:'expose-class-levels',setup(b){b.onLoad({filter:/[\\/](model|lsmf)\.ts$/},async({path})=>{
let contents=await readFile(path,'utf8');
if(path.endsWith('lsmf.ts')){
// Ownerlist record offsets are heap-relative, like every other pointer in the
// blob, so they need the same 48-byte base the rest of the reader applies.
// Read raw, a list starts 12 entries early: it opens with the tail of the
// previous component's list and loses its own last twelve entities. Those are
// the highest rows, which is where a multiplayer save puts its custom players,
// so their ability scores had no owner to attach to.
const ownerAnchor='    const view = new Uint8Array(bytes.buffer, bytes.byteOffset + start, ec * 4).slice();';
if(!contents.includes(ownerAnchor))throw Error('Parser changed: review the ownerlist base correction before rebuilding.');
contents=contents.replace(ownerAnchor,`    const ownerBase = bytes.byteOffset + start + LSMF_HEAP_BASE;
    if (ownerBase + ec * 4 > bytes.byteOffset + bytes.byteLength) continue;
    const view = new Uint8Array(bytes.buffer, ownerBase, ec * 4).slice();`);
return {contents:contents.replace('const nameLen = u64(dv, base + 8);','const nameLen = dv.getUint32(base + 8, true);').replace('const lvl = u64(dv, base + 32);','const lvl = dv.getUint32(base + 32, true);').replace('const replenish = u64(dv, q + 40);','const replenish = dv.getUint32(q + 40, true);').replace('pad !== 0 || lvl < 0', '!Number.isFinite(amount) || !Number.isFinite(max) || lvl < 0').replace('      pad === 0 &&\n',''),loader:'ts'};}
contents="import {recoverPlayerNames} from '../../../../../src/multiplayer';\n"+"import {collectStatuses} from '../../../../../src/statuses';\n"+contents;
contents=contents.replace("const partyNodes = findPartyCharacterNodes(nodes0, playerDisplayName);", `const customPlayers=partyInfo.filter(ci=>PLAYER_ORIGINS.has(ci.Origin ?? 'Generic'));
  const recoveredNames=recoverPlayerNames(nodes0,partyInfo,dn);
  const playerNameFor=(ci:any)=>customPlayers.length===1?playerDisplayName:(recoveredNames.get(ci) ?? 'Custom player '+(customPlayers.indexOf(ci)+1));
  const partyNodes = findPartyCharacterNodes(nodes0, playerDisplayName);`);
contents=contents.replace('PLAYER_ORIGINS.has(originI) ? playerDisplayName : originI','PLAYER_ORIGINS.has(originI) ? playerNameFor(ci) : originI');
contents=contents.replace('PLAYER_ORIGINS.has(origin) ? playerDisplayName : origin','PLAYER_ORIGINS.has(origin) ? playerNameFor(charInfo) : origin');
contents=contents.replace("? (statsEntities.get('__player__') ?? null)","? (customPlayers.length===1 ? (statsEntities.get('__player__') ?? null) : null)");
const anchor2='    const charPos = charPositions.get(displayName);';
if(!contents.includes(anchor2))throw Error('Parser changed: review the status adapter before rebuilding.');
const anchor='const attachSheet = (char: CharacterReport, ent: number): void => {';
if(!contents.includes(anchor))throw Error('Parser changed: review the class-level adapter before rebuilding.');
contents=contents.replace(anchor,anchor+`\n    char.class_levels = (entityClasses.get(ent) ?? []).map(([cg, sg, lvl]: [string, string, number]) => ({ name: dn.classUuidNames[cg] ?? cg, subclass: dn.classUuidNames[sg] ?? '', level: lvl }));`);
contents=contents.replace(`    const charPos = charPositions.get(displayName);\n    const charStatsToEntity = new Map<string, string>();`,`    char.statuses = collectStatuses(nodes0, charNi);\n    const charPos = charPositions.get(displayName);\n    const charStatsToEntity = new Map<string, string>();`);
return {contents,loader:'ts'};
});}};
await build({entryPoints:['src/bg3-worker.ts'],outfile:'assets/bg3-worker.js',bundle:true,format:'iife',platform:'browser',target:'es2022',minify:true,plugins:[exposeClassLevels]});
await build({entryPoints:['src/import-ui.js'],outfile:'assets/bg3-import.js',bundle:true,format:'iife',platform:'browser',target:'es2022',minify:true});
await build({entryPoints:['src/analytics.js'],outfile:'assets/analytics.js',bundle:true,format:'iife',platform:'browser',target:'es2022',minify:true});
console.log('Built local save importer, parser worker, and analytics.');

// Publish only browser assets; never expose source, fixtures or saved sheets.
await rm('dist', {recursive:true,force:true});
await mkdir('dist/assets', {recursive:true});
await copyFile('index.html','dist/index.html');
for (const name of ['bg3-import.js','bg3-worker.js','analytics.js','workspace.css','workspace.js']) await copyFile('assets/'+name,'dist/assets/'+name);
// Self-hosted fonts, with their licences, so the sheet needs no third-party
// request and keeps working offline.
await mkdir('dist/assets/fonts', {recursive:true});
for (const name of await readdir('assets/fonts')) await copyFile('assets/fonts/'+name,'dist/assets/fonts/'+name);
