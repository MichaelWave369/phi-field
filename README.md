# Φ FIELD · Choose Your Destiny

Official web gateway for [phi-field.com](https://phi-field.com). One field, three paths.

**GitHub Pages proving ground:** [michaelwave369.github.io/phi-field/](https://michaelwave369.github.io/phi-field/) once Pages is enabled in GitHub Settings. See [PAGES_PREVIEW.md](PAGES_PREVIEW.md) for instructions. Pull requests do not deploy anything; merging to main publishes GitHub Pages only, never Netlify.

## Destinations

| Choice | Current web experience | Notes |
| --- | --- | --- |
| PhiOS Live | ./os/ (same origin) | Local-first browser desktop (Alpha R1), not a Linux OS install |
| PhiOS XR | https://michaelwave369.github.io/PhiOS-XR/ | Browser 3D and optional compatible headset WebXR |
| PhiOS Mobile | https://michaelwave369.github.io/PhiOS-Mobile/ | Touch-first browser/PWA preview, not a replacement Android ROM |

These are real `<a>` links. No account, tracker, JavaScript framework, network API, cookies, or privileged OS integration is required. Ambient motion is cosmetic only and can be disabled; `prefers-reduced-motion` is honored. Rung 2 adds reactive portal effects, optional short desktop transitions, and arrow-key selection; headset/touch and reduced-motion links navigate natively.

**PhiOS Web R1:** the Live card now boots the working static application at `/os/`. The separate [PhiOS public architecture site](https://michaelwave369.github.io/PhiOS/) remains available, as does the full [PhiOS source repository](https://github.com/MichaelWave369/PhiOS). The browser desktop is unprivileged and keeps its data in same-origin IndexedDB. The production Netlify site remains manual-upload only.

## Cost-conscious workflow

**Production stays untouched while developing.** This repository is the source of truth. Preview and test locally or with GitHub Actions first. Connect Netlify's Git-based continuous deployment **only when the release is approved**, because enabling it may trigger builds on future pushes and PRs. To limit deploy/credit usage, consider keeping production publishing manual, or configure Netlify builds only on a deliberate `release` branch and commit only after review.

For a single no-build upload to the existing Netlify site, **download the GitHub Actions release artifact, unzip twice if needed, and upload the contents of the resulting site bundle** (where `index.html` lives), not the full GitHub repository. With Netlify CLI, `netlify deploy --prod --dir .` publishes the static contents, but is not necessary if using dashboard drag-and-drop.

## Run locally

```sh
python -m http.server 4173 --directory .
```

Open `http://localhost:4173`. Run checks without installing dependencies:

```sh
python -m unittest discover -s tests -v
```

## GitHub Actions deploy-ready bundle

`.github/workflows/smoke.yml` tests the repository on PRs and `main`, then packages only the required site files into `phi-field-netlify-release.zip` using `scripts/package_site.py`. The ZIP is a **GitHub Actions artifact**. No Netlify deployment is triggered by these tests. Keep any Netlify automatic publishing disabled until explicitly approved.

## Architecture and asset notes

- `index.html`: semantic, keyboard-accessible gateway and native destination links.
- `assets/styles.css`: fluid desktop + mobile layouts, accessible motion rules.
- `assets/app.js`: optional local-only ambient-motion preference.
- `phi-field-desktop-ui-ready.webp`: optimized cinematic desktop world from supplied pack.
- `phi-field-mobile-full-world.webp`: mobile composition from supplied pack.
- `phi-field-animated-halo.svg`: decorative original glyph from supplied pack.
- `netlify.toml`: static publish settings and strict security headers, applied only when Netlify processes the deployment.

Artwork source: `phi-field-gateway-assets.zip`, supplied by project owner. The images are separate from the MIT license for code; see `ARTWORK.md`. Images contain static dragon, waterfall, and aircraft. Cosmetic CSS layers do not independently animate those objects.

## Release checklist

- [ ] Tests pass on `main` and external destinations still resolve.
- [ ] Desktop and 390px mobile browser render reviewed.
- [ ] Keyboard navigation / reduced-motion reviewed.
- [ ] Netlify project uses the correct production branch or one reviewed manual deploy.
- [ ] No secrets or unreviewed pull requests are automatically published.
- [ ] After deployment, verify `https://phi-field.com`, certificate, redirect, and all three cards.

**Do not connect this repository to an auto-publishing Netlify site before review.**

## Repository asset layout

Original source artwork and optional React living-overlay assets are maintained at the repository root. The static gateway deliberately references those original files to avoid duplicating binary artwork in Git history. Browser code lives under `assets/`, with `index.html` as the site entry point.

**Deployment policy:** Netlify production stays manually controlled. Do not connect a development branch to production or enable automatic publishing until ready; deploy only the reviewed release branch.
