"""Real browser smoke for Netlify root and GitHub Pages subfolder.
Runs only on GitHub Actions, with outbound destinations mocked; no Netlify activity.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from shutil import copytree
from tempfile import TemporaryDirectory
from threading import Thread
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
SHOTS = ROOT / "browser-artifacts"
SHOTS.mkdir(exist_ok=True)

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_): pass

def check_page(browser, url, label, width, height, reduced=False, mobile=False):
    context = browser.new_context(
        viewport={"width": width, "height": height},
        reduced_motion="reduce" if reduced else "no-preference",
        has_touch=mobile,
        is_mobile=mobile,
    )
    context.route("https://michaelwave369.github.io/**",
                  lambda route: route.fulfill(status=200, content_type="text/html", body="<title>Mock PhiOS destination</title>"))
    page = context.new_page()
    errors, broken = [], []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("response", lambda response: broken.append(response.url) if response.status >= 400 and response.url.startswith(url.split("/phi-field/")[0]) else None)
    response = page.goto(url, wait_until="networkidle", timeout=30000)
    assert response and response.status == 200, f"{label}: root did not load"
    assert page.title() == "Φ FIELD | Choose Your Destiny"
    assert page.locator("a.destiny[data-destination]").count() == 3
    assert page.locator(".world__image").evaluate("(node) => getComputedStyle(node).backgroundImage.includes('phi-field-desktop-ui-ready.webp') || getComputedStyle(node).backgroundImage.includes('phi-field-mobile-full-world.webp')")
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"), f"{label}: horizontal overflow"
    assert not errors and not broken, f"{label}: errors={errors} 404s={broken}"
    page.screenshot(path=str(SHOTS / (label + ".png")), full_page=True)
    if reduced:
        assert page.locator(".motion-toggle").is_disabled()
        assert page.locator("html").get_attribute("data-motion") == "off"
    else:
        page.locator(".destiny--live").focus()
        assert page.locator(".gateway").get_attribute("data-portal") == "live"
        page.keyboard.press("ArrowRight")
        assert page.locator(".destiny--xr").evaluate("(el) => document.activeElement === el")
        assert page.locator(".gateway").get_attribute("data-portal") == "xr"
    # Rung 4 browser acceptance: opt-in export/import, pinning, keyboard and
    # same-origin persistence. No remote identity / permission transfer.
    if label == "pages-desktop":
        import json
        opener = page.locator(".field-open")
        assert opener.is_visible()
        opener.click()
        assert page.locator("#field-companion").is_visible()
        assert page.evaluate("document.activeElement.classList.contains('field-companion__close')")
        page.locator("#field-alias").fill("Explorer 369")
        page.locator(".field-companion__save").click()
        page.locator('[data-field-pin="xr"]').click()
        assert page.locator('[data-field-pin="xr"]').get_attribute("aria-pressed") == "true"
        assert page.locator(".field-companion__pinned a").count() == 1
        with page.expect_download() as pending:
            page.locator(".field-companion__export").click()
        exported = json.loads(Path(pending.value.path()).read_text(encoding="utf-8"))
        assert exported["format"] == "phi-field-companion"
        assert exported["profile"]["alias"] == "Explorer 369"
        assert exported["profile"]["pinned"] == ["xr"]
        rejected = dict(exported, permissions=["all"])
        page.locator("#field-import-file").set_input_files(
            {"name":"invalid.json","mimeType":"application/json","buffer":json.dumps(rejected).encode()})
        expect(page.locator(".field-companion__status")).to_contain_text("Import rejected")
        page.locator("#field-alias").fill("Temporary")
        page.locator(".field-companion__save").click()
        page.once("dialog", lambda dlg: dlg.accept())
        page.locator("#field-import-file").set_input_files(
            {"name":"field.json","mimeType":"application/json","buffer":json.dumps(exported).encode()})
        expect(page.locator("#field-alias")).to_have_value("Explorer 369")
        page.screenshot(path=str(SHOTS / "pages-field-companion.png"), full_page=True)
        page.keyboard.press("Escape")
        assert page.locator("#field-companion").is_hidden()
        assert page.evaluate("document.activeElement.classList.contains('field-open')")
        page.reload(wait_until="networkidle")
        assert "Explorer 369" in page.locator(".field-greeting").inner_text()
        page.locator(".field-open").click()
        assert page.locator('[data-field-pin="xr"]').get_attribute("aria-pressed") == "true"
        page.locator(".field-companion__close").click()
    page.locator(".destiny--mobile").click()
    page.wait_for_url("https://michaelwave369.github.io/PhiOS-Mobile/", timeout=10000)
    assert page.title() == "Mock PhiOS destination", label
    context.close()

def main():
    assert (ROOT / "dist/index.html").exists(), "Run scripts/package_site.py first"
    with TemporaryDirectory() as tmp:
        web_root = Path(tmp)
        copytree(ROOT / "dist", web_root / "phi-field")
        # Static files served at the root as well, to exercise Netlify-compatible paths.
        for item in (ROOT / "dist").iterdir():
            if item.is_file():
                (web_root / item.name).write_bytes(item.read_bytes())
            elif item.is_dir():
                copytree(item, web_root / item.name)
        server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=tmp))
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        base = "http://127.0.0.1:" + str(server.server_port)
        try:
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(headless=True)
                check_page(browser, base + "/phi-field/", "pages-desktop", 1440, 900)
                check_page(browser, base + "/", "netlify-root", 1280, 800)
                check_page(browser, base + "/phi-field/", "pages-phone", 390, 844, mobile=True)
                check_page(browser, base + "/phi-field/", "pages-reduced-motion", 1024, 768, reduced=True)
                browser.close()
        finally:
            server.shutdown()
    print("PASS: desktop, root, touch and reduced-motion Chromium checks")

if __name__ == "__main__":
    main()
