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
        self.assertEqual(self.html_tree.scripts, [{'src': './catalog-data.js', 'defer': None}, {'src': './webos.js', 'defer': None}])
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

    def test_bundle_copies_webos_but_does_not_repoint_live_gateway(self):
        pack = (ROOT / 'scripts/package_site.py').read_text(encoding='utf-8')
        for name in ('os/index.html', 'os/styles.css', 'os/webos.js', 'os/sw.js',
                     'os/catalog-data.js', 'os/public-repo-catalog.v1.json'):
            self.assertIn(name, pack)
        gateway = (ROOT / 'index.html').read_text(encoding='utf-8')
        self.assertIn('href="./os/" data-destination="live"', gateway)
        self.assertIn('href="./os/"', gateway)

if __name__ == '__main__':
    unittest.main()
