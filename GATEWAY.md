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
