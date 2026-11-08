const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const JSZip = require(process.env.BAGAPLAY_JSZIP || 'jszip');
(async () => {
 const root=__dirname, apk=path.join(root,'build','unsigned.apk');
 const zip=await JSZip.loadAsync(fs.readFileSync(apk));
 // AAPT2 on Windows may preserve backslashes in asset paths. Insert assets
 // ourselves using the forward slash names required by Android AssetManager.
 for(const name of Object.keys(zip.files)) {
  if(name.includes('\\'))throw Error('Unexpected Windows path from resource linker: '+name);
 }
 function addAssets(dir,prefix='assets') {
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
   const file=path.join(dir,entry.name), name=prefix+'/'+entry.name;
   if(entry.isDirectory())addAssets(file,name);
   else zip.file(name,fs.readFileSync(file),{compression:'DEFLATE'});
  }
 }
 addAssets(path.join(root,'assets'));
 zip.file('classes.dex',fs.readFileSync(path.join(root,'build','classes.dex')),{compression:'DEFLATE'});
 zip.file('resources.arsc',await zip.file('resources.arsc').async('nodebuffer'),{compression:'STORE'});
 fs.writeFileSync(apk,await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'}));
 const packed=await JSZip.loadAsync(fs.readFileSync(apk));
 for(const name of Object.keys(packed.files))assert.ok(!name.includes('\\'),'Invalid archive path: '+name);
 for(const file of fs.readdirSync(path.join(root,'assets','www'))) {
  const entry=packed.file('assets/www/'+file);assert.ok(entry,'Missing APK asset '+file);
  assert.deepEqual(await entry.async('nodebuffer'),fs.readFileSync(path.join(root,'assets','www',file)));
 }
 const entryUrl=new URL('https://appassets.androidplatform.net/assets/www/index.html');
 const assetPath=entryUrl.pathname.substring('/assets/'.length);
 assert.ok(packed.file('assets/'+assetPath),'Startup URL must resolve inside APK');
 console.log('APK assets verified: forward slash paths, startup page and all bundled files match.');
})().catch(e=>{console.error(e);process.exitCode=1});
