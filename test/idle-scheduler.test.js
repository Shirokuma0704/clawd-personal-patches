'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('vm'),fs=require('fs');
const {patch}=require('../patches/idle-patch-transform');
function harness({themeId='edited-clawd',moving=true,source}={}) {
 let time=1000000,seq=0,generation=0;const timers=new Map(),events=[];
 const ctx={theme:{_id:themeId,timings:{mouseIdleTimeout:20000,mouseSleepTimeout:60000,autoReturn:{}},states:{idle:['follow.svg']},idleAnimations:[{file:'a.svg',duration:5000},{file:'b.svg',duration:5000}],eyeTracking:{eyeRatioX:.5,eyeRatioY:.5,maxOffset:3}},random:()=>0,now:()=>time,currentState:'idle',currentSvg:'follow.svg',win:{isDestroyed:()=>false,isVisible:()=>true,setIgnoreMouseEvents() {},getBounds:()=>({x:1000,y:1000,width:100,height:100})},getHitRectScreen:()=>({left:1000,right:1100,top:1000,bottom:1100}),getObjRect:()=>({x:1000,y:1000,w:100,h:100}),isVisualGenerationCurrent:g=>g===generation,setState(s){ctx.currentState=s;events.push({time,state:s});},sendToRenderer(channel,state,file,opts){events.push({time,channel,state,file});if(channel==='state-change'){ctx.currentSvg=file;const g=++generation;opts?.onLogicalSettlement({status:'committed',visualGeneration:g});return {visualGeneration:g};}}};
 const box={module:{exports:{}},require:name=>{assert.equal(name,'electron');return {screen:{getCursorScreenPoint:()=>({x:moving?time%300:1,y:1})}};},Date:{now:()=>time},Math,setTimeout:(fn,ms)=>{const id=++seq;timers.set(id,{fn,at:time+ms});return id;},clearTimeout:id=>timers.delete(id)};
 let code=source||patch(fs.readFileSync(require('node:path').join(__dirname,'fixtures','tick.js'),'utf8'));
 code=code.replace('return { startMainTick, resetIdleTimer,','return { runMainTickOnce, startMainTick, resetIdleTimer,');
 vm.runInNewContext(code,box);const tick=box.module.exports(ctx);
 function advance(ms){const end=time+ms;while(time<end){time=Math.min(end,time+50);let ready;while((ready=[...timers].find(([,t])=>t.at<=time))){timers.delete(ready[0]);ready[1].fn();}tick.runMainTickOnce();}}
 tick.runMainTickOnce();
 return {ctx,tick,events,advance,plays:()=>events.filter(e=>e.file==='a.svg'||e.file==='b.svg')};
}
test('original reproduces starvation while cursor moves',()=>{const h=harness({source:fs.readFileSync(require('node:path').join(__dirname,'fixtures','tick.js'),'utf8')});h.advance(90000);assert.equal(h.plays().length,0);});
test('moving cursor starts ambient animation after 12 seconds',()=>{const h=harness();h.advance(12500);assert.equal(h.plays().length,1);assert.equal(h.ctx.currentSvg,'a.svg');});
test('movement does not cancel playback; finishes and restores follow',()=>{const h=harness();h.advance(16000);assert.equal(h.ctx.currentSvg,'a.svg');h.advance(1500);assert.equal(h.ctx.currentSvg,'follow.svg');});
test('repeats after rest and avoids immediately repeating the same file',()=>{const h=harness();h.advance(38000);assert.deepEqual(h.plays().map(e=>e.file),['a.svg','b.svg']);});
test('work state interrupts without stale idle return',()=>{const h=harness();h.advance(13000);h.ctx.currentState='working';h.ctx.currentSvg='work.svg';h.advance(8000);assert.equal(h.ctx.currentSvg,'work.svg');h.ctx.currentState='idle';h.advance(10000);assert.equal(h.plays().length,1);h.advance(3000);assert.equal(h.plays().length,2);});
test('click reaction wins over ambient return timer',()=>{const h=harness();h.advance(13000);h.ctx.idlePaused=true;h.ctx.currentSvg='heart.svg';h.advance(6000);assert.equal(h.ctx.currentSvg,'heart.svg');});
for(const prop of ['menuOpen','dragLocked','lowPowerIdlePaused','miniMode'])test(prop+' blocks ambient playback',()=>{const h=harness();h.ctx[prop]=true;h.advance(40000);assert.equal(h.plays().length,0);});
test('startup recovery can stay awake without starving idle animations',()=>{const h=harness();h.ctx.startupRecoveryActive=true;h.advance(14000);assert.equal(h.plays().length,1);});
test('hovering pet postpones start',()=>{const h=harness();h.ctx.getHitRectScreen=()=>({left:-1,right:400,top:-1,bottom:10});h.advance(18000);assert.equal(h.plays().length,0);h.ctx.getHitRectScreen=()=>({left:1000,right:1100,top:1000,bottom:1100});h.advance(500);assert.equal(h.plays().length,1);});
test('sleep threshold still works without cursor movement',()=>{const h=harness({moving:false});h.advance(61000);assert.equal(h.ctx.currentState,'yawning');});
test('other themes retain original movement-gated behavior',()=>{const h=harness({themeId:'other'});h.advance(90000);assert.equal(h.plays().length,0);});
test('empty pool does not error or repeatedly schedule',()=>{const h=harness();h.ctx.theme.idleAnimations=[];h.tick.refreshTheme();h.advance(40000);assert.equal(h.plays().length,0);});
test('transform is idempotent and rejects incompatible source',()=>{const src=fs.readFileSync(require('node:path').join(__dirname,'fixtures','tick.js'),'utf8');assert.equal(patch(patch(src)),patch(src));assert.throws(()=>patch('changed app source'));});
