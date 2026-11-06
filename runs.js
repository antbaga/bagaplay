// Parties sauvegardées en continu (BagaStore, Sudoku, Binero, mots croisés, mots fléchés) :
// on les retrouve après avoir quitté l'app ou éteint l'écran. Clé : bagaplay-<jeu>.
// Dans l'APK, une copie est aussi écrite tout de suite dans un fichier de l'app (window.BagaNative) :
// le localStorage d'Android peut retarder son écriture sur disque et la perdre si le système ferme l'app.
export const runKey=id=>'bagaplay-'+id;
const native=()=>{try{return typeof window!=='undefined'&&window.BagaNative&&window.BagaNative.saveRun?window.BagaNative:null}catch{return null}};
const parse=t=>{try{const r=JSON.parse(t||'null');return r&&typeof r==='object'&&r.level!=null?r:null}catch{return null}};
export function savedRun(id){let a=null,b=null;try{a=parse(localStorage.getItem(runKey(id)))}catch{}
 const n=native();if(n){try{b=parse(n.loadRun(runKey(id)))}catch{}}
 if(a&&b)return (b.at||0)>(a.at||0)?b:a;return a||b}
export function saveRun(id,data){let t;try{t=JSON.stringify({...data,at:Date.now()})}catch{return}try{localStorage.setItem(runKey(id),t)}catch{}
 const n=native();if(n){try{n.saveRun(runKey(id),t)}catch{}}}
export function clearRun(id){try{localStorage.removeItem(runKey(id))}catch{}const n=native();if(n){try{n.clearRun(runKey(id))}catch{}}}
