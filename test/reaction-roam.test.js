'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {patch}=require('../patches/reaction-roam-transform');
const fixture=fs.readFileSync(path.join(__dirname,'fixtures','pet-interaction-ipc.js'),'utf8');
// Hover and click reactions only swap the visual; the app stays in state "idle". A walk armed before the
// reaction (4s between walks in src/roam.js) still sees "idle" when it fires, switches to "roam", and the
// renderer's state-change handler cancels the reaction mid-play.
function harness(source){
 let time=0,seq=0;const timers=new Map(),handlers={},events=[];
 const set=(fn,ms)=>{timers.set(++seq,{fn,at:time+ms});return seq;},clear=id=>timers.delete(id);
 const ctx={currentState:'idle',setState(s){ctx.currentState=s;events.push({time,state:s});}};
 // Stand-in for src/roam.js: tick() arms the next walk; the timer only re-checks the state before walking.
 let pause=null,walk=null,active=false;
 const roam={tick(){if(active||pause)return;pause=set(()=>{pause=null;if(ctx.currentState!=='idle')return;active=true;ctx.setState('roam');walk=set(()=>{walk=null;active=false;ctx.setState('idle');},3000);},4000);},
  cancelRoam(){if(pause){clear(pause);pause=null;}if(walk){clear(walk);walk=null;}const was=active;active=false;if(was&&ctx.currentState==='roam')ctx.setState('idle');}};
 const deps={ipcMain:{on:(ch,fn)=>{handlers[ch]=fn;},removeListener(){}},cancelRoam:()=>roam.cancelRoam(),getCurrentState:()=>ctx.currentState,
  requestClickReaction:(file,duration)=>events.push({time,reaction:file,duration}),isMacPlatform:false};
 const options=new Proxy(deps,{get:(t,k)=>k in t?t[k]:()=>{}});
 const box={module:{exports:{}},require,process};
 vm.runInNewContext(source,box);box.module.exports.registerPetInteractionIpc(options);
 function advance(ms){const end=time+ms;for(;;){const next=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;timers.delete(next[0]);time=next[1].at;next[1].fn();}time=end;}
 return {ctx,roam,events,advance,react:(file,duration)=>handlers['play-click-reaction']({},file,duration)};
}
// Arms a walk, pets the head 1s later, and returns when (if ever) a walk started while the 3.2s reaction played.
function petDuringPendingWalk(source){
 const h=harness(source);h.roam.tick();h.advance(1000);h.react('clawd-react-petted.svg',3200);h.advance(3200);
 const cut=h.events.find(e=>e.state==='roam'&&e.time>1000&&e.time<4200);return {h,cut};
}
test('original lets a pending walk cut a head pat short',()=>{assert.ok(petDuringPendingWalk(fixture).cut);});
test('a reaction cancels the pending walk, and roaming resumes afterwards',()=>{
 const {h,cut}=petDuringPendingWalk(patch(fixture));
 assert.equal(cut,undefined,`roam started ${cut&&cut.time-1000}ms into the reaction`);
 assert.deepEqual(h.events.filter(e=>e.reaction).map(e=>e.reaction),['clawd-react-petted.svg']);
 h.roam.tick();h.advance(4000);assert.equal(h.ctx.currentState,'roam');
});
test('transform is idempotent, parses and rejects incompatible source',()=>{
 const once=patch(fixture);new vm.Script(once);assert.equal(patch(once),once);assert.throws(()=>patch('changed app source'));
});
