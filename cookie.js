import './cookie-engine.js';
import './cookie-render.js';

const P=globalThis.CookiePhysics,R=globalThis.CookieRenderer,KEY='bagaplay-cookie-session-v1';
export function cookie(c){
 let saved;try{if(!c.fresh)saved=JSON.parse(localStorage.getItem(KEY)||'null')}catch{}
 let game;try{game=new P.Game(saved)}catch{game=new P.Game()}
 if(!['ready','moving'].includes(game.phase))game=new P.Game();
 const [canvas]=c.canvas(P.H);canvas.classList.add('cookie-canvas');
 const renderer=new R.Renderer(canvas),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let gesture=null,aim=null,clock=0,saveClock=0,finished=false;
 const undo=c.button('↶ Annuler le lancer',()=>{if(game.undo()){gesture=null;aim=null;renderer.particles=[];renderer.popups=[];renderer.trails.clear();save();refresh()}},'wide');
 const end=c.button('Terminer la partie',()=>{if(game.phase==='lost')finish()},'wide');end.hidden=true;
 const album=document.createElement('div');album.className='cookie-album';album.setAttribute('aria-label','Les huit pâtisseries à créer');
 for(let i=0;i<P.TIERS.length;i++){const thumb=document.createElement('canvas');thumb.width=thumb.height=72;thumb.title=P.TIERS[i].name;thumb.setAttribute('aria-label',P.TIERS[i].name);R.thumbnail(thumb,i);album.append(thumb)}
 c.controls.after(album);
 function save(){try{if(['ready','moving'].includes(game.phase)&&!finished)localStorage.setItem(KEY,JSON.stringify(game.snapshot()));else localStorage.removeItem(KEY)}catch{}}
 function refresh(){c.score(game.score);undo.disabled=!game.undoState;end.hidden=game.phase!=='lost';c.hint(`${game.shots} lancer${game.shots>1?'s':''} · ${P.TIERS[game.highest].name}${game.combo>1?' · Combo ×'+game.combo:''}. ${game.phase==='ready'?'Glisse le cookie du bas vers le haut.':game.phase==='moving'?'Attends l’arrêt des gâteaux.':'Zone encombrée : annule le lancer ou termine la partie.'}`)}
 function point(e){const r=canvas.getBoundingClientRect();return renderer.toWorld(e.clientX-r.left,e.clientY-r.top)}
 function cancel(){gesture=null;aim=null}
 c.listen(canvas,'pointerdown',e=>{if(game.phase!=='ready'||gesture||e.button!==0)return;const [x,y]=point(e);if(y<483||y>P.H||x<0||x>P.W)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);game.launchX=Math.max(28,Math.min(332,x));gesture={id:e.pointerId,x,y,origin:game.launchX,time:performance.now()}});
 c.listen(canvas,'pointermove',e=>{if(!gesture||gesture.id!==e.pointerId)return;const [x,y]=point(e),dx=x-gesture.x,dy=y-gesture.y;if(dy<-9){game.launchX=gesture.origin;aim={dx,dy,power:P.aim(dx,dy,(performance.now()-gesture.time)/1000)}}else{game.launchX=Math.max(28,Math.min(332,x));aim=null}});
 c.listen(canvas,'pointerup',e=>{if(!gesture||gesture.id!==e.pointerId)return;const [x,y]=point(e),dx=x-gesture.x,dy=y-gesture.y,origin=gesture.origin,power=P.aim(dx,dy,(performance.now()-gesture.time)/1000);cancel();if(dy<-12){game.launch(origin,dx,dy,power);c.tone()}save();refresh()});
 c.listen(canvas,'pointercancel',cancel);
 c.listen(window,'resize',()=>renderer.resize());
 function finish(){if(finished)return;finished=true;save();c.finish(game.phase==='won',game.score,`${P.TIERS[game.highest].name} · ${game.shots} lancers · ${game.score} points`)}
 refresh();renderer.draw(game,{reduced});save();
 return {update(dt){clock+=dt;game.advance(dt);for(const e of game.events){if(e.type==='merge'){if(!reduced)renderer.burst(e);c.tone(true)}if(e.type==='win'&&!reduced)renderer.burst(e)}game.events=[];renderer.update(reduced?0:dt);renderer.draw(game,{time:clock,aim,reduced});refresh();if(game.phase==='won')finish();else if(clock-saveClock>1){saveClock=clock;save()}},pause:cancel,destroy(){save();album.remove()},key(k){if(k==='z'&&game.undo()){save();refresh()}}};
}
