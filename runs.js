// Parties de réflexion sauvegardées en continu (Sudoku, Binero, mots croisés, mots fléchés) :
// on les retrouve après avoir quitté l'app ou éteint l'écran. Clé : bagaplay-<jeu>.
export const runKey=id=>'bagaplay-'+id;
export function savedRun(id){try{const r=JSON.parse(localStorage.getItem(runKey(id))||'null');return r&&typeof r==='object'&&r.level!=null?r:null}catch{return null}}
export function saveRun(id,data){try{localStorage.setItem(runKey(id),JSON.stringify({...data,at:Date.now()}))}catch{}}
export function clearRun(id){try{localStorage.removeItem(runKey(id))}catch{}}
