"""R1 contracts: PhiOS Web is local-first and packaging never mutates the live gateway."""
import json
import unittest
from pathlib import Path
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[1]
OS = ROOT / 'os'

class Inspector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.links = []
        self.scripts = []
    def handle_starttag(self, tag, attrs):
        props = dict(attrs)
        if props.get('id'):
            self.ids.add(props['id'])
        if tag == 'a':
            self.links.append(props)
        if tag == 'script':
            self.scripts.append(props)

class WebOSContracts(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (OS / 'index.html').read_text(encoding='utf-8')
        cls.js = (OS / 'webos.js').read_text(encoding='utf-8')
        cls.css = (OS / 'styles.css').read_text(encoding='utf-8')
        cls.sw = (OS / 'sw.js').read_text(encoding='utf-8')
        cls.html_tree = Inspector()
        cls.html_tree.feed(cls.html)

    def test_accessible_browser_desktop(self):
        for name in ('desktop', 'windows', 'dock', 'appMenu', 'importFile', 'toast', 'storageBadge'):
            self.assertIn(name, self.html_tree.ids)
        for app in ('files', 'notes', 'terminal', 'ledger', 'settings', 'catalog', 'about'):
            self.assertIn('data-open="'+app+'"', self.html)
        self.assertEqual(self.html_tree.scripts, [{'src': './catalog-data.js', 'defer': None}, {'src': './shelf-portable.js', 'defer': None}, {'src': './app-center-data.js', 'defer': None}, {'src': './webos.js', 'defer': None}])
        self.assertIn('prefers-reduced-motion:reduce', self.css)
        self.assertIn('type="file"', self.html)

    def test_local_persistence_and_export(self):
        for term in ('indexedDB.open', "createObjectStore('records')", "kvPut(", "kvGet(",
                     "format:'phios-web-alpha'", "JSON.stringify(backupState()", "validateBackup",
                     'IMPORT_LIMIT', 'FILE_LIMIT', 'window.confirm('):
            self.assertIn(term, self.js, term)
        self.assertIn("'indexeddb'", self.js)
        self.assertIn('SESSION ONLY', self.js)

    def test_no_remote_or_privileged_execution(self):
        for term in ('eval(', 'new Function(', 'postMessage(', 'fetch(', 'WebSocket(',
                     'localStorage.setItem(', 'document.cookie', 'getUserMedia(', 'navigator.usb'):
            self.assertNotIn(term, self.js, term)
        self.assertNotIn('src="https://', self.html)
        self.assertNotIn('src="http://', self.html)
        self.assertIn('No host shell access', self.js)
        self.assertIn('NOT a cryptographically verified', self.js)
        self.assertIn('No account', self.html)

    def test_service_worker_scope_and_pwa(self):
        manifest = json.loads((OS / 'manifest.webmanifest').read_text(encoding='utf-8'))
        self.assertEqual(manifest['start_url'], './')
        self.assertEqual(manifest['scope'], './')
        self.assertIn("register('./sw.js',{scope:'./'})", self.js)
        self.assertIn("url.pathname.startsWith(scope.pathname)", self.sw)
        self.assertIn("url.origin!==scope.origin", self.sw)
        self.assertTrue((OS / 'icon.svg').is_file())

    def test_public_catalog_has_exact_pinned_discovery_scope(self):
        data = json.loads((OS / 'public-repo-catalog.v1.json').read_text(encoding='utf-8'))
        self.assertEqual(data['schema'], 'phios.public-repo-catalog.v1')
        self.assertEqual(len(data['apps']), 225)
        self.assertEqual(data['provenance']['scope'], 'public')
        self.assertEqual(data['provenance']['source_blob_sha'], 'e295f6265e60032de98a2acd8e53295505fc47e8')
        self.assertEqual(len({app['id'] for app in data['apps']}), 225)
        self.assertTrue(all(app['availability'] == 'source_only' for app in data['apps']))
        self.assertFalse(data['policy']['automatic_install'])
        self.assertFalse(data['policy']['automatic_launch'])
        bundled = (OS / 'catalog-data.js').read_text(encoding='utf-8')
        self.assertTrue(bundled.startswith('/* Pinned public-source catalog:'))
        self.assertEqual(json.loads(bundled.split(' = ', 1)[1].strip().rstrip(';')), data)
        self.assertIn('data-open="catalog"', self.html)
        self.assertIn("'VIEW SOURCE ↗'", self.js)
        self.assertIn('DISCOVERY ONLY', self.js)
        self.assertNotIn('data-action="install"', self.js)

    def test_portable_shelf_is_source_only_and_has_separate_storage(self):
        shelf = (OS / 'shelf-portable.js').read_text(encoding='utf-8')
        self.assertIn("phios-app-shelf", shelf)
        self.assertIn("LIMIT=24", shelf)
        self.assertIn("automatic_install!==false", shelf)
        for marker in ("id=\"app-shelf\"", "id=\"shelfImportFile\"", "id=\"shelf-list\""):
            self.assertIn(marker, self.html)
        self.assertIn("kvPut(state.db,'app-shelf-r2'", self.js)
        self.assertIn("await restoreShelf()", self.js)
        self.assertIn("api.parse(await file.text(),catalog)", self.js)
        self.assertIn("data-shelf-action", self.js)
        self.assertIn("shelf-portable.js", self.sw)

    def test_reviewed_pwa_only_and_browser_controls_install(self):
        data=json.loads((OS/'app-center-reviews.v1.json').read_text(encoding='utf-8'))
        source=json.loads((OS/'public-repo-catalog.v1.json').read_text(encoding='utf-8'))
        self.assertEqual(data['catalog_source_sha'], source['provenance']['source_blob_sha'])
        self.assertEqual(len(data['reviewed_web_apps']), 1)
        app=data['reviewed_web_apps'][0]
        self.assertEqual(app['app_id'], 'github:1442243366')
        self.assertEqual(app['review_status'], 'ci_reviewed_browser_app')
        self.assertFalse(app['evidence']['live_endpoint_independently_verified'])
        self.assertFalse(app['actions']['native_install'])
        self.assertFalse(data['policy']['autonomous_installs'])
        self.assertIn('data-open="appcenter"',self.html)
        self.assertIn("event.preventDefault()",self.js)
        self.assertIn("'beforeinstallprompt'",self.js)
        self.assertIn("'appinstalled'",self.js)
        self.assertIn("pending.prompt()",self.js)
        self.assertIn("if(key==='pwa-install'){installBrowserApp();return;}",self.js)
        self.assertIn('app-center-data.js',self.sw)
        wrapped=(OS/'app-center-data.js').read_text(encoding='utf-8')
        self.assertEqual(json.loads(wrapped.split(' = ',1)[1].strip().rstrip(';')),data)

    def test_r5_browser_lifecycle_never_claims_native_uninstall(self):
        self.assertIn("check.dataset.action='pwa-update'", self.js)
        self.assertIn("help.dataset.action='pwa-manage'", self.js)
        self.assertIn("navigator.serviceWorker.getRegistration('./')", self.js)
        self.assertIn("await registration.update()", self.js)
        self.assertIn("display-mode: standalone", self.js)
        self.assertIn("This page has no uninstall or rollback permission.", self.js)
        self.assertIn("phios-web-alpha-lifecycle-r5-v5", self.sw)

    def test_bundle_copies_webos_but_does_not_repoint_live_gateway(self):
        pack = (ROOT / 'scripts/package_site.py').read_text(encoding='utf-8')
        for name in ('os/index.html', 'os/styles.css', 'os/webos.js', 'os/sw.js',
                     'os/catalog-data.js', 'os/shelf-portable.js', 'os/public-repo-catalog.v1.json',
                     'os/app-center-data.js', 'os/app-center-reviews.v1.json'):
            self.assertIn(name, pack)
        gateway = (ROOT / 'index.html').read_text(encoding='utf-8')
        self.assertIn('href="./os/" data-destination="live"', gateway)
        self.assertIn('href="./os/"', gateway)

if __name__ == '__main__':
    unittest.main()
