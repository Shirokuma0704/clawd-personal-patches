'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {patchHitRenderer}=require('../patches/apply-patch');
const fixture=fs.readFileSync(path.join(__dirname,'fixtures','hit-renderer.js'),'utf8');
const theme=JSON.parse(fs.readFileSync(path.join(__dirname,'..','themes','edited-clawd','theme.json'),'utf8'));
// Runs hit-renderer.js with stubbed Electron/DOM globals and a manual clock.
function renderer(source,reactions,seed=1){
 let time=0,seq=0,state=seed;const timers=new Map(),plays=[],on={};
 const noop=()=>{},target={addEventListener:noop,classList:{add:noop,remove:noop},style:{},offsetWidth:100};
 const hitAPI=new Proxy({playClickReaction:(file,duration)=>plays.push({file,duration})},{get:(t,k)=>t[k]||(k.startsWith('on')?fn=>{on[k]=fn;}:noop)});
 const random=()=>(state=(state*1103515245+12345)%2147483648)/2147483648;
 const box={window:{hitAPI,hitThemeConfig:{reactions},addEventListener:noop},document:{getElementById:()=>target,addEventListener:noop},
  Math:Object.assign(Object.create(Math),{random}),requestAnimationFrame:noop,cancelAnimationFrame:noop,
  setTimeout:(fn,ms)=>{timers.set(++seq,{fn,at:time+ms});return seq;},clearTimeout:id=>timers.delete(id)};
 vm.runInNewContext(source,box);
 on.onStateSync({currentState:'idle',miniMode:false,dndEnabled:false});
 function advance(ms){const end=time+ms;for(;;){const next=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;timers.delete(next[0]);time=next[1].at;next[1].fn();}time=end;}
 function doubleClick(x){box.handleClick(x);box.handleClick(x);advance(400);const p=plays.at(-1);advance(4000);return p;}
 return {doubleClick,plays};
}
const patched=patchHitRenderer(fixture).source;
test('double-click on either side picks from the shared theme pool without repeating back to back',()=>{
 const pool=theme.reactions.clickLeft.files;
 assert.deepEqual(theme.reactions.clickRight.files,pool);
 assert.ok(pool.length>=4&&pool.includes('clawd-cute-kiss.svg'));
 const r=renderer(patched,theme.reactions),picks=[];
 for(let i=0;i<80;i++)picks.push(r.doubleClick(i%2?80:20));
 assert.equal(r.plays.length,80);
 for(const p of picks){assert.ok(pool.includes(p.file),p.file);assert.equal(p.duration,theme.reactions.clickLeft.duration);}
 for(let i=1;i<picks.length;i++)assert.notEqual(picks[i].file,picks[i-1].file);
 assert.deepEqual([...new Set(picks.map(p=>p.file))].sort(),[...pool].sort());
});
test('reactions without a pool keep the original per-side file',()=>{
 const r=renderer(patched,{clickLeft:{file:'l.svg',duration:2000},clickRight:{file:'r.svg',duration:2000}});
 assert.deepEqual([r.doubleClick(20).file,r.doubleClick(20).file,r.doubleClick(80).file],['l.svg','l.svg','r.svg']);
});
test('every pool motion lasts exactly as long as the reaction plays',()=>{
 for(const file of theme.reactions.clickLeft.files){
  const svg=fs.readFileSync(path.join(__dirname,'..','themes','edited-clawd','assets',file),'utf8');
  const secs=new Set([...svg.matchAll(/animation:\w+ ([\d.]+)s infinite/g)].map(m=>+m[1]));
  // Wing-flap style sub-loops aside, the main tracks all share one period.
  assert.ok(secs.has(theme.reactions.clickLeft.duration/1000),`${file}: ${[...secs]}`);
 }
});
test('an install patched before the pool existed still receives it',()=>{
 const older=fixture+'\n// --- Cute hover interactions (personal patch) ---\n';
 const next=patchHitRenderer(older);
 assert.equal(next.alreadyPatched,false);
 assert.match(next.source,/Personal patch: double-click reaction pool/);
 assert.doesNotMatch(next.source,/resetCuteHover/);
 assert.equal(patchHitRenderer(next.source).alreadyPatched,true);
});
