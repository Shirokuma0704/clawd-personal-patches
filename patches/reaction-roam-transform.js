'use strict';
const MARKER = '// Personal patch: reactions cancel a pending roam';
// Click and hover reactions keep the app in state "idle", so a walk armed before the reaction still starts
// on time, switches to "roam", and the renderer's state-change handler cancels the reaction mid-play.
// Cancelling the walk here matches drag-lock; the tick loop re-arms it once the reaction resumes idle.
function patch(source) {
  source=source.replace(/\r\n/g,'\n');
  if(source.includes(MARKER))return source;
  const anchor='  on("play-click-reaction", (_event, svg, duration) => {\n';
  const i=source.indexOf(anchor);
  if(i<0||source.indexOf(anchor,i+anchor.length)>=0)throw Error('Missing/ambiguous reaction anchor: play-click-reaction');
  return source.slice(0,i+anchor.length)+`    ${MARKER}\n    cancelRoam();\n`+source.slice(i+anchor.length);
}
module.exports={patch,MARKER};
