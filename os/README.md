# Φ PhiOS Web · Browser Boot R1

**Alpha 0.1, unprivileged browser edition.** This is a working local-first browser desktop at `/os/` in the phi-field website package. It is **not** a Linux PhiOS boot, a full PhiShell runtime or a private PhiOS service connection.

## Working functions

- Keyboard/touch-accessible desktop, launcher, multi-window manager, minimize/maximize, pointer dragging, responsive phone layout
- A **virtual** text file manager and Notes editor
- IndexedDB persistent data on this *browser origin* with visible session-only fallback when storage is denied
- Safe **simulated console** with a small explicitly enumerated command language, **not** a shell interpreter
- Local activity history (not an independently verified Reality Ledger or security receipt)
- Local preferences, explicit JSON export/import with schema/size checks and overwrite confirmation
- Service worker for an offline static app shell, scoped to the `os/` path; no background synchronization
- No accounts, analytics, remote scripts, network APIs, stored credentials, privileged actions, AI agent execution, or trust-boundary bypass

Data is **not synchronized** between GitHub Pages and Netlify: each origin has distinct IndexedDB. Export and import a plain JSON backup manually if switching origin. Browser clearing/eviction/private mode can delete data, so regular export is important. Exports are **unencrypted**. No external application or document files are touched.

## Universal Shell R1 public app catalog

The desktop now has a **Public App Catalog** window. It searches the **same 225 public GitHub source identities** as PhiOS Mobile and the PhiOS native interop catalog, sourced from FieldConstellation's dated 2026-11-04 complete-at-snapshot public inventory (source blob `e295f6265e60032de98a2acd8e53295505fc47e8`).

The self-contained release includes the canonical JSON and equivalent local JS data. Both are packaged in the `/os/` service-worker cache. No network fetch, new permissions, external script host or changes to Netlify's root CSP are required. All entries are **SOURCE ONLY**; individual GitHub source pages open only on an explicit click and are not imported or executed. Old metadata can become stale; the count is not guaranteed to reflect repositories created after the snapshot. No private repositories are included.

An actual install requires a platform-specific, qualified app manifest, exact source/artifact and license review, verified runtime adapter and human approval. Browser bookmarking or source discovery is **not** application installation.

## Universal App Shelf R2

The Web desktop now shows a persistent **App Shelf** beneath the local app shortcuts. Use **PIN SOURCE** in App Catalog, reorder entries with Up/Down, and explicitly export/import `phios-app-shelf` v1 JSON (24 public pins maximum, 16 KiB import bound). These are GitHub source bookmarks only, **never native or web installs**. The UI displays `SOURCE ONLY` and separately notes unverified declared websites. Data saves in a dedicated IndexedDB record on this origin, independently of notes and the full workspace backup. Other devices need an explicit portable-shelf export/import; no automatic syncing takes place.

The portable JavaScript implementation is byte-identical to `PhiOS/interop/shelf-portable.v1.js` and `PhiOS-Mobile/src/shelf-portable.js`. The native PhiOS Python CLI can read the same shelf JSON but is not yet a full PhiShell GUI integration. See the [R2 contract](https://github.com/MichaelWave369/PhiOS/blob/main/docs/PHIOS_UNIVERSAL_SHELL_R2_APP_SHELF.md) after merge. This remains a manual Netlify release.

## Test and rollout

The static site packaging includes `os/` in the Netlify-ready ZIP, with `/os/index.html` as the entry point, and supports GitHub Pages under `/phi-field/os/`. The staged release root gateway's **PhiOS Live** button now points to its own `./os/` folder. Nothing changes at the live Netlify site until the owner manually uploads the approved ZIP. The R1 app is also independently launchable.

Run:
```sh
python -m unittest discover -s tests -v
python scripts/package_site.py
python -m http.server 4173 --directory dist
```

Open http://localhost:4173/os/.

Acceptance: clean Chromium desktop/phone load, files and notes persist after reload, session fallback is honest, export/import validates and round-trips, console refuses arbitrary commands, keyboard/modal controls work, service worker caches only its scoped static shell, and the root gateway still loads.

**Next rung:** share audited PhiOS app contracts, connect only explicit browser-capable app manifests, then consider an opt-in authenticated local bridge with independent authorization. No unaudited backend or unrestricted operating system access.
