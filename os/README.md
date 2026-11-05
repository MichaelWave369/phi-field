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
