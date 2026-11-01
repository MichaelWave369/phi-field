# Φ Field · GitHub Pages proving ground

**GitHub Pages preview:** https://michaelwave369.github.io/phi-field/ (after Pages is enabled and the workflow succeeds)

**Production:** https://phi-field.com/ (Netlify, independent and not deployed by this repository)

## Enable the Pages preview once

1. Open **GitHub → MichaelWave369/phi-field → Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions** and save the choice.
3. Open **Actions → Φ Field GitHub Pages Preview**. The workflow triggers when the Pages workflow is first merged to `main`. If it didn't run, use **Run workflow** against `main`.
4. Wait for a successful deploy job, then open `https://michaelwave369.github.io/phi-field/`. A small **GITHUB PAGES · PREVIEW** label distinguishes this public preview from production.

## What deploys where

- Pull requests: only `.github/workflows/smoke.yml` validates and packages release files. **Nothing goes to Pages or Netlify**.
- Merge to `main`: `.github/workflows/smoke.yml` validates and creates a Netlify ZIP **without publishing it**. `.github/workflows/pages.yml` independently validates, packs the same files into `dist/`, and publishes that snapshot to **GitHub Pages only**.
- Netlify production: manual, after explicit review of the same release ZIP. No automatic Netlify integration exists in these workflows.

If Pages shows a build error saying Pages is disabled, confirm **Settings → Pages → Source = GitHub Actions**. Repo owners must make that one-time configuration; the connected repository interface doesn't expose this setting.

## Review checklist before production

- Check the cinematic desktop layout at large and 1024px browser widths.
- On a phone at 390px and 320px, all three portal choices remain usable and the artwork doesn't create horizontal scrolling.
- In Quest Browser, select **PhiOS XR** and verify the destination loads. XR entry happens on that destination, not automatically on this gateway.
- Confirm all three links open the correct preview projects.
- Check Tab, Shift+Tab, arrow-key card navigation, and Enter.
- Verify the WORLD EFFECTS switch works and reduced-motion turns off animations.
- Test GitHub Pages under the `/phi-field/` path (logo returns to gateway and images load). The same source works under `/` on Netlify.
- In Chrome/Edge, ensure HTTPS is secure on the preview. Netlify's custom-domain HTTPS is a separate configuration that should remain unchanged.

## Limitations

The dragon, waterfall, aircraft and characters are painted into the source image. Ambient layers and portal response animate, but this build does **not** independently animate individual background objects. The destination portals launch external **web previews**, not native OS images. No shared login, file transfer, or cross-device session synchronization has been implemented. These are future work items requiring an explicit secure design.
