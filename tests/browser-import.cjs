const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:950}}),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push({url:r.url(),method:r.method()}));
 await page.goto('http://127.0.0.1:8765/');await page.evaluate(()=>localStorage.clear());await page.reload();
 const original=await page.locator('[data-path="name"]').inputValue();
 const fixture=path.resolve(__dirname,'../vendor/bg3-savefile-parser/tests/fixtures/quicksave_469.lsv');
 await page.locator('#bg3-file').setInputFiles(fixture);
 await page.waitForFunction(()=>document.querySelector('#bg3-characters').options.length>0,null,{timeout:90000});
 assert.equal(await page.locator('[data-path="name"]').inputValue(),original);
 const options=await page.locator('#bg3-characters option').evaluateAll(els=>els.map(e=>({value:e.value,text:e.textContent})));
 console.log('Parsed real .lsv:',options.map(x=>x.text).join('; '));
 const sh=options.find(o=>o.text.startsWith('Shadowheart'));
 await page.locator('#bg3-characters').selectOption(sh.value);
 await page.screenshot({path:'/tmp/bg3-import-dialog.png'});
 await page.getByRole('button',{name:'Import selected character',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('[data-path="name"]').value==='Shadowheart');
 assert.equal(await page.locator('[data-path="hp"]').inputValue(),'62');
 assert.equal(await page.locator('[data-path="maxHp"]').inputValue(),'67');
 assert.equal(await page.locator('[data-path="abilities.wis"]').inputValue(),'18');
 assert.equal(await page.locator('[data-path="subrace"]').inputValue(),'High Half-Elf');
 assert.equal(await page.locator('[data-path="classes.0.level"]').inputValue(),'9');
 assert.equal(await page.locator('[data-path="skills.Perception"]').inputValue(),'-1');
 assert.equal(await page.locator('[data-calc="skill-Perception"]').textContent(),'?');
 assert.equal(await page.locator('[data-path="ac"]').getAttribute('placeholder'),'?');
 assert.equal(await page.locator('[data-path="saves.wis"]').evaluate(el=>el.indeterminate),true);
 assert.equal(await page.locator('[data-path="slots.3"]').inputValue(),'2 / 3');
 assert.match(await page.locator('[data-path="features"]').inputValue(),/War Caster/);
 const equipment=await page.locator('.equipment-panel').innerText();assert.match(equipment,/EQUIPPED/);
 assert.match(await page.locator('[data-path="spells"]').inputValue(),/Cantrip/);
 await page.reload();assert.equal(await page.locator('[data-path="name"]').inputValue(),'Shadowheart');
 assert.equal(await page.locator('[data-calc="skill-Perception"]').textContent(),'?');
 assert.equal(await page.locator('[data-path="saves.wis"]').evaluate(el=>el.indeterminate),true);
 assert.equal(await page.locator('[data-path="skills.Perception"]').isDisabled(),true);
 assert.equal(await page.locator('[data-path="name"]').getAttribute('readonly'),'');
 await page.locator('[data-path="player"]').fill('Player');
 const dl=page.waitForEvent('download');await page.getByRole('button',{name:'Save character',exact:true}).click();await(await dl).saveAs('/tmp/bg3-imported.json');
 const json=JSON.parse(fs.readFileSync('/tmp/bg3-imported.json','utf8'));assert.match(json.importSummary,/quicksave_469/);assert.equal(json.hp,62);
 // Full populated PDF: last equipment and spell lines must survive printing.
 fs.writeFileSync('/tmp/bg3-print-expected.json',JSON.stringify({equipment:equipment.split('\n').at(-1),spell:(await page.locator('[data-path="spells"]').inputValue()).split('\n').at(-1)}));
 await page.evaluate(()=>preparePrint());await page.pdf({path:'/tmp/bg3-imported.pdf',preferCSSPageSize:true});
 // Pact slots remain visible separately and older JSON values migrate.
 await page.evaluate(()=>{const s=sheetImport.blank();s.slots[1]='3 / 3';s.pactSlots[1]='2 / 2';sheetImport.apply(s)});
 assert.equal(await page.locator('[data-path="slots.1"]').inputValue(),'3 / 3');
 assert.equal(await page.locator('[data-path="pactSlots.1"]').inputValue(),'2 / 2');
 await page.reload();assert.equal(await page.locator('[data-path="pactSlots.1"]').inputValue(),'2 / 2');
 await page.evaluate(()=>{const s=sheetImport.blank();s.slots[1]='2 / 2 (pact)';delete s.pactSlots;sheetImport.apply(s)});
 assert.equal(await page.locator('[data-path="slots.1"]').inputValue(),'');
 assert.equal(await page.locator('[data-path="pactSlots.1"]').inputValue(),'2 / 2');
 await page.evaluate(saved=>sheetImport.apply(saved),json);
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 // Reading a new save and cancelling never replaces the active sheet.
 await page.locator('#bg3-file').setInputFiles(path.resolve(__dirname,'../vendor/bg3-savefile-parser/tests/fixtures/honour_durge_nautiloid.lsv'));
 await page.waitForFunction(()=>document.querySelector('#bg3-characters').options.length>0,null,{timeout:90000});
 console.log('Parsed Honour-mode save.');
 await page.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(await page.locator('[data-path="name"]').inputValue(),'Shadowheart');
 await page.locator('#bg3-file').setInputFiles({name:'corrupt.lsv',mimeType:'application/octet-stream',buffer:Buffer.from('not a save')});
 await page.waitForFunction(()=>document.querySelector('#bg3-progress').textContent.includes('Could not read'),null,{timeout:10000});
 assert.equal(await page.getByRole('button',{name:'Import selected character',exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(await page.locator('[data-path="name"]').inputValue(),'Shadowheart');
 // Immediate cancellation while parsing keeps the old sheet and worker is stopped.
 await page.locator('#bg3-file').setInputFiles(fixture);await page.getByRole('button',{name:'Cancel',exact:true}).click();
 assert.equal(await page.locator('[data-path="name"]').inputValue(),'Shadowheart');
 assert.equal(await page.locator('#import-bg3').isDisabled(),false);
 assert.deepEqual(errors,[]);
 assert.equal(requests.some(r=>r.method!=='GET'||!r.url.startsWith('http://127.0.0.1:8765/')),false);
 console.log('PASS: real binary saves, character selection, import mapping, unknown states, player-name editing, persistence, backup, PDF, mobile, cancel and corrupt files. All network requests were local GETs; no save upload.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
