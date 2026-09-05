// --- Cute hover interactions (personal patch) ---
// The hit window already follows the theme's active hitbox. These normalized
// regions turn idle pointer dwell into small, theme-provided reactions without
// allowing scripts inside the theme itself.
const CUTE_HOVER_COOLDOWN_MS = 7000;
const CUTE_RUB_WINDOW_MS = 1800;
const CUTE_RUB_STEP_PX = 4;
const CUTE_RUB_REVERSALS = 5;
const CUTE_HOVER_ZONES = {
  head: { reaction: "hoverHead", holdMs: 3000, duration: 3200 },
  leftClaw: { reaction: "hoverLeftClaw", holdMs: 2400, duration: 2600 },
  rightClaw: { reaction: "hoverRightClaw", holdMs: 2400, duration: 2600 },
  belly: { reaction: "hoverBelly", holdMs: 3500, duration: 3200 },
  feet: { reaction: "hoverFeet", holdMs: 2800, duration: 3500 },
};

let cuteHoverZone = null;
let cuteHoverTimer = null;
let cuteHoverConsumedZone = null;
let cuteHoverCoolingDown = false;
let cuteHoverCooldownTimer = null;
let cuteRubLastX = null;
let cuteRubLastDirection = 0;
let cuteRubReversals = 0;
let cuteRubStartedAt = 0;

function cuteZoneAt(clientX, clientY) {
  const width = Math.max(1, area.offsetWidth || 1);
  const height = Math.max(1, area.offsetHeight || 1);
  const x = clientX / width;
  const y = clientY / height;
  if (x >= 0.25 && x <= 0.75 && y <= 0.38) return "head";
  if (x <= 0.23 && y >= 0.24 && y <= 0.62) return "leftClaw";
  if (x >= 0.77 && y >= 0.24 && y <= 0.62) return "rightClaw";
  if (x >= 0.28 && x <= 0.72 && y > 0.38 && y <= 0.72) return "belly";
  if (x >= 0.18 && x <= 0.82 && y > 0.72) return "feet";
  return null;
}

function canPlayCuteHoverNow() {
  return canPlayReactionNow()
    && !miniMode
    && !isDragging
    && !isDragReacting
    && !cuteHoverCoolingDown;
}

function clearCuteRub() {
  cuteRubLastX = null;
  cuteRubLastDirection = 0;
  cuteRubReversals = 0;
  cuteRubStartedAt = 0;
}

function clearCuteHoverTimer() {
  if (cuteHoverTimer) clearTimeout(cuteHoverTimer);
  cuteHoverTimer = null;
}

function resetCuteHover(resetConsumed = false) {
  clearCuteHoverTimer();
  cuteHoverZone = null;
  clearCuteRub();
  if (resetConsumed) cuteHoverConsumedZone = null;
}

function beginCuteCooldown() {
  cuteHoverCoolingDown = true;
  if (cuteHoverCooldownTimer) clearTimeout(cuteHoverCooldownTimer);
  cuteHoverCooldownTimer = setTimeout(() => {
    cuteHoverCoolingDown = false;
    cuteHoverCooldownTimer = null;
  }, CUTE_HOVER_COOLDOWN_MS);
}

function playCuteReaction(reactionName, fallbackDuration) {
  const reaction = _getReaction(reactionName);
  if (!reaction || !reaction.file || !canPlayCuteHoverNow()) return false;
  clearCuteHoverTimer();
  cuteHoverConsumedZone = cuteHoverZone;
  beginCuteCooldown();
  playReaction(reaction.file, reaction.duration || fallbackDuration);
  return true;
}

function trackCuteHeadRub(clientX) {
  const rubReaction = _getReaction("rubHead");
  if (!rubReaction || !rubReaction.file || !canPlayCuteHoverNow()) return;

  const now = Date.now();
  if (!cuteRubStartedAt || now - cuteRubStartedAt > CUTE_RUB_WINDOW_MS) {
    cuteRubStartedAt = now;
    cuteRubLastX = clientX;
    cuteRubLastDirection = 0;
    cuteRubReversals = 0;
    return;
  }

  if (cuteRubLastX === null) {
    cuteRubLastX = clientX;
    return;
  }
  const dx = clientX - cuteRubLastX;
  if (Math.abs(dx) < CUTE_RUB_STEP_PX) return;

  const direction = dx < 0 ? -1 : 1;
  if (cuteRubLastDirection && direction !== cuteRubLastDirection) cuteRubReversals++;
  cuteRubLastDirection = direction;
  cuteRubLastX = clientX;

  if (cuteRubReversals >= CUTE_RUB_REVERSALS) {
    playCuteReaction("rubHead", rubReaction.duration || 2600);
    clearCuteRub();
  }
}

function scheduleCuteHover(zone) {
  const config = CUTE_HOVER_ZONES[zone];
  if (!config || cuteHoverConsumedZone === zone || !_getReaction(config.reaction)) return;
  if (!canPlayCuteHoverNow()) return;
  clearCuteHoverTimer();
  cuteHoverTimer = setTimeout(() => {
    cuteHoverTimer = null;
    if (cuteHoverZone !== zone) return;
    playCuteReaction(config.reaction, config.duration);
  }, config.holdMs);
}

function handleCuteHoverMove(e) {
  if (isDragging || miniMode || currentState !== "idle" || dndEnabled) {
    resetCuteHover(true);
    return;
  }

  const nextZone = cuteZoneAt(e.clientX, e.clientY);
  if (nextZone !== cuteHoverZone) {
    clearCuteHoverTimer();
    cuteHoverZone = nextZone;
    cuteHoverConsumedZone = null;
    clearCuteRub();
    if (nextZone) scheduleCuteHover(nextZone);
  } else if (nextZone && !cuteHoverTimer && cuteHoverConsumedZone !== nextZone) {
    scheduleCuteHover(nextZone);
  }

  if (nextZone === "head") trackCuteHeadRub(e.clientX);
}

area.addEventListener("pointerleave", () => resetCuteHover(true));
window.addEventListener("blur", () => resetCuteHover(true));
