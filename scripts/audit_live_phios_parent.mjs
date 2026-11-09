/**
 * R17 read-only audit of the ACTUAL live PhiOS parent at phi-field.com/os/.
 *
 * The live Web Alpha is a separate codebase from the React PhiShell preview.
 * A live PixelForge child and a green PhiOS source test do NOT imply this
 * parent is an approved, connected host. Never publish/configure anything.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const LIVE_PHIOS_PARENT = "https://phi-field.com/os/";
export const LIVE_PIXELFORGE_CHILD =
  "https://michaelwave369.github.io/parallax-pixelforge/vr-studio/";
const MAX_HTML_BYTES = 1024 * 1024;
const MAX_SCRIPT_BYTES = 1024 * 1024;
const sha256 = buffer => createHash("sha256").update(buffer).digest("hex");

function directiveMap(policy) {
  if (!policy) return null;
  const result = new Map();
  for (const directive of policy.toLowerCase().split(";")) {
    const [name, ...values] = directive.trim().split(/\s+/);
    if (!name) continue;
    // CSP duplicate directives are not a license to select a permissive one.
    if (!result.has(name)) result.set(name, values);
  }
  return result;
}

/** CSP frame-src falls back to child-src then default-src. XFO concerns
 * embedding THIS page and is not an outbound-iframe permission mechanism. */
export function classifyOutboundFramePolicy(policy, parentOrigin, childOrigin) {
  const map = directiveMap(policy);
  if (!map) return { status: "unknown", directive: null };
  const name = map.has("frame-src") ? "frame-src"
    : map.has("child-src") ? "child-src"
      : map.has("default-src") ? "default-src" : null;
  if (!name) return { status: "not-restricted-by-csp", directive: null };
  const sources = map.get(name);
  if (!sources.length || sources.includes("'none'")) {
    return { status: "blocked", directive: name };
  }
  const allowed = sources.some(token => {
    if (token === "'self'") return parentOrigin === childOrigin;
    if (token === "*") return true;
    if (token === childOrigin.toLowerCase()) return true;
    // URL origin patterns need a separate browser test; do not certify them
    // based on an incomplete CSP parser.
    return false;
  });
  return { status: allowed ? "origin-listed-not-browser-proven" : "blocked", directive: name };
}

export function classifyLiveParent({ html, webos, contentSecurityPolicy,
  responseUrl = LIVE_PHIOS_PARENT }) {
  if (typeof html !== "string" || typeof webos !== "string") {
    throw Error("Missing actual live HTML or script body");
  }
  const exactUrl = new URL(responseUrl);
  if (exactUrl.href !== LIVE_PHIOS_PARENT) throw Error("Unexpected live parent URL");
  const source = classifyOutboundFramePolicy(contentSecurityPolicy,
    exactUrl.origin, new URL(LIVE_PIXELFORGE_CHILD).origin);
  const isWebAlpha = /<title>\s*Φ PhiOS Web · Browser Boot Alpha\s*<\/title>/u.test(html)
    && /<script\s+src="\.\/webos\.js"\s+defer><\/script>/i.test(html)
    && /const STORE = 'phi-web-r1'/u.test(webos);
  const hasPhiShellReactRoot = /<div\s+id="root"/i.test(html);
  const hasWorkspaceBridge = webos.includes("phios.workspace-bridge.v1");
  const hasPixelForgeHost = webos.includes("PixelForgeBridgePilot")
    || webos.includes("phios-pixelforge-bridge");
  const parentReady = !isWebAlpha && hasWorkspaceBridge && hasPixelForgeHost;
  return Object.freeze({
    liveParent: LIVE_PHIOS_PARENT,
    expectedSourceRepo: "MichaelWave369/phi-field",
    runtime: isWebAlpha ? "phi-field-web-alpha" : "unknown-or-changed",
    isPhiShellReactRoot: hasPhiShellReactRoot,
    r12WorkspaceBridgePresent: hasWorkspaceBridge,
    pixelForgeHostPresent: hasPixelForgeHost,
    outboundPixelForgeFrameCSP: source.status,
    controllingCSPDirective: source.directive,
    readiness: parentReady ? "REVIEW_REQUIRED_NOT_AUTHORIZED" : "HELD_NOT_LIVE_PHIOS_HOST",
    productionPermissionGranted: false,
    productionConfigChanged: false,
    nativeInstalled: false,
  });
}

async function getExactUrl(url, limit) {
  const response = await fetch(url, {
    method: "GET", redirect: "manual", cache: "no-store",
    headers: { Accept: "text/html,application/javascript;q=0.9,*/*;q=0.2" },
    signal: AbortSignal.timeout(20000),
  });
  assert.equal(response.status, 200, "Unexpected public HTTP status: " + url);
  assert.equal(response.url, url, "Unexpected public redirect: " + url);
  const length = Number(response.headers.get("content-length") ?? "0");
  assert.ok(length <= limit, "Oversized live resource: " + url);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.ok(bytes.length > 50 && bytes.length <= limit,
    "Empty or oversized live resource: " + url);
  return { response, bytes };
}

export async function auditLivePhiOSParent() {
  const page = await getExactUrl(LIVE_PHIOS_PARENT, MAX_HTML_BYTES);
  const source = await getExactUrl(new URL("webos.js", LIVE_PHIOS_PARENT).href,
    MAX_SCRIPT_BYTES);
  const remoteChild = await getExactUrl(LIVE_PIXELFORGE_CHILD, MAX_HTML_BYTES);
  assert.match(page.response.headers.get("content-type") || "", /text\/html/i);
  assert.match(remoteChild.response.headers.get("content-type") || "", /text\/html/i);
  const html = page.bytes.toString("utf8");
  const webos = source.bytes.toString("utf8");
  const localHtml = await readFile(resolve("os/index.html"), "utf8");
  const localScript = await readFile(resolve("os/webos.js"), "utf8");
  const result = classifyLiveParent({
    html, webos,
    contentSecurityPolicy: page.response.headers.get("content-security-policy"),
    responseUrl: page.response.url,
  });
  const receipt = Object.freeze({
    schema: "phi-field.r17.live_parent_bridge_readiness.v0.1",
    ...result,
    liveParentHTTP: page.response.status,
    livePixelForgeHTTP: remoteChild.response.status,
    liveParentContentType: page.response.headers.get("content-type"),
    liveParentCSP: page.response.headers.get("content-security-policy"),
    liveParentXFrameOptions: page.response.headers.get("x-frame-options"),
    liveParentReferrerPolicy: page.response.headers.get("referrer-policy"),
    // Revisions differ until the owner manually promotes a tested ZIP.
    liveParentHTMLMatchesMain: sha256(page.bytes) === sha256(Buffer.from(localHtml)),
    liveParentScriptMatchesMain: sha256(source.bytes) === sha256(Buffer.from(localScript)),
    phiOSReactSourcePromotedHere: false,
    bridgingLiveParentToPixelForgeProven: false,
    publicNetlifyDeploymentModified: false,
  });
  console.log("PHIFIELD_R17_LIVE_PARENT_READINESS:" + JSON.stringify(receipt));
  // A successful audit that correctly reports HELD is intentionally green.
  // If live output unexpectedly changes into a new runtime, require review
  // instead of silently claiming a new live adapter is safe.
  assert.equal(result.runtime, "phi-field-web-alpha",
    "Live PhiOS parent changed; independent browser and source review required");
  assert.equal(result.readiness, "HELD_NOT_LIVE_PHIOS_HOST");
  assert.equal(result.pixelForgeHostPresent, false);
  return receipt;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  auditLivePhiOSParent().catch(error => {
    console.error("PHIFIELD_R17_LIVE_PARENT_AUDIT_FAILED:", error.message);
    process.exitCode = 1;
  });
}
