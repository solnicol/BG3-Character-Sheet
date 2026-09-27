import {parseLsmfStatsEntities,parseLsmfClasses} from '../vendor/bg3-savefile-parser/ts/parser/src/lsmf';
import {recoverPlayerNames} from './multiplayer';
// Fixed hireling races, keyed by character template, not custom name or class.
// https://bg3.wiki/wiki/Sina%27zith and https://bg3.wiki/wiki/Brinna_Brightsong
const races:Record<string,string>={
 '0b149cab-4438-467a-953d-8697535b953d':'Githyanki',
 '4d3c9cb3-ca34-46ba-9c81-44081270bfde':'Halfling_Lightfoot',
};
// The twelve persistent hireling templates, observed in Character records in
// SYS_Hirelings. PreviousLevel is travel history: it changes on region travel.
const hirelingTemplates=new Set([
 ...Object.keys(races),
 '12e541ac-1eb3-4b8c-a8b8-95263e30b217',
 'd61d12ad-dc80-4805-8c6e-fb876da196cd',
 'ee3f1f8d-f2d1-43f2-aba0-72cacafce03c',
 '097aa418-eda5-47f9-867f-29a4339be03e',
 'e4818484-7ee4-466b-82b3-60bbd7b2ff8f',
 '0488a406-402c-4bd1-ba38-63b28c112d8d',
 '7bed07ee-d1db-498d-bbfd-600ddf04676e',
 '244e782b-a99c-444a-bd8d-d356c26c2902',
 '49f522f8-9ac9-431e-ab39-a45e38e222c2',
 '2c8c93f0-898b-42d6-b2ca-cf4922852632',
]);
export function discoverCampHirelings(nodes:any[],blob:Uint8Array,dn:any,activeNodes:Set<number>){
 const candidates=nodes.flatMap((n,i)=>n.name==='Character'&&(hirelingTemplates.has(n.attrs.CurrentTemplate)||n.attrs.PreviousLevel==='SYS_Hirelings')&&n.attrs.Level!=='SYS_Hirelings'&&!activeNodes.has(i)?[{node:i,template:n.attrs.CurrentTemplate}]:[]);
 const entities=parseLsmfStatsEntities(blob,new Map(candidates.map(c=>[c.template,c.template])));
 const classes=parseLsmfClasses(blob);
 const records=candidates.flatMap(c=>{
  const entity=entities.get(c.template),levels=entity===undefined?null:classes.get(entity);
  if(!levels?.length)return [];
  return [{...c,entity:entity!,race:races[c.template]??'?',
   Level:levels.reduce((n:number,x:any)=>n+x[2],0),
   Classes:levels.map(([cl,sub]:any)=>({Main:dn.classUuidNames[cl],Sub:dn.classUuidNames[sub]??''}))}];
 });
 const names=recoverPlayerNames(nodes,records,dn);
 return records.map(c=>({...c,name:names.get(c)??`Hireling (${c.Classes.map(x=>x.Main).join(' / ')}) ${c.template.slice(0,8)}`}));
}
