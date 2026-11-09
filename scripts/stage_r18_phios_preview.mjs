/**
 * R18: construct a review-only, isolated-origin PhiShell pilot artifact.
 * Does not deploy or modify the existing phi-field/os workspace.
 */
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {cp, lstat, mkdir, readFile, readdir, rm, writeFile} from "node:fs/promises";
import {dirname, join, relative, resolve, sep} from "node:path";
import {fileURLToPath} from "node:url";

export const PHIOS_SHA = "ec8dfd3cd4373aa49d5a498d1d8a578ecde4c630";
export const PIXELFORGE_SHA = "b1c6314da005de801ba3b0417ffe4b4abe461828";
export const PIXELFORGE_URL = "https://michaelwave369.github.io/parallax-pixelforge/vr-studio/";
export const PIXELFORGE_ORIGIN = "https://michaelwave369.github.io";
export const PILOT_CSP = [
  "default-src 'self'", "script-src 'self'", "style-src 'self'",
  "img-src 'self' data:", "font-src 'self' data:",
  "connect-src 'none'", `frame-src ${PIXELFORGE_ORIGIN}`,
  "object-src 'none'", "base-uri 'none'", "form-action 'none'",
  "frame-ancestors 'none'", "upgrade-insecure-requests",
].join("; ");
export const PILOT_HEADERS = [
  "/*",
  `  Content-Security-Policy: ${PILOT_CSP}`,
  "  X-Frame-Options: DENY",
  "  X-Content-Type-Options: nosniff",
  "  Referrer-Policy: strict-origin-when-cross-origin",
  "  Permissions-Policy: camera=(), microphone=(), geolocation=()",
  "  Cache-Control: no-store",
  "",
].join("\n");

export function assertReviewBoundary({parentOrigin, childUrl = PIXELFORGE_URL} = {}) {
  const child = new URL(childUrl);
  assert.equal(child.href, PIXELFORGE_URL, "child URL must remain exact and reviewed");
  assert.equal(child.origin, PIXELFORGE_ORIGIN);
  assert.ok(parentOrigin, "an actual isolated HTTPS parent origin must be supplied at deployment review");
  const parent = new URL(parentOrigin);
  assert.equal(parent.origin, parentOrigin, "parent must be an exact origin");
  assert.equal(parent.protocol, "https:", "preview must use HTTPS");
  assert.notEqual(parent.origin, child.origin, "parent and child must have different origins");
  assert.notEqual(parent.origin, "https://phi-field.com", "do not substitute the live production origin");
  assert.notEqual(parent.origin, "https://www.phi-field.com", "do not substitute the live production origin");
  return true;
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHECKOUT = join(ROOT, ".interop/phios");
const PIXELFORGE = join(CHECKOUT, ".interop/pixelforge");
const BUILD = join(CHECKOUT, "phishell/dist");
const OUTPUT = join(ROOT, ".artifacts/phios-r18-preview");
function checkedOutSha(path) {
  return execFileSync("git", ["-C", path, "rev-parse", "HEAD"], {encoding:"utf8"}).trim();
}
async function inventory(dir, root = dir) {
  const result = [];
  for (const entry of await readdir(dir, {withFileTypes:true})) {
    const path = join(dir, entry.name);
    const rel = relative(root, path).split(sep).join("/");
    const stat = await lstat(path);
    assert.ok(!stat.isSymbolicLink(), `symlink not allowed: ${rel}`);
    if (stat.isDirectory()) result.push(...await inventory(path, root));
    else {
      assert.ok(stat.isFile(), `non-file disallowed: ${rel}`);
      assert.ok(stat.size <= 15_000_000, `oversize preview file: ${rel}`);
      result.push({path:rel, bytes:stat.size,
        sha256:createHash("sha256").update(await readFile(path)).digest("hex")});
    }
    assert.ok(result.length <= 5000, "preview file limit");
  }
  return result.sort((a,b)=>a.path.localeCompare(b.path));
}
export async function stagePilot() {
  assert.equal(checkedOutSha(CHECKOUT), PHIOS_SHA, "PhiOS reviewed source SHA mismatch");
  assert.equal(checkedOutSha(PIXELFORGE), PIXELFORGE_SHA, "PixelForge reviewed source SHA mismatch");
  const html = await readFile(join(BUILD,"index.html"),"utf8");
  assert.match(html, /<div id="root"><\/div>/, "expected real React PhiShell");
  assert.doesNotMatch(html, /\/src\/main\.tsx/, "Vite must produce compiled HTML");
  const files = await inventory(BUILD);
  assert.ok(files.some(f=>f.path==="index.html"));
  assert.ok(files.some(f=>f.path.endsWith(".js")), "compiled JavaScript missing");
  const bundleJS = (await Promise.all(files.filter(f=>f.path.endsWith(".js"))
    .map(f=>readFile(join(BUILD,f.path),"utf8")))).join("\n");
  assert.ok(bundleJS.includes(PIXELFORGE_URL), "reviewed PixelForge endpoint missing from build");
  assert.ok(bundleJS.includes(PIXELFORGE_ORIGIN), "reviewed PixelForge origin missing from build");
  // Never include this artifact in the existing production root or /os/ package.
  await rm(OUTPUT,{recursive:true,force:true});
  await mkdir(dirname(OUTPUT),{recursive:true});
  await cp(BUILD,OUTPUT,{recursive:true});
  await writeFile(join(OUTPUT,"_headers"),PILOT_HEADERS);
  const manifest={schema:"phi-field.phios-r18.preview-receipt.v1",status:"REVIEW_ONLY_NOT_DEPLOYED",
    phiosSha:PHIOS_SHA,pixelForgeSha:PIXELFORGE_SHA,pixelForgeUrl:PIXELFORGE_URL,
    plannedParent:"ISOLATED_HTTPS_ORIGIN_REQUIRED",nativeInstalled:false,
    productionAuthorized:false,permissionsGranted:false,worldFileAccess:false,
    contentSecurityPolicy:PILOT_CSP,files:await inventory(OUTPUT)};
  await writeFile(join(OUTPUT,"r18-provenance.json"),JSON.stringify(manifest,null,2)+"\n");
  process.stdout.write("PHIFIELD_R18_PREVIEW_PACKAGE:"+JSON.stringify({
    status:manifest.status,phiosSha:PHIOS_SHA,pixelForgeSha:PIXELFORGE_SHA,
    files:manifest.files.length,output:relative(ROOT,OUTPUT)})+"\n");
  return manifest;
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  await stagePilot();
}
