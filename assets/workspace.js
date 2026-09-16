// Screen navigation and editing cues. Character values remain owned by the sheet.
function updateWorkspace(){
 const imported=document.getElementById('app').classList.contains('imported');
 document.getElementById('welcome').hidden=imported;
 document.getElementById('import-bg3').classList.toggle('primary',!imported);
 document.getElementById('print').classList.toggle('primary',imported);
 const sheets=document.querySelectorAll('.sheet');
 if(sheets[0])sheets[0].id='character';
 if(sheets[1])sheets[1].id='spellbook';
 const player=document.querySelector('[data-path="player"]');
 if(player&&!document.getElementById('player-help')){
  const hint=document.createElement('small');hint.id='player-help';hint.className='player-hint';hint.textContent='Optional · included on your PDF';
  player.parentElement.append(hint);player.setAttribute('aria-describedby','player-help');player.placeholder='Add player name';
 }
}
document.addEventListener('sheet-rendered',updateWorkspace);
document.addEventListener('click',event=>{const menu=document.querySelector('.sheet-menu');if(menu.open&&(!menu.contains(event.target)||event.target.closest('button')))menu.open=false;});
document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelector('.sheet-menu').open=false;});
updateWorkspace();
// Reflow read-only text when the viewport changes, without resize feedback loops.
let lastWidth=0;
new ResizeObserver(([entry])=>{const width=entry.contentRect.width;if(width!==lastWidth){lastWidth=width;resizeAll();}}).observe(document.getElementById('app'));
