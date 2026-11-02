# Φ Field: one-upload production promotion

Production project (existing): https://app.netlify.com/projects/phi-field-gateway
Public domain: https://phi-field.com/
GitHub Pages proving ground: https://michaelwave369.github.io/phi-field/
Source: https://github.com/MichaelWave369/phi-field

## Permanent deployment policy

GitHub is the development environment. It runs PR checks and publishes GitHub
Pages from main. Netlify receives a stable manually approved snapshot ONLY when
you deliberately choose to promote a new public version.

- Never connect this Netlify project to GitHub continuous deployment, since
  that can start Netlify deployments for merges, pushes, or pull requests.
- Never create another Netlify project or change existing DNS/TLS settings
  to promote this gateway. The existing project already owns phi-field.com.
- The GitHub workflows intentionally have no Netlify authentication token
  or Netlify deployment step.

## Before the one Netlify upload

1. Confirm the desired main commit has green Static Smoke, Browser Acceptance,
   and GitHub Pages Preview runs in the repo Actions tab.
2. Open GitHub Pages, and inspect desktop, mobile, keyboard focus, reduced
   motion, PhiSurf Companion, and all three destination links. Quest Browser
   requires actual device testing if immersive interaction is important.
3. Download the artifact named phi-field-netlify-release from the successful
   Static Smoke workflow run for the exact main commit being promoted.
4. That artifact is a wrapper ZIP. Extract it to get the inner ZIP named
   phi-field-netlify-release.zip. Extract the inner ZIP to a normal folder
   named phi-field-netlify-production.
5. Check that index.html is immediately inside that extracted folder, along
   with _headers, release.json, netlify.toml, the asset folder and artwork.
6. Open release.json and verify source_commit matches the successful main
   commit. Keep a backup of the exact inner ZIP for rollback or auditing.

## One manual production deploy

1. Sign in to Netlify, open the EXISTING project and its Deploys page:
   https://app.netlify.com/projects/phi-field-gateway/deploys
2. Use the manual drag-and-drop deployment area for THAT project.
3. Drag the extracted phi-field-netlify-production folder, NOT the ZIP and
   NOT the whole repository, into the existing project's deploy zone.
4. Wait until the deploy is ready and published. This is the only deliberate
   production promotion, not a preview build.
5. Visit https://phi-field.com/ and https://phi-field.com/release.json.
   The public release.json source_commit must equal the promoted main commit.
6. Confirm the HTTPS address, backdrop artwork, responsive layout, Companion,
   local JSON export/import, all three portals and no JS errors.
7. Check the page response headers in browser DevTools: Content-Security-Policy
   and X-Content-Type-Options should be present. The _headers file is a
   Netlify routing rule, not a public page.

If something is wrong, use Netlify's Deploys history to restore the previous
known-good published deployment. Check the exact UI for available restore /
publish controls before proceeding.

## Important operating boundaries

- Both the GitHub Pages preview and production site present static HTML/CSS/JS.
  No cloud database, Netlify Function, account service or Netlify build job
  is necessary to display this front door.
- The URLs have separate browser origins. A stored Field Companion callsign
  and pinned destinations from GitHub Pages do not silently appear on
  phi-field.com. Use the explicit JSON export/import to transfer them.
- The Live, XR and Mobile cards launch web experiences, not operating-system
  installations. The destination apps have their own independent receivers.
- The generated release.json records the source checkout revision. The
  production folder contains its own _headers so manual Netlify Drop applies
  the protections even without reading netlify.toml as a build config.
- The produced inner ZIP has stable metadata and content for a fixed checkout.
  Its SHA256 is printed by the packaging workflow.
- Keep building on GitHub and testing on GitHub Pages. Future Netlify publishes
  must be manual, explicit and relatively infrequent.

Netlify manual deployment instructions: https://docs.netlify.com/deploy/create-deploys/
Netlify header file specification: https://docs.netlify.com/manage/routing/headers/
