'use strict';
const MARKER = '// Personal ambient idle scheduling v2';
// v1 restarted the 12s wait every time a roam walk returned to idle, so free roam starved every ambient motion.
const OLD_MARKERS = ['// Personal ambient idle scheduling v1'];
function patch(source) {
  source=source.replace(/\r\n/g,'\n');
  if(source.includes(MARKER))return source.replace('return isIdleEasterEggEnvironmentEligible() && !ctx.startupRecoveryActive;', 'return isIdleEasterEggEnvironmentEligible();');
  if(OLD_MARKERS.some(m=>source.includes(m)))throw Error('An older idle patch is already applied. Restore the unpatched app.asar from backups/ first, then apply again.');
  function once(a,b){const i=source.indexOf(a);if(i<0||source.indexOf(a,i+a.length)>=0)throw Error('Missing/ambiguous idle anchor: '+a.slice(0,90));source=source.slice(0,i)+b+source.slice(i+a.length);}
  once('let mainTickActive = false;',`let mainTickActive = false;
${MARKER}
let cuteIdleNextAt = now() + 12000;
let cuteIdlePlayback = false;
let cuteIdleLastSvg = null;
let cuteIdleFromRoam = false;
function cuteIdleTheme() { return theme && theme._id === "edited-clawd"; }
function cuteIdleEnvironment() {
  return isIdleEasterEggEnvironmentEligible();
}
function scheduleCuteIdleRest() { cuteIdleNextAt = now() + 18000 + Math.floor(random() * 12000); }`);
  once('  theme = ctx.theme;', '  theme = ctx.theme;\n  cuteIdlePlayback = false;\n  cuteIdleLastSvg = null;\n  cuteIdleNextAt = now() + 12000;');
  once('\n  if (idleLookAttempt !== attempt) return;','\n  if (idleLookAttempt !== attempt) return;\n  if (cuteIdlePlayback) scheduleCuteIdleRest();\n  cuteIdlePlayback = false;');
  once('    if (idleNow && !idleWasActive) {','    if (idleNow && !idleWasActive) {\n      if (!cuteIdleFromRoam) cuteIdleNextAt = now() + 12000;\n      cuteIdlePlayback = false;');
  once('    if (!idleNow && idleWasActive) {','    if (!idleNow && idleWasActive) {\n      cuteIdlePlayback = false;\n      idleLookAttempt = null;\n      idleLookVisualGeneration = null;');
  once('        idleLookPlayed = false;\n        if (idleLookReturnTimer)', '        idleLookPlayed = false;\n        if (!cuteIdlePlayback) {\n        if (idleLookReturnTimer)');
  once('          ctx.sendToRenderer("state-change", "idle", idleRestSvg());\n        }\n      }','          ctx.sendToRenderer("state-change", "idle", idleRestSvg());\n        }\n        }\n      }');
  once('        && !idleLookPlayed\n        && elapsed >= MOUSE_IDLE_TIMEOUT',`        && (cuteIdleTheme()
          ? cuteIdleEnvironment() && !ctx.mouseOverPet && now() >= cuteIdleNextAt
          : !idleLookPlayed && elapsed >= MOUSE_IDLE_TIMEOUT)`);
  once('        const pool = choice ? IDLE_ANIMS.filter((a) => a.svg !== choice) : IDLE_ANIMS;',`        let pool = choice ? IDLE_ANIMS.filter((a) => a.svg !== choice) : IDLE_ANIMS;
        if (cuteIdleTheme() && pool.length > 1) pool = pool.filter(a => a.svg !== cuteIdleLastSvg);`);
  once('          idleLookPlayed = true;\n          return nextDelay();','          idleLookPlayed = true;\n          if (cuteIdleTheme()) scheduleCuteIdleRest();\n          return nextDelay();');
  once('        const pick = easterEgg || pool[Math.floor(random() * pool.length)];',`        const pick = easterEgg || pool[Math.floor(random() * pool.length)];
        cuteIdlePlayback = cuteIdleTheme();
        if (cuteIdlePlayback) {
          cuteIdleLastSvg = pick.svg;
          if (ctx.roam) ctx.roam.cancelRoam();
          scheduleCuteIdleRest();
          cuteIdleNextAt += pick.duration;
        }`);
  once('          if (easterEgg && !isIdleEasterEggEligible(easterEgg)) {',`          if ((cuteIdlePlayback && !cuteIdleEnvironment()) || (easterEgg && !isIdleEasterEggEligible(easterEgg))) {
            cuteIdlePlayback = false;`);
  once('                isMouseIdle = false;\n                idleLookVisualGeneration = null;', '                isMouseIdle = false;\n                cuteIdlePlayback = false;\n                idleLookVisualGeneration = null;');
  once('            if (!Number.isSafeInteger(visualGeneration)) {\n              isMouseIdle = false;', '            if (!Number.isSafeInteger(visualGeneration)) {\n              isMouseIdle = false;\n              cuteIdlePlayback = false;');
  once('      if (ctx.roam) ctx.roam.tick();','      if (ctx.roam && !cuteIdlePlayback) ctx.roam.tick();');
  once('    idleWasActive = idleNow;','    idleWasActive = idleNow;\n    cuteIdleFromRoam = ctx.currentState === "roam";');
  once('function cleanup() {','function cleanup() {\n  cuteIdlePlayback = false;\n  cuteIdleFromRoam = false;');
  return source;
}
module.exports={patch,MARKER};
