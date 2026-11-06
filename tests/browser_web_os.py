"""Chromium acceptance for PhiOS Web Alpha: use the actual packaged /os/ folder."""
import json
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
SHOTS = ROOT / 'browser-artifacts'
SHOTS.mkdir(exist_ok=True)

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *_): pass

def check_desktop(browser,base):
    context=browser.new_context(viewport={'width':1440,'height':900},accept_downloads=True)
    page=context.new_page()
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    response=page.goto(base+'/os/',wait_until='networkidle')
    assert response.status==200
    assert page.title()=='Φ PhiOS Web · Browser Boot Alpha'
    expect(page.locator('#storageBadge')).to_contain_text('LOCAL STORAGE · READY')
    expect(page.locator('.window[data-app="about"]')).to_be_visible()
    # Close initial About window, create a real document, autosave and reload.
    page.locator('.window[data-app="about"] [data-control="close"]').click()
    page.locator('.launchers [data-open="files"]').click()
    page.once('dialog',lambda d:d.accept('journal.txt'))
    page.locator('.window[data-app="files"] [data-action="new-file"]').click()
    expect(page.locator('.window[data-app="notes"]')).to_be_visible()
    editor=page.locator('.window[data-app="notes"] #editor')
    editor.fill('PhiOS Web saved this note locally.')
    page.wait_for_timeout(750)
    page.reload(wait_until='networkidle')
    expect(page.locator('#storageBadge')).to_contain_text('LOCAL STORAGE · READY')
    page.locator('#appMenu').click()
    page.locator('#menu [data-open="files"]').click()
    page.locator('.window[data-app="files"] [data-action="edit-file"]').filter(has_text='journal.txt').click()
    expect(page.locator('.window[data-app="notes"] #editor')).to_have_value('PhiOS Web saved this note locally.')

    # Safe console only interprets declared local commands.
    page.locator('#appMenu').click()
    page.locator('#menu [data-open="terminal"]').click()
    console=page.locator('.window[data-app="terminal"] #command')
    console.fill('ls');console.press('Enter')
    expect(page.locator('.window[data-app="terminal"] .terminal')).to_contain_text('journal.txt')
    console.fill('sudo rm -rf /');console.press('Enter')
    expect(page.locator('.window[data-app="terminal"] .terminal')).to_contain_text('Unsupported command')

    # User-initiated plaintext export, rejected invalid import, accepted restore.
    page.locator('#appMenu').click()
    page.locator('#menu [data-open="settings"]').click()
    with page.expect_download() as pending:
        page.locator('.window[data-app="settings"] [data-action="export"]').click()
    contents=json.loads(Path(pending.value.path()).read_text(encoding='utf-8'))
    assert contents['format']=='phios-web-alpha'
    assert any(d['name']=='journal.txt' for d in contents['docs'])
    page.locator('#importFile').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':b'{"format":"other"}'})
    expect(page.locator('#toast')).to_contain_text('Import rejected')
    page.once('dialog',lambda d:d.accept())
    page.locator('#importFile').set_input_files({'name':'backup.json','mimeType':'application/json','buffer':json.dumps(contents).encode()})
    expect(page.locator('#toast')).to_contain_text('Workspace imported locally')
    # Shared catalog is offline, public-source-only and never an installer.
    page.locator('#appMenu').click()
    page.locator('#menu [data-open="catalog"]').click()
    catalog=page.locator('.window[data-app="catalog"]')
    expect(catalog.locator('#catalog-meta')).to_contain_text('225 / 225 public repositories')
    assert catalog.locator('.catalog-entry').count()==35
    catalog.locator('#catalog-search').fill('GenEWrist')
    expect(catalog.locator('#catalog-meta')).to_contain_text('public repositories')
    assert catalog.locator('.catalog-entry').count()>=1
    assert catalog.locator('.catalog-entry a').first.get_attribute('href').startswith('https://github.com/MichaelWave369/')
    assert catalog.get_by_text('INSTALL',exact=True).count()==0
    # Universal Shelf R2: pin, reorder, export and restore portable source IDs.
    catalog.locator('.catalog-entry [data-shelf-action="pin"]').first.click()
    assert page.locator('#shelf-list .shelf-entry').count()==1
    page.locator('.window[data-app="catalog"] [data-control="close"]').click()
    with page.expect_download() as shelf_export:
        page.locator('[data-shelf-action="export"]').click()
    shelf_backup=json.loads(Path(shelf_export.value.path()).read_text(encoding="utf-8"))
    assert shelf_backup["format"]=="phios-app-shelf"
    assert shelf_backup["version"]==1
    assert len(shelf_backup["pinned"])==1
    page.reload(wait_until="networkidle")
    page.locator('.window[data-app="about"] [data-control="close"]').click()
    assert page.locator('#shelf-list .shelf-entry').count()==1,"Source pin did not survive reload"
    page.locator('#shelfImportFile').set_input_files({"name":"malicious.json","mimeType":"application/json",
        "buffer":json.dumps(dict(shelf_backup,install_authority=True)).encode("utf-8")})
    expect(page.locator('#toast')).to_contain_text("Shelf import refused")
    assert page.locator('#shelf-list .shelf-entry').count()==1
    page.locator('#shelf-list [data-shelf-action="unpin"]').click()
    assert page.locator('#shelf-list .shelf-entry').count()==0
    page.once("dialog",lambda d:d.accept())
    page.locator('#shelfImportFile').set_input_files({"name":"shelf.json","mimeType":"application/json",
        "buffer":json.dumps(shelf_backup).encode("utf-8")})
    expect(page.locator('#shelf-list .shelf-entry')).to_have_count(1)
    expect(page.locator('#shelf-status')).to_contain_text("source bookmarks")
    # R4: only the reviewed first-party PWA gets browser-managed install controls.
    page.locator('#appMenu').click()
    page.locator('#menu [data-open="appcenter"]').click()
    center=page.locator('.window[data-app="appcenter"]')
    expect(center).to_be_visible()
    expect(center.locator('.reviewed-app')).to_contain_text('CI-REVIEWED WEB PWA')
    expect(center.locator('.reviewed-app')).to_contain_text('NOT INDEPENDENTLY VERIFIED')
    expect(center.locator('[data-action="pwa-install"]')).to_have_text('INSTALL IN BROWSER MENU')
    assert center.locator('a[href="./"]').count()==1
    page.evaluate("""() => {
      window.__phiInstallCalls=0;
      const event=new Event('beforeinstallprompt',{cancelable:true});
      event.prompt=()=>{window.__phiInstallCalls++;return Promise.resolve({outcome:'dismissed'});};
      window.dispatchEvent(event);
    }""")
    expect(center.locator('[data-action="pwa-install"]')).to_have_text('INSTALL WITH BROWSER')
    assert page.evaluate("window.__phiInstallCalls")==0,'Install prompt executed without user gesture'
    center.locator('[data-action="pwa-install"]').click()
    page.wait_for_function("window.__phiInstallCalls === 1")
    # R5: observe PWA context, request a real same-origin service-worker check,
    # and never claim native uninstall or rollback is possible in JavaScript.
    expect(center.locator('#pwa-observed-state')).to_contain_text('normal browser tab')
    center.locator('[data-action="pwa-update"]').click()
    expect(center.locator('#pwa-lifecycle-result')).to_contain_text('not controlled')
    center.locator('[data-action="pwa-manage"]').click()
    expect(center.locator('#pwa-lifecycle-result')).to_contain_text('cannot uninstall itself')
    page.screenshot(path=str(SHOTS/'phios-web-desktop.png'),full_page=True)
    assert not errors,errors
    context.close()

def check_phone(browser,base):
    context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,reduced_motion='reduce')
    page=context.new_page()
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    response=page.goto(base+'/os/',wait_until='networkidle')
    assert response.status==200
    assert page.locator('.launchers [data-open]').count()==8
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), 'Horizontal overflow'
    page.locator('#appMenu').click()
    page.locator('#menu [data-open="notes"]').click()
    expect(page.locator('.window[data-app="notes"]')).to_be_visible()
    page.screenshot(path=str(SHOTS/'phios-web-phone.png'),full_page=True)
    assert not errors,errors
    context.close()

def check_gateway_boot(browser,base):
    context=browser.new_context(viewport={'width':1280,'height':800})
    page=context.new_page()
    page.goto(base+'/',wait_until='networkidle')
    assert page.locator('.destiny--live').get_attribute('href')=='./os/'
    page.locator('.destiny--live').click()
    page.wait_for_url(base+'/os/',timeout=10000)
    assert page.title()=='Φ PhiOS Web · Browser Boot Alpha'
    context.close()

def main():
    assert (ROOT/'dist/os/index.html').exists(),'Build the Netlify bundle first'
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT/'dist')))
    thread=Thread(target=server.serve_forever,daemon=True)
    thread.start()
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch(headless=True)
            base='http://127.0.0.1:'+str(server.server_port)
            check_gateway_boot(browser,base)
            check_desktop(browser,base)
            check_phone(browser,base)
            browser.close()
    finally:server.shutdown()
    print('PASS: PhiOS Web local data persistence, console refusals, export/import, desktop + phone')

if __name__=='__main__':main()
