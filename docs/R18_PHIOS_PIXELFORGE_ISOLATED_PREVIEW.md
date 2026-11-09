# R18 · Isolated-origin PhiShell + PixelForge review artifact

**DRAFT / NOT DEPLOYED / NO PRODUCTION AUTHORITY.** This PR packages an independently reviewable PhiShell browser pilot. It does not publish, merge, install apps, alter Netlify, grant project authority or implement an asset transfer.

## Architectural blocker and decision

The production `https://phi-field.com/os/` runs **PhiOS Web Alpha** from `phi-field/os/`, not the reviewed React PhiShell. The static workspace keeps browser-origin IndexedDB documents; PhiShell uses a separate V2 `localStorage` identity registry. A different *path* on the same origin does not isolate these browser stores, so **do not stage the pilot beneath production `/os/` or any other `phi-field.com` path**.

The existing site-wide CSP defaults to `default-src 'self'` and blocks external PixelForge frames. Setting another `frame-src` header cannot override a second restrictive CSP header. This PR does **not** modify the site's `netlify.toml`, `_headers`, site code, app catalog, DNS, production endpoint, or existing production-gate PR #5.

**Approved architectural candidate (not deployment authorization):** a standalone compiled PhiShell pilot served from a future **isolated HTTPS origin**, different from both the live Phi Field origin and the PixelForge child origin. Keep the working Web Alpha intact.

## Pinned reviewed sources

- PhiOS React PhiShell: merged PR #414, exact commit `ec8dfd3cd4373aa49d5a498d1d8a578ecde4c630`.
- PixelForge child bridge: merged PR #89, exact commit `b1c6314da005de801ba3b0417ffe4b4abe461828`.
- Reviewed child URL: `https://michaelwave369.github.io/parallax-pixelforge/vr-studio/`.
- Build-time variables: `VITE_PHIOS_PIXELFORGE_BRIDGE_URL` and `VITE_PHIOS_PIXELFORGE_BRIDGE_APPROVED_ORIGIN` set to exact reviewed public child URL and origin. This only configures an opt-in pilot; it does not permit auto-launch, project selection, or access to world files.

The R18 workflow checks out both commits with read-only permissions, verifies exact SHA pins, runs local policy tests and PhiShell tests, builds the React runtime, and creates **`phios-r18-isolated-preview-NOT-DEPLOYED`** as a GitHub Actions artifact. Its ZIP contains compiled files, a preview-only `_headers` with narrow outbound PixelForge `frame-src`, and `r18-provenance.json` containing SHA-256 for individual package files. The output is not added to the existing static `phi-field` release ZIP.

A separate existing R16 browser harness then checks a local-loopback PhiShell parent against **real public HTTPS PixelForge Pages** in Chromium, including default denial, explicit user approval, registry-drift revocation, manual revoke, reconnect denial, and zero world-file transfer. This does **not** prove the future deployed HTTPS parent, final host CSP, cross-browser interoperability, or physical Quest capability.

## Acceptance and remaining release gates

1. Inspect the draft diff, source pins, workflow permissions and `_headers`; verify new CI's result at the exact PR head. A green CI means a staged *artifact*, not a deployed bridge.
2. Choose and approve an **isolated HTTPS origin** in a separate review. **Never upload this artifact to the existing `phi-field-gateway` Netlify production project.** No automatic Pages or Netlify publishing is enabled here.
3. After separate deployment approval, inspect the **actual served** source hashes, HTTP status, CSP, XFO, Referrer-Policy and frame behavior. Test in a clean browser with a different origin from PixelForge and production. If any effective CSP blocks PixelForge, HOLD; do not use wildcards or disable security headers.
4. Use a synthetic, provider-qualified PixelForge V2 identity: prove no iframe until deliberate Start, denial before approval, cancel denial, exactly one opaque project reference on approval, denial on metadata drift, denial after manual revoke, and fresh-session denial. Confirm no PhiOffice identity or world-file/GLB contents are transferred.
5. Recheck fresh-profile persistence, Chrome/Firefox/WebKit where supported, mobile layout, and physical Quest Browser separately. Nothing here qualifies a PhiOS x86_64 Linux image or native Windows/macOS/Linux companion.
6. A separate owner-reviewed promotion plan must protect current `/os/` data and respect PR #5; no release is in scope for this PR.

## Creative pipeline remains separate

This **identity-only browser bridge** is not the UE/Fab → PixelForge verified GLB → FramefieldStudio → ParaCut file workflow. Next, qualify one appropriately licensed static asset, PixelForge's guarded export receipt and GLB hash, Framefield import + basic transform animation, rendered media and ParaCut output. Rig retargeting, PBR/texture fidelity, character authoring, distribution rights and physical workstation checks remain independent blockers.

**Ledger Above Ego: capability is not authority, and CI is not deployment.**
