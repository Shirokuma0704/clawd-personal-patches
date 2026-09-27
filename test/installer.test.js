'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process'),asar=require('@electron/asar');
const repo=path.join(__dirname,'..');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
test('both installers patch an isolated archive, preserve unpacked assets and are idempotent',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'clawd-public-test-'));
 try {
  const app=path.join(dir,'app'),install=path.join(dir,'install'),patches=path.join(dir,'patches');
  fs.mkdirSync(path.join(app,'src'),{recursive:true});fs.mkdirSync(path.join(app,'assets','svg'),{recursive:true});
  fs.mkdirSync(path.join(install,'resources'),{recursive:true});fs.mkdirSync(patches,{recursive:true});
  for(const f of ['tick.js','hit-renderer.js','pet-interaction-ipc.js'])fs.copyFileSync(path.join(__dirname,'fixtures',f),path.join(app,'src',f));
  fs.writeFileSync(path.join(app,'assets','svg','sentinel.svg'),'<svg xmlns="http://www.w3.org/2000/svg"/>');
  for(const f of fs.readdirSync(path.join(repo,'patches')))fs.copyFileSync(path.join(repo,'patches',f),path.join(patches,f));
  const archive=path.join(install,'resources','app.asar');
  await asar.createPackageWithOptions(app,archive,{unpackDir:path.join('assets','svg')});
  const external=archive+'.unpacked/assets/svg/sentinel.svg',externalHash=hash(external),before=hash(archive);
  function run(script,args=[]){return execFileSync(process.execPath,[path.join(patches,script),install,...args],{env:{...process.env,NODE_PATH:path.join(repo,'node_modules')},encoding:'utf8'});}
  run('apply-patch.js',['--check']);run('apply-idle-patch.js',['--check']);assert.equal(hash(archive),before);
  run('apply-patch.js');run('apply-idle-patch.js');assert.notEqual(hash(archive),before);assert.equal(hash(external),externalHash);
  asar.uncache(archive);
  assert.equal(asar.statFile(archive,path.join('assets','svg','sentinel.svg')).unpacked,true);
  const after=hash(archive);run('apply-patch.js');run('apply-idle-patch.js');assert.equal(hash(archive),after);
  const verify=execFileSync(process.execPath,['-e',`const a=require('@electron/asar'),assert=require('assert');assert(a.extractFile(process.argv[1],'src/tick.js').toString().includes('Personal ambient idle scheduling v2'));assert(a.extractFile(process.argv[1],'src/hit-renderer.js').toString().includes('Cute hover interactions (personal patch)'));assert(a.extractFile(process.argv[1],'src/pet-interaction-ipc.js').toString().includes('reactions cancel a pending roam'));`,archive],{env:{...process.env,NODE_PATH:path.join(repo,'node_modules')},encoding:'utf8'});
  assert.equal(verify,'');
 } finally {
  const resolved=path.resolve(dir),temp=path.resolve(os.tmpdir())+path.sep;
  assert.ok(resolved.startsWith(temp)&&path.basename(resolved).startsWith('clawd-public-test-'));
  fs.rmSync(resolved,{recursive:true,force:true});
 }
});
