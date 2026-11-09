# R17 · Live PhiOS parent / PixelForge bridge readiness

**Status: HELD until a separate parent application actually implements and qualifies a project-ID-only PixelForge bridge.** This rung gathers public facts; it does not deploy, install or authorize anything.

## Verified distinction

- PhiOS [PR #414](https://github.com/MichaelWave369/PhiOS/pull/414) merged at `ec8dfd3cd4373aa49d5a498d1d8a578ecde4c630`. Its [post-merge native-image gate](https://github.com/MichaelWave369/PhiOS/actions/runs/42566982408), [public PixelForge iframe acceptance](https://github.com/MichaelWave369/PhiOS/actions/runs/42566982277) and local regression are green.
- Those tests use the **React PhiShell** built from `MichaelWave369/PhiOS/phishell` as an ephemeral parent on loopback.
- The actual public **`https://phi-field.com/os/`** is a separate static browser desktop, the **PhiOS Web Alpha** maintained in `MichaelWave369/phi-field/os/`. Its source says it does **not** run the full React PhiShell, private PhiOS services, or a browser permission bridge. It keeps local browser files in origin-bound IndexedDB, while PhiShell R12/R13 uses a separate `localStorage` V2 metadata registry.
- PixelForge public VR Studio **`https://michaelwave369.github.io/parallax-pixelforge/vr-studio/`** is independently available and its published R12 bridge scripts matched the merged PixelForge #89 source during #414 verification. This is a working *child* capability, **not** proof that live PhiOS Web Alpha is its parent.

## Live security boundary

The source `netlify.toml` currently declares a site-wide CSP with `default-src 'self'`, `connect-src 'none'`, `frame-ancestors 'none'`, and `X-Frame-Options: DENY`. With no separate `frame-src`, the `default-src 'self'` restriction normally prohibits an external PixelForge iframe from the live parent. Note that **`frame-ancestors` and X-Frame-Options govern inbound embedding of Phi Field**, not the frames it hosts; the outbound restriction comes from `frame-src` / `child-src` / `default-src`.

This audit **reads the actual live response headers** and reports them separately from checked-in configuration. It does not assume every Netlify configuration change in Git has already been manually promoted. It also computes whether live `os/index.html` and `os/webos.js` bytes match the checked-out source, since Netlify deployment is manual and may lag GitHub.

## Explicit audit

```sh
node --test tests/live_phios_parent_audit.test.mjs
node scripts/audit_live_phios_parent.mjs
```

The [dedicated workflow](../.github/workflows/live-parent-readiness.yml) fetches only three public URLs over HTTPS: PhiOS Web Alpha HTML, its first-party WebOS script, and the public PixelForge VR Studio page. It uses no credentials, cookies, access tokens, app files, accounts, service-worker mutation, or production deployment. It requires exact URL/no redirect, HTTP 200, safe sizes and MIME types, and emits `PHIFIELD_R17_LIVE_PARENT_READINESS`.

A green **HELD** result means the audit correctly identified that the actual public parent is **not yet** a PixelForge-capable PhiShell host. It is **not** a green live bridge or deployment qualification. A changed runtime, absent expected files or unexpected URL fails for manual review rather than automatically asserting compatibility.

## Required decisions before a live connection

1. **Select and review a real deployable parent runtime:** either stage the reviewed React PhiShell separately under an explicit new path on the Phi Field site, or deliberately implement a different PixelForge host in the Web Alpha code. Never copy PhiShell's localStorage V2 project IDs into the Web Alpha IndexedDB silently.
2. **Audit the exact built parent artifact** and its production URL, including deployed build/source pin, page base path, CSP, origin-bound IndexedDB, and local session behavior.
3. **Review a narrow CSP exception only for the dedicated pilot path**, preserving the restrictive root site policy. Do not disable CSP, XFO, or Referrer-Policy globally to make an iframe work.
4. Only after manual deployment of that reviewed artifact, repeat R12–R16 **two-live-HTTPS-origin Chromium** acceptance: exact parent source and child, default denial, explicit identity import and approval, V2 drift revoke, fresh reconnect, and zero world-file access. Native releases and production credentials remain independent.

## Other open work

The existing [Phi Field production-gate PR #5](https://github.com/MichaelWave369/phi-field/pull/5) is separately preparing a manual Netlify upload and receipt. R17 does **not** alter that PR, its packaging rules or the current `netlify.toml` security defaults. Merging this audit will not deploy it to Netlify or make PixelForge an installed app.

**Ledger Above Ego. Capability is not authority.**
