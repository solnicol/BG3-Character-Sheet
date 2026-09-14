import {adaptCharacter,characterClasses} from './save-adapter.mjs';
const button=document.getElementById('import-bg3');
const fileInput=document.getElementById('bg3-file');
const dialog=document.getElementById('bg3-dialog');
const info=document.getElementById('bg3-progress');
const choices=document.getElementById('bg3-characters');
const confirmButton=document.getElementById('bg3-confirm');
const review=document.getElementById('bg3-review');
let worker=null,timer=null,report=null,job=0;
function stop(){job++;worker?.terminate();worker=null;clearTimeout(timer);timer=null;button.disabled=false;}
function fail(message){stop();info.textContent=message;info.classList.add('error');confirmButton.disabled=true;}
button.addEventListener('click',()=>{if(window.sheetImport.isValid())fileInput.click()});
function dismiss(){stop();report=null;choices.replaceChildren();fileInput.value='';dialog.close();}
document.getElementById('bg3-cancel').addEventListener('click',dismiss);
dialog.addEventListener('cancel',e=>{e.preventDefault();dismiss()});
dialog.addEventListener('close',()=>{if(dialog.open)return;stop();report=null;choices.replaceChildren();fileInput.value=''});
function selection(){
 review.replaceChildren();confirmButton.disabled=true;
 if(!report)return;
 try{
  const {sheet,warnings,missing}=adaptCharacter(report,Number(choices.value),window.sheetImport.blank());
  const summary=document.createElement('p');summary.textContent=`${sheet.name} · ${sheet.subrace||sheet.race} · ${sheet.classes.map(c=>c.name+' '+c.level).join(' / ')}`;review.append(summary);
  const detail=document.createElement('p');detail.textContent='Imports recovered ability scores, HP, equipment, spells, resources and feat choices. '+missing;review.append(detail);
  for(const warning of warnings){const p=document.createElement('p');p.textContent=warning;review.append(p)}
  confirmButton.disabled=false;
 }catch(e){review.textContent=e.message;}
}
choices.addEventListener('change',selection);
fileInput.addEventListener('change',async()=>{
 const file=fileInput.files[0];if(!file)return;
 stop();const token=job;report=null;choices.replaceChildren();review.replaceChildren();confirmButton.disabled=true;info.classList.remove('error');info.textContent='Reading '+file.name+'…';dialog.showModal();button.disabled=true;
 if(!/\.lsv$/i.test(file.name)){fail('Choose a Baldur’s Gate 3 .lsv save file.');return}
 if(file.size>100*1024*1024){fail('This save exceeds the 100 MB import limit.');return}
 if(location.protocol==='file:'){fail('BG3 save import needs the local preview. Run npm start in the project folder, then open http://127.0.0.1:8765/.');return}
 try{
  const buffer=await file.arrayBuffer();if(token!==job||!dialog.open)return;
  worker=new Worker('./assets/bg3-worker.js');
  timer=setTimeout(()=>fail('Parsing took too long. Try another save; your sheet has not changed.'),90000);
  worker.onerror=()=>fail('The parser could not run. Refresh the local preview and try again.');
  worker.onmessage=({data})=>{
   if(data.kind==='progress'){info.textContent=data.message;return}
   if(data.kind==='error'){fail('Could not read this save: '+data.message);return}
   if(data.kind==='report'){
    report=data.report;stop();info.textContent=`${file.name} · ${report.characters.length} characters recovered. Choose one to import.`;
    report.characters.forEach((c,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=`${c.name} · level ${c.level} · ${c.at_camp?'Camp':'Party'}`;choices.append(option)});
    // Prefer an importable character, but leave all entries visible with reasons.
    const first=report.characters.findIndex(c=>{try{characterClasses(c);return true}catch{return false}});if(first>=0)choices.value=String(first);
    selection();choices.focus();
   }
  };
  worker.postMessage({name:file.name,buffer},[buffer]);
 }catch(e){if(token===job)fail('Could not read the save: '+e.message)}
});
confirmButton.addEventListener('click',()=>{
 if(!report)return;
 try{const {sheet}=adaptCharacter(report,Number(choices.value),window.sheetImport.blank());window.sheetImport.apply(sheet);dismiss();window.sheetImport.status('Imported '+sheet.name+'. Review the fields marked ?.');}catch(e){review.textContent=e.message;confirmButton.disabled=true}
});
