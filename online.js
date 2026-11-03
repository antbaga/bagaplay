// Fonctions en ligne de BagaPlay (Supabase) : classements et parties à deux.
// Désactivé tant que CONFIG.url et CONFIG.key sont vides : aucune requête réseau n'est alors envoyée.
// Côté serveur : server/supabase.sql. Mise en place : EN-LIGNE.md.
export const CONFIG={
 url:'https://pclxzegbmrzlodqtczxb.supabase.co',  // projet Supabase « BagaPlay » (organisation BagaCorps)
 key:'sb_publishable_Cv2S8gWksCQOBp4TVkGkbg_RJi8bcEt'  // clé publishable (publique par conception), jamais la clé secrète
};

// Tableaux où le plus petit score gagne (vérifié aussi côté serveur).
export const LOWER=new Set(['memory','mines','sudoku','slide','binero','crossword','arrowword']);
// Tableaux alimentés par le serveur (victoires en ligne), jamais envoyés par l'app.
export const SERVER_BOARDS=new Set(['chess','draughts','connect4','battleship']);

const PLAYER_KEY='bagaplay-player';
function uuid(){try{return crypto.randomUUID()}catch{return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16)})}}
function store(p){try{localStorage.setItem(PLAYER_KEY,JSON.stringify(p))}catch{}}

// Identité : un identifiant secret aléatoire (gardé sur le téléphone) + un pseudo unique. Pas de compte.
// p.registered : le pseudo est enregistré sur le serveur ; p.pub : identifiant public montré aux autres.
export function player(){let p=null;try{p=JSON.parse(localStorage.getItem(PLAYER_KEY)||'null')}catch{}if(!p||!p.id){p={id:uuid(),name:''};store(p)}return p}
export function cleanName(name){return String(name||'').replace(/[\u0000-\u001f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,16)}
// Hors ligne : pseudo seulement local. En ligne : le serveur doit l'accepter (pseudo unique).
export async function setName(name){const p=player(),n=cleanName(name);if(!n)throw new Error('Choisis un pseudo.');
 if(!enabled()){p.name=n;store(p);return p}
 const r=await rpc('register',{p_player:p.id,p_name:n});Object.assign(p,{name:r.name,pub:r.id,registered:true});store(p);nativeSession();return p}
// Au démarrage : réenregistre le profil (met à jour « vu récemment ») et branche les notifications.
export async function hello(){const p=player();if(!enabled()||!p.name)return p;try{await setName(p.name)}catch(e){if(/pris/.test(e.message)){p.registered=false;store(p)}}return player()}
export const registered=()=>{const p=player();return !!(p.name&&p.registered)};
// Transmet l'identité au code Android natif, qui vérifie les parties en arrière-plan et affiche les notifications.
export function nativeSession(){try{if(enabled()&&window.BagaNative?.setSession)window.BagaNative.setSession(CONFIG.url,CONFIG.key,player().id)}catch{}}
export function askNotifications(){try{window.BagaNative?.requestNotifications?.()}catch{}}
export const enabled=()=>!!(CONFIG.url&&CONFIG.key)&&!globalThis.bagaWebNeedsInstall; // iPhone : seulement dans l'app installée (voir pwa.js)

// Appel d'une fonction SQL. Lève une erreur avec le message du serveur (en français) si refusé.
export async function rpc(fn,args){
 if(!enabled())throw new Error('Le jeu en ligne n’est pas activé.');
 let r;try{r=await fetch(`${CONFIG.url}/rest/v1/rpc/${fn}`,{method:'POST',headers:{apikey:CONFIG.key,'Content-Type':'application/json'},body:JSON.stringify(args)})}
 catch{throw new Error('Pas de connexion internet.')}
 const text=await r.text();let data=null;try{data=text?JSON.parse(text):null}catch{}
 if(!r.ok)throw new Error(data?.message||'Serveur indisponible ('+r.status+').');
 return data;
}
const me=()=>player().id,named=()=>{const p=player();if(!p.name||!p.registered)throw new Error('Choisis d’abord un pseudo.');return p.name};

// ---- classements
export async function submit(board,score){
 if(!enabled()||!registered()||SERVER_BOARDS.has(board)||!Number.isFinite(score)||score<=0)return false;
 try{await rpc('submit_score',{p_player:me(),p_name:player().name,p_board:board,p_score:Math.floor(score)});return true}catch{return false}
}
// Renvoie tous les records locaux. Le serveur garde seulement le meilleur : renvoyer est sans effet.
export async function syncAll(saved,gameIds){
 if(!enabled()||!registered())return false;
 return (await Promise.all([submit('coins',saved.coins||0),...gameIds.filter(id=>saved[id]!=null).map(id=>submit(id,saved[id]))])).some(Boolean);
}
// [{name,score,me}] ou null si indisponible.
export async function top(board,limit=30){if(!enabled())return null;try{return await rpc('top_scores',{p_player:me(),p_board:board,p_limit:limit})}catch{return null}}

// ---- parties à deux
// ---- joueurs
export const search=q=>rpc('search_players',{p_player:me(),p_query:String(q||'').trim().slice(0,16)});
export const profile=pub=>rpc('player_profile',{p_player:me(),p_id:pub});
export const challenge=(pub,game,state)=>rpc('challenge',{p_player:me(),p_name:named(),p_opponent:pub,p_game:game,p_state:state});
export const getMatch=id=>rpc('get_match',{p_player:me(),p_id:id});
export const myMatches=()=>rpc('my_matches',{p_player:me()});
export const playMove=(id,ply,state,end)=>rpc('play_move',{p_player:me(),p_id:id,p_ply:ply,p_state:state,p_over:!!end,p_winner:end?.winner||null,p_reason:end?.reason||null});
// Bataille navale : les flottes passent par le serveur, qui les garde cachées.
export const bsPlace=(id,fleet)=>rpc('bs_place',{p_player:me(),p_id:id,p_fleet:fleet});
export const bsFire=(id,cell)=>rpc('bs_fire',{p_player:me(),p_id:id,p_cell:cell});
export const matchAction=(id,action)=>rpc('match_action',{p_player:me(),p_id:id,p_action:action});

// Défi en attente : l'adversaire accepte ou refuse. Partie finie : « hide » la retire de mes listes.
export const acceptMatch=id=>matchAction(id,'accept');
export const declineMatch=id=>matchAction(id,'decline');
export const hideMatch=id=>matchAction(id,'hide');

// ---- parties à plusieurs (pétanque)
export const createParty=(game,pubs)=>rpc('party_create',{p_player:me(),p_name:named(),p_game:game,p_others:pubs});
export const respondParty=(id,yes)=>rpc('party_respond',{p_player:me(),p_id:id,p_accept:!!yes});
export const getParty=id=>rpc('get_party',{p_player:me(),p_id:id});
export const myParties=()=>rpc('my_parties',{p_player:me()});
export const partyAsk=id=>rpc('party_ask',{p_player:me(),p_id:id});
export const partyVote=(id,yes)=>rpc('party_vote',{p_player:me(),p_id:id,p_yes:!!yes});
export const partyThrow=(id,ply,state,end)=>rpc('party_throw',{p_player:me(),p_id:id,p_ply:ply,p_state:state,p_over:!!end,p_winner:end?end.winner:null});
export const hideParty=id=>rpc('party_hide',{p_player:me(),p_id:id});
// Toutes mes parties (duels + pétanque). Les parties à plusieurs restent facultatives si le serveur n'est pas à jour.
// Seules les parties en attente ou en cours sont listées : une partie finie, refusée ou annulée n'apparaît plus nulle part.
export const isOpen=g=>g.status==='pending'||g.status==='active';
export async function allGames(){const [m,p]=await Promise.all([myMatches(),myParties().catch(()=>[])]);return m.concat(p).filter(isOpen)}
// Action attendue de ma part : répondre à un défi, jouer, voter, demander à lancer.
export const needsMe=g=>!!(g.invite||g.my_turn||g.need_vote||g.can_ask);

// ---- notifications push (app installée sur iPhone, Chrome/Edge…). L'APK Android a ses propres notifications.
export const VAPID_PUBLIC='BMFD7a8rPH0H_GJ6gMdumkRzBIMOmhfMcCGnQlAyLqPHcvsg7qDht-fI_Hf_e8glcCegd11O--CKRmlyV1sXmyg';
const fromB64u=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((s.length+3)%4)),c=>c.charCodeAt(0));
export const nativeNotifications=()=>!!window.BagaNative;
export const pushSupported=()=>!nativeNotifications()&&'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
// 'on', 'off', 'denied' ou 'unsupported'
export async function pushState(){if(nativeNotifications())return 'native';if(!pushSupported())return 'unsupported';if(Notification.permission==='denied')return 'denied';
 try{const r=await navigator.serviceWorker.getRegistration();const s=await r?.pushManager.getSubscription();return s&&Notification.permission==='granted'?'on':'off'}catch{return 'off'}}
// À appeler depuis un geste de l'utilisateur (exigé par iPhone).
export async function enablePush(){if(nativeNotifications()){askNotifications();return 'native'}
 if(!pushSupported())throw new Error('Notifications non disponibles ici.');
 const perm=await Notification.requestPermission();if(perm!=='granted')throw new Error('Notifications refusées.');
 const reg=await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();
 if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:fromB64u(VAPID_PUBLIC)});
 const j=sub.toJSON();await rpc('push_subscribe',{p_player:me(),p_endpoint:j.endpoint,p_p256dh:j.keys.p256dh,p_auth:j.keys.auth,p_lang:window.bagaLang==='en'?'en':'fr'});return 'on'}
export async function disablePush(){try{const reg=await navigator.serviceWorker.getRegistration();const sub=await reg?.pushManager.getSubscription();if(sub){await rpc('push_unsubscribe',{p_player:me(),p_endpoint:sub.endpoint}).catch(()=>{});await sub.unsubscribe()}}catch{}return 'off'}
// Réabonne en silence au démarrage (clé renouvelée par le navigateur, changement de profil).
export async function refreshPush(){try{if(registered()&&await pushState()==='on')await enablePush()}catch{}}

// ---- même profil sur un autre appareil
export const linkCode=()=>{named();return rpc('link_code',{p_player:me()})};
// Remplace l'identité de cet appareil par celle du code. Les records locaux restent sur l'appareil.
export async function redeemLink(code){const r=await rpc('link_redeem',{p_code:String(code||'').trim().slice(0,12)});
 store({id:r.secret,name:r.name,pub:r.id,registered:true});nativeSession();return player()}
