import test from "node:test";
import assert from "node:assert/strict";
import {
  LIVE_PHIOS_PARENT,
  LIVE_PIXELFORGE_CHILD,
  classifyOutboundFramePolicy,
  classifyLiveParent,
} from "../scripts/audit_live_phios_parent.mjs";

const parentOrigin="https://phi-field.com";
const pixelOrigin="https://michaelwave369.github.io";
const html='<title>Φ PhiOS Web · Browser Boot Alpha</title>'
  + '<script src="./webos.js" defer></script><div id="desktop"></div>';
const webos="(() => { const STORE = 'phi-web-r1'; })();";
const csp="default-src 'self'; script-src 'self'; frame-ancestors 'none'; connect-src 'none'";

test("R17 recognizes Web Alpha as different from the more advanced PhiShell",()=>{
  const result=classifyLiveParent({
    html,webos,contentSecurityPolicy:csp,responseUrl:LIVE_PHIOS_PARENT,
  });
  assert.equal(result.runtime,"phi-field-web-alpha");
  assert.equal(result.isPhiShellReactRoot,false);
  assert.equal(result.r12WorkspaceBridgePresent,false);
  assert.equal(result.pixelForgeHostPresent,false);
  assert.equal(result.readiness,"HELD_NOT_LIVE_PHIOS_HOST");
  assert.equal(result.outboundPixelForgeFrameCSP,"blocked");
  assert.equal(result.controllingCSPDirective,"default-src");
  assert.equal(result.productionPermissionGranted,false);
  assert.equal(result.productionConfigChanged,false);
  assert.equal(result.nativeInstalled,false);
});

test("R17 uses outbound frame-src, not inbound frame-ancestors or XFO",()=>{
  assert.deepEqual(classifyOutboundFramePolicy(
    "frame-ancestors 'none'; frame-src https://michaelwave369.github.io",
    parentOrigin,pixelOrigin),
    {status:"origin-listed-not-browser-proven",directive:"frame-src"});
  assert.deepEqual(classifyOutboundFramePolicy(
    "frame-ancestors *; frame-src 'none'",parentOrigin,pixelOrigin),
    {status:"blocked",directive:"frame-src"});
  assert.deepEqual(classifyOutboundFramePolicy(
    csp,parentOrigin,pixelOrigin),
    {status:"blocked",directive:"default-src"});
  assert.deepEqual(classifyOutboundFramePolicy(
    "default-src *; child-src 'none'",parentOrigin,pixelOrigin),
    {status:"blocked",directive:"child-src"});
});

test("R17 refuses ambiguous or missing CSP rather than certifying framing",()=>{
  assert.equal(classifyOutboundFramePolicy(null,parentOrigin,pixelOrigin).status,
    "unknown");
  assert.equal(classifyOutboundFramePolicy("script-src 'self'",parentOrigin,pixelOrigin).status,
    "not-restricted-by-csp");
  assert.equal(classifyOutboundFramePolicy(
    "frame-src https://unreviewed.example",parentOrigin,pixelOrigin).status,
    "blocked");
});

test("A hypothetical adapter name inside a Web Alpha string is not proof",()=>{
  const result=classifyLiveParent({
    html,webos:webos+" // PixelForgeBridgePilot phios.workspace-bridge.v1",
    contentSecurityPolicy:csp,
  });
  assert.equal(result.runtime,"phi-field-web-alpha");
  // A heuristic match is not trusted while the site is still the static
  // browser boot; a real separate review must prove a working host runtime.
  assert.equal(result.readiness,"HELD_NOT_LIVE_PHIOS_HOST");
});

test("A changed live parent URL demands review",()=>{
  assert.throws(()=>classifyLiveParent({
    html,webos,contentSecurityPolicy:csp,responseUrl:"https://www.phi-field.com/os/",
  }),/Unexpected live parent URL/);
  assert.equal(new URL(LIVE_PIXELFORGE_CHILD).origin,pixelOrigin);
});

test("PhiShell-like HTML by itself never authenticates live project authority",()=>{
  const result=classifyLiveParent({
    html:'<div id="root"></div>',
    webos:'console.log("not a host")',
    contentSecurityPolicy:null,
  });
  assert.equal(result.runtime,"unknown-or-changed");
  assert.equal(result.readiness,"HELD_NOT_LIVE_PHIOS_HOST");
  assert.equal(result.productionPermissionGranted,false);
});
