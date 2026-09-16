const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 if(!process.env.BG3_TEST_SAVE)throw Error('Set BG3_TEST_SAVE to the multiplayer save to verify.');
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8765/');
 await page.locator('#bg3-file').setInputFiles(process.env.BG3_TEST_SAVE);
 // Summons come and go between saves; the per-name checks below are the guard.
 await page.waitForFunction(()=>document.querySelector('#bg3-characters').options.length>0,null,{timeout:90000});
 const choices=await page.locator('#bg3-characters option').evaluateAll(els=>els.map(e=>e.textContent));
 for(const name of ['Neith','Bob','Savros'])assert.equal(choices.filter(s=>s.startsWith(name+' ·')).length,1);
 console.log('Distinct characters:',choices.join('; '));
 // Ability scores are the regression that matters here: a custom player's
 // entity sits in the top rows of the ownerlist, which is the stretch a
 // mis-based ownerlist drops. Both custom players must come through.
 const expected={Neith:{gold:864,class:'Fighter',hp:40,str:10,dex:17,ac:19},Bob:{gold:1702,class:'Warlock',hp:31,str:8,dex:13,ac:13},Savros:{gold:703,class:'Cleric',hp:35,str:8,dex:14,ac:19}};
 // Parse once, then keep a private local report via worker for all three exports.
 const report=await page.evaluate(async()=>{const file=document.getElementById('bg3-file').files[0];const buffer=await file.arrayBuffer();return new Promise((resolve,reject)=>{const w=new Worker('./assets/bg3-worker.js');w.onmessage=({data})=>{if(data.kind==='report'){w.terminate();resolve(data.report)}if(data.kind==='error'){w.terminate();reject(Error(data.message))}};w.onerror=e=>{w.terminate();reject(Error(e.message))};w.postMessage({name:file.name,buffer},[buffer])})});
 await page.getByRole('button',{name:'Cancel',exact:true}).click();
 const {adaptCharacter}=await import('../src/save-adapter.mjs');
 for(const name of ['Neith','Bob','Savros']){
  const c=report.characters.find(c=>c.name===name);assert(c);assert.equal(c.hp.current,expected[name].hp);assert.equal(c.abilities.dex,expected[name].dex);assert(c.spells.length>10);assert.equal(c.classes[0].Main,expected[name].class);assert(c.resources.length>3);assert.equal(c.resources.find(r=>r.name==='Movement Speed').max,name==='Neith'?10.5:9);
  const {sheet}=adaptCharacter(report,report.characters.indexOf(c),await page.evaluate(()=>sheetImport.blank()));
  assert.equal(sheet.gold,expected[name].gold);
  if(name==='Neith'){
    assert(c.equipped.some(i=>i.name==='Rapier +1'));
    assert(c.equipped.some(i=>i.name==='Gloves of Archery'));
    assert(c.carried.some(i=>i.name==='Bracers of Defence'));
    assert(c.carried.some(i=>i.name==='Torch'));
    assert(!c.equipped.some(i=>i.name==='Torch'));
  }
  await page.evaluate(next=>sheetImport.apply(next),sheet);
  assert.equal(await page.locator('[data-path="name"]').inputValue(),name);
  assert.equal(await page.locator('[data-path="abilities.str"]').inputValue(),String(expected[name].str));
  assert.equal(await page.locator('[data-path="abilities.dex"]').inputValue(),String(expected[name].dex));
  assert.equal(await page.locator('[data-path="ac"]').inputValue(),String(expected[name].ac));
  const saved=await page.evaluate(()=>JSON.stringify(state,null,2));
  const out=path.resolve(__dirname,'../output/characters',name);
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out+'.json',saved);
  await page.evaluate(()=>preparePrint());await page.pdf({path:out+'.pdf',preferCSSPageSize:true,printBackground:true});
  await page.screenshot({path:'/tmp/'+name+'-sheet.png'});
  console.log('Exported',name,'HP',c.hp.current,'spells',c.spells.length,'equipped',c.equipped.length);
 }
 assert.deepEqual(errors,[]);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
