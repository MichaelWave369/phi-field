# Φ Field · Living Gateway

**Source repository:** `MichaelWave369/phi-field`  
**Production site:** https://phi-field.com  
**Netlify project:** https://app.netlify.com/projects/phi-field-gateway

## What this release does

Uses the owner's existing cinematic artwork to present three real, keyboard-accessible web launch choices:

- **PhiOS Live:** https://michaelwave369.github.io/PhiOS/
- **PhiOS XR:** https://michaelwave369.github.io/PhiOS-XR/
- **PhiOS Mobile:** https://michaelwave369.github.io/PhiOS-Mobile/

These are browser previews, not a Linux, Quest, or Android operating-system replacement. Ambient animation is cosmetic and optional; reduced-motion preferences are honored.

## Keep Netlify credits under control

GitHub is the place to develop, review, and test. The GitHub Actions workflow `.github/workflows/smoke.yml` runs on pull requests and `main` and generates a **deploy-ready ZIP artifact**. Running these GitHub tests **does not deploy to Netlify**.

1. Review the PR and inspect the **Φ Field Static Smoke** GitHub Actions result.
2. Once the work is approved, mark the draft PR ready and merge to `main`.
3. Open **Actions**, select the latest successful **Φ Field Static Smoke** run for `main`, and download its `phi-field-netlify-release` artifact.
4. Extract the GitHub artifact ZIP to reveal `phi-field-netlify-release.zip`. Extract that second ZIP into a folder with `index.html` at its top level.
5. In the **existing** Netlify `phi-field-gateway` project, perform **one deliberate manual production deploy** of the extracted folder. Do not create a second Netlify project, and do not change Namecheap or TLS settings.
6. Verify `https://phi-field.com`, mobile layout, and all three destination links.

**Never enable automatic Netlify publishing from ordinary development commits or PRs without explicitly deciding to accept that deploy frequency.** A Git-linked `release` branch is a future option, not yet configured.

## Local verification

```sh
python -m unittest discover -s tests -v
python scripts/package_site.py
```

The packaging script includes only the optimized desktop/mobile artwork, halo, HTML, CSS, JS, metadata and Netlify configuration. Existing extra concept/master images and optional React overlay examples stay in the repository but do not enter the production ZIP.

The website has no frontend package manager or build dependencies. The motion toggle uses only browser storage; destination anchors work with JavaScript disabled.

## File and licensing notes

- `index.html`: semantic landing page and destinations
- `assets/styles.css`: responsive art layers, cards, and accessibility
- `assets/app.js`: optional motion toggle
- `scripts/package_site.py`: source-to-release packaging
- `tests/test_gateway.py`: static smoke checks
- `netlify.toml`: static hosting and response headers
- `ARTWORK.md`: separate artwork rights notice

The source code is MIT licensed. The supplied images are not automatically MIT licensed: see `ARTWORK.md`.
