import {DisplayNames} from '../vendor/bg3-savefile-parser/ts/parser/src/gamedata';
import {gatherReport} from '../vendor/bg3-savefile-parser/ts/parser/src/model';
import data from '../vendor/bg3-savefile-parser/data/gamedata.json';
self.onmessage = ({data: msg}) => {
 try {
  const bytes = new Uint8Array(msg.buffer);
  if(bytes.length < 32 || String.fromCharCode(...bytes.subarray(0,4)) !== 'LSPK')throw Error('This is not a BG3 .lsv save file.');
  self.postMessage({kind:'progress',message:'Reading characters, equipment and spellbooks…'});
  const report=gatherReport(bytes,new DisplayNames(data),msg.name,{quests:false});
  if(!report.characters.length)throw Error('No characters could be recovered from this save.');
  self.postMessage({kind:'report',report});
 } catch(e) {self.postMessage({kind:'error',message:e instanceof Error?e.message:String(e)});}
};
