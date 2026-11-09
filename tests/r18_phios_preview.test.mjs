import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {
  PHIOS_SHA, PIXELFORGE_SHA, PIXELFORGE_URL, PIXELFORGE_ORIGIN,
  PILOT_CSP, PILOT_HEADERS, assertReviewBoundary,
} from "../scripts/stage_r18_phios_preview.mjs";

test("R18 sources are immutable reviewed merge commits",()=>{
  assert.match(PHIOS_SHA,/^[a-f0-9]{40}$/);
  assert.match(PIXELFORGE_SHA,/^[a-f0-9]{40}$/);
  assert.equal(new URL(PIXELFORGE_URL).origin,PIXELFORGE_ORIGIN);
});
test("R18 outbound frame permit is narrow and not inbound permission",()=>{
  assert.ok(PILOT_CSP.includes("frame-src "+PIXELFORGE_ORIGIN));
  assert.ok(PILOT_CSP.includes("frame-ancestors 'none'"));
  assert.ok(PILOT_CSP.includes("connect-src 'none'"));
  assert.ok(PILOT_CSP.includes("default-src 'self'"));
  assert.ok(!PILOT_CSP.includes("frame-src *"));
  assert.ok(!PILOT_CSP.includes("unsafe-inline"));
  assert.ok(!PILOT_CSP.includes("unsafe-eval"));
  assert.ok(PILOT_HEADERS.includes("X-Frame-Options: DENY"));
  assert.ok(PILOT_HEADERS.includes("Referrer-Policy: strict-origin-when-cross-origin"));
});
test("R18 refuses production, same-origin and non-HTTPS previews",()=>{
  assert.equal(assertReviewBoundary({parentOrigin:"https://isolated-preview.netlify.app"}),true);
  for(const origin of [undefined,"http://isolated-preview.netlify.app",
    "https://phi-field.com","https://www.phi-field.com",
    PIXELFORGE_ORIGIN,"https://isolated-preview.netlify.app/somepath"]) {
    assert.throws(()=>assertReviewBoundary({parentOrigin:origin}));
  }
  assert.throws(()=>assertReviewBoundary({parentOrigin:"https://isolated-preview.netlify.app",
    childUrl:"https://michaelwave369.github.io/parallax-pixelforge/vr-studio/?auto=1"}));
});
test("R18 workflow never auto-publishes or configures Netlify",async()=>{
  const workflow=await readFile(new URL("../.github/workflows/r18-phios-preview.yml",import.meta.url),"utf8");
  assert.match(workflow,/pull_request:/);
  assert.match(workflow,/contents: read/);
  assert.doesNotMatch(workflow,/workflow_dispatch:|push:|pull_request_target:/);
  assert.doesNotMatch(workflow,/netlify deploy|NETLIFY_AUTH_TOKEN|deploy-prod|pages\/deploy|create-deployment/i);
  assert.match(workflow,/actions\/upload-artifact@v4/);
});
