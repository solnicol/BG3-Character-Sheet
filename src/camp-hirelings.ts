import {parseLsmfStatsEntities,parseLsmfClasses} from '../vendor/bg3-savefile-parser/ts/parser/src/lsmf';
import {recoverPlayerNames} from './multiplayer';
// Fixed hireling races, keyed by character template, not custom name or class.
// https://bg3.wiki/wiki/Sina%27zith and https://bg3.wiki/wiki/Brinna_Brightsong
const races:Record<string,string>={
 '0b149cab-4438-467a-953d-8697535b953d':'Githyanki',
 '4d3c9cb3-ca34-46ba-9c81-44081270bfde':'Halfling_Lightfoot',
};
export function discoverCampHirelings(nodes:any[],blob:Uint8Array,dn:any,activeNodes:Set<number>){
 const candidates=nodes.flatMap((n,i)=>n.name==='Character'&&n.attrs.PreviousLevel==='SYS_Hirelings'&&n.attrs.Level!=='SYS_Hirelings'&&!activeNodes.has(i)?[{node:i,template:n.attrs.CurrentTemplate}]:[]);
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
