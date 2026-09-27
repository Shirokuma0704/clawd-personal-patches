"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const asar = require("@electron/asar");

const PATCH_MARKER = "// --- Cute hover interactions (personal patch) ---";
const DOUBLE_CLICK_MARKER = "// Personal patch: double-click reaction pool";
const INSTALL_DIR = process.argv[2] || path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "Programs", "Clawd on Desk");
const RESOURCES_DIR = path.join(INSTALL_DIR, "resources");
const ASAR_PATH = path.join(RESOURCES_DIR, "app.asar");
const SCRIPT_DIR = __dirname;
const BACKUP_DIR = path.join(SCRIPT_DIR, "..", "backups");
const SNIPPET_PATH = path.join(SCRIPT_DIR, "cute-hover-snippet.inc.js");

function fail(message) {
  throw new Error(`[cute-patch] ${message}`);
}

function replaceOnce(source, before, after, label) {
  const first = source.indexOf(before);
  if (first < 0) fail(`Patch anchor not found: ${label}. Clawd may have changed.`);
  if (source.indexOf(before, first + before.length) >= 0) {
    fail(`Patch anchor is ambiguous: ${label}. Refusing to modify the archive.`);
  }
  return source.slice(0, first) + after + source.slice(first + before.length);
}

// clickLeft / clickRight normally take one `file`. This lets them carry a `files` pool
// (like the 4-click `double` reaction) and never repeats the previous pick back to back.
// Themes without `files` keep the original single-file behaviour.
function patchDoubleClickPool(source) {
  source = replaceOnce(
    source,
    "let firstClickDir = null;\n",
    "let firstClickDir = null;\nlet lastDoubleClickFile = null;\n",
    "click state declarations"
  );
  return replaceOnce(
    source,
    "        const react = dir === \"left\" ? leftReact : rightReact;\n        playReaction(react.file, react.duration || 2500);",
    "        const react = dir === \"left\" ? leftReact : rightReact;\n" +
    `        ${DOUBLE_CLICK_MARKER}\n` +
    "        const pool = Array.isArray(react.files) && react.files.length ? react.files : [react.file];\n" +
    "        const choices = pool.length > 1 ? pool.filter((f) => f !== lastDoubleClickFile) : pool;\n" +
    "        lastDoubleClickFile = choices[Math.floor(Math.random() * choices.length)];\n" +
    "        playReaction(lastDoubleClickFile, react.duration || 2500);",
    "double-click reaction"
  );
}

function patchHitRenderer(input) {
  let source = input.replace(/\r\n/g, "\n");
  const original = source;
  // Each part checks its own marker so an install patched by an older version still gets the newer parts.
  if (!source.includes(PATCH_MARKER)) source = patchHoverInteractions(source);
  if (!source.includes(DOUBLE_CLICK_MARKER)) source = patchDoubleClickPool(source);
  return { source, alreadyPatched: source === original };
}

function patchHoverInteractions(source) {
  source = replaceOnce(
    source,
    "  window.hitAPI.onThemeConfig((cfg) => {\n    tc = cfg || {};",
    "  window.hitAPI.onThemeConfig((cfg) => {\n    resetCuteHover(true);\n    tc = cfg || {};",
    "theme-config callback"
  );
  source = replaceOnce(
    source,
    "  if (data.dndEnabled !== undefined) dndEnabled = data.dndEnabled;\n});",
    "  if (data.dndEnabled !== undefined) dndEnabled = data.dndEnabled;\n  if (currentState !== \"idle\" || miniMode || dndEnabled) resetCuteHover(true);\n});",
    "state-sync callback"
  );
  source = replaceOnce(
    source,
    "  if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; clickCount = 0; firstClickDir = null; }\n  isReacting = false;",
    "  if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; clickCount = 0; firstClickDir = null; }\n  resetCuteHover(true);\n  isReacting = false;",
    "reaction cancellation"
  );
  source = replaceOnce(
    source,
    "area.addEventListener(\"pointerdown\", (e) => {\n  if (e.button === 0) {\n    if (miniMode)",
    "area.addEventListener(\"pointerdown\", (e) => {\n  if (e.button === 0) {\n    resetCuteHover(true);\n    if (miniMode)",
    "pointerdown"
  );
  source = replaceOnce(
    source,
    "document.addEventListener(\"pointermove\", (e) => {\n  if (isDragging) {",
    "document.addEventListener(\"pointermove\", (e) => {\n  handleCuteHoverMove(e);\n  if (isDragging) {",
    "pointermove"
  );

  const snippet = fs.readFileSync(SNIPPET_PATH, "utf8").trimEnd();
  source = replaceOnce(
    source,
    "\n// --- Drag reaction ---",
    `\n\n${snippet}\n\n// --- Drag reaction ---`,
    "drag reaction section"
  );
  if (!source.includes(PATCH_MARKER)) fail("Patch marker is missing after patch construction.");
  return source;
}

function extractArchiveSafely(archivePath, destination) {
  const unpackedRoot = `${archivePath}.unpacked`;
  let missingUnpackedFiles = 0;
  for (const archiveEntry of asar.listPackage(archivePath)) {
    const relative = archiveEntry.slice(1);
    const metadata = asar.statFile(archivePath, relative);
    const outputPath = path.join(destination, relative);
    if (metadata.files) {
      fs.mkdirSync(outputPath, { recursive: true });
      continue;
    }

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    if (metadata.unpacked) {
      const externalPath = path.join(unpackedRoot, relative);
      if (fs.existsSync(externalPath)) {
        fs.copyFileSync(externalPath, outputPath);
      } else {
        // electron-builder prunes native binaries for other platforms after
        // packaging but leaves their unpacked metadata in the ASAR header.
        fs.writeFileSync(outputPath, Buffer.alloc(0));
        missingUnpackedFiles++;
      }
    } else {
      fs.writeFileSync(outputPath, asar.extractFile(archivePath, relative));
    }
  }
  return missingUnpackedFiles;
}

async function main() {
  if (!fs.existsSync(ASAR_PATH)) fail(`app.asar not found: ${ASAR_PATH}`);
  if (!fs.existsSync(SNIPPET_PATH)) fail(`snippet not found: ${SNIPPET_PATH}`);

  const currentSource = asar.extractFile(ASAR_PATH, "src/hit-renderer.js").toString("utf8");
  const patched = patchHitRenderer(currentSource);
  new (require("node:vm").Script)(patched.source);
  if (process.argv.includes("--check")) { console.log("[cute-patch] Compatibility and syntax checks passed."); return; }
  if (patched.alreadyPatched) {
    console.log("[cute-patch] Already applied. Nothing changed.");
    return;
  }

  const originalBytes = fs.readFileSync(ASAR_PATH);
  const originalHash = crypto.createHash("sha256").update(originalBytes).digest("hex");
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const backupPath = path.join(BACKUP_DIR, `app-${originalHash.slice(0, 16)}.asar`);
  if (!fs.existsSync(backupPath)) fs.copyFileSync(ASAR_PATH, backupPath);

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "clawd-cute-patch-"));
  const extractedDir = path.join(tempRoot, "app");
  const nextAsar = path.join(tempRoot, "app.asar");
  try {
    const missingUnpackedFiles = extractArchiveSafely(ASAR_PATH, extractedDir);
    const hitRendererPath = path.join(extractedDir, "src", "hit-renderer.js");
    if (!fs.existsSync(hitRendererPath)) fail("Extracted src/hit-renderer.js is missing.");
    fs.writeFileSync(hitRendererPath, patched.source, "utf8");

    await require("./repack-preserving-layout")(ASAR_PATH, extractedDir, nextAsar);

    const verification = asar.extractFile(nextAsar, "src/hit-renderer.js").toString("utf8");
    if (!verification.includes(PATCH_MARKER) || !verification.includes(DOUBLE_CLICK_MARKER)) fail("Repacked archive failed marker verification.");
    const expectedInstalledHash = crypto.createHash("sha256").update(fs.readFileSync(nextAsar)).digest("hex");
    fs.copyFileSync(nextAsar, ASAR_PATH);
    const actualInstalledHash = crypto.createHash("sha256").update(fs.readFileSync(ASAR_PATH)).digest("hex");
    if (actualInstalledHash !== expectedInstalledHash) fail("Installed archive failed final hash verification.");
    console.log(`[cute-patch] Applied successfully. Backup: ${backupPath}`);
    if (missingUnpackedFiles > 0) {
      console.log(`[cute-patch] Preserved ${missingUnpackedFiles} pruned cross-platform native entries as absent.`);
    }
  } catch (error) {
    if (fs.existsSync(backupPath)) fs.copyFileSync(backupPath, ASAR_PATH);
    throw error;
  } finally {
    const resolvedTemp = path.resolve(tempRoot);
    const resolvedOsTemp = path.resolve(os.tmpdir()) + path.sep;
    if (resolvedTemp.startsWith(resolvedOsTemp) && path.basename(resolvedTemp).startsWith("clawd-cute-patch-")) {
      fs.rmSync(resolvedTemp, { recursive: true, force: true });
    }
  }
}

module.exports = { patchHitRenderer };
if (require.main === module) main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exitCode = 1;
});
