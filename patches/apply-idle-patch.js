"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const asar = require("@electron/asar");

const PATCH_MARKER = require("./idle-patch-transform").MARKER;
const INSTALL_DIR = process.argv[2] || path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "Programs", "Clawd on Desk");
const RESOURCES_DIR = path.join(INSTALL_DIR, "resources");
const ASAR_PATH = path.join(RESOURCES_DIR, "app.asar");
const SCRIPT_DIR = __dirname;
const BACKUP_DIR = path.join(SCRIPT_DIR, "..", "backups");
const SNIPPET_PATH = path.join(SCRIPT_DIR, "idle-patch-transform.js");

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

function patchHitRenderer(input) {
 const source = require("./idle-patch-transform").patch(input);
 require("node:vm").runInNewContext("new Function(source)", {source});
 return { source, alreadyPatched: source === input.replace(/\r\n/g, "\n") };
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

  const currentSource = asar.extractFile(ASAR_PATH, "src/tick.js").toString("utf8");
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
    const hitRendererPath = path.join(extractedDir, "src", "tick.js");
    if (!fs.existsSync(hitRendererPath)) fail("Extracted src/tick.js is missing.");
    fs.writeFileSync(hitRendererPath, patched.source, "utf8");

    await require("./repack-preserving-layout")(ASAR_PATH, extractedDir, nextAsar);

    const verification = asar.extractFile(nextAsar, "src/tick.js").toString("utf8");
    if (!verification.includes(PATCH_MARKER)) fail("Repacked archive failed marker verification.");
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
