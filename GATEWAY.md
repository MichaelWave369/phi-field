# Φ Field · GitHub Preview and Production Gate

**Source:** https://github.com/MichaelWave369/phi-field
**GitHub Pages preview:** https://michaelwave369.github.io/phi-field/ (when enabled)
**Netlify production:** https://phi-field.com/

## Deployment policy

GitHub Actions validates the gateway on pull requests. After merging to `main`, the Pages workflow publishes the static site to GitHub Pages only. The smoke workflow also generates a downloadable Netlify ZIP artifact without deploying it.

Enable GitHub Pages once in **Settings → Pages → Build and deployment → Source: GitHub Actions**. Review [PAGES_PREVIEW.md](PAGES_PREVIEW.md) for detailed instructions and the manual cross-device acceptance checklist.

Netlify remains entirely separate. When the public GitHub Pages preview has been reviewed, take the successful `main` release ZIP artifact and use one deliberate manual deploy to the existing Netlify project. Do not change Namecheap DNS, domain assignments, or certificates.

## What works

The desktop, XR and Mobile anchors open the existing web-preview destinations. The visual handoff is decorative and disabled for reduced motion, touch and XR devices. The code is dependency-free and requires neither an account nor a backend. These links do not install or replace operating systems.


## Rung 3: Living World + desktop/mobile/browser checks
- Decorative pointer parallax, portal-color beams and layered rings; zero network telemetry.
- Native links work without JS; reduced-motion, touch/headset and data-saver sessions avoid expensive effects.
- Optional desktop standard gamepad D-pad/left stick for selection and A for launch; WebXR controllers are **not** commandeered.
- Desktop cinematic handoff has Escape/Cancel. Quest/touch navigation remains immediate.
- PRs run source checks plus a headless Chromium smoke workflow that tests both root and /phi-field/ hosting, responsive viewports, asset loading, reduced motion, selection and a mocked outbound launch. Screenshots are available as GitHub Actions artifacts.
- Green browser emulation is **not** physical Quest 3 certification. Check with actual Quest Browser before declaring headset quality.
- No automatic Netlify deploy. The existing production hostname remains unchanged.


## Rung 4: Field Companion (local continuity, not central identity)

The gateway now has an optional ΦSURF · COMPANION drawer: three PhiOS quick routes,
links to Gen.E.Wrist / ΦSURF and PhiOperator, a display-only callsign, pinned routes,
and an explicit last-visited route shortcut. All destination links remain ordinary
external navigations, with no implicit user-data transfer.

### Portable Field Companion v1 preferences

The only accepted export is a small UTF-8 JSON record containing:

- format: phi-field-companion
- version: 1
- profile: alias (0-32 printable characters), pinned (unique subset of live/xr/mobile),
  and last (one route identifier or null)
- appearance: effects (on or off)

Imports reject unexpected fields, unrecognized routes, malformed records, and
files exceeding 16 KiB. Each import requires explicit user confirmation. No account
credential, token, PhiOperator badge, WorldAdapter capability, saved game, or private
PhiOS memory is included or accepted. The plaintext export is not encrypted or
tamper-proof, and its alias does not prove identity.

A profile is saved only in the browser running that exact origin. The public
GitHub Pages preview and the Netlify custom domain cannot silently share it.
The user can export JSON on one and manually import it on the other. If storage
is unavailable, the current session still works and export remains available.
Reset clears only the Companion profile, not other applications or PhiOS settings.

### Explicit scope of this rung

- Gen.E.Wrist implements its own ΦSURF and WorldAdapter capability boundaries.
  This gateway provides a navigation entry, not a privileged adapter.
- PhiOperator retains its independent Passport format and learning progress.
  Field Companion neither reads nor overwrites it.
- PhiOS Live, XR, and Mobile now have reviewed manual Field Companion v1
  receivers on their public browser previews. Cross-origin automatic sync is
  still intentionally absent.
- No automatic account linking, hidden cross-origin messages, cloud sync,
  external telemetry, or Netlify deploy is introduced.

See tests/test_gateway.py and tests/browser_smoke.py for contract and Chromium checks.

## Production promotion

See [ONE_UPLOAD_PRODUCTION.md](ONE_UPLOAD_PRODUCTION.md) for the one-upload manual Netlify release procedure. Development remains on GitHub Pages.
