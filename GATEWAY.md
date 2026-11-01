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
