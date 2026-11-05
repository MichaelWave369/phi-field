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
        for app in ('files', 'notes', 'terminal', 'ledger', 'settings', 'about'):
            self.assertIn('data-open="'+app+'"', self.html)
        self.assertEqual(self.html_tree.scripts, [{'src': './webos.js', 'defer': None}])
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

    def test_bundle_copies_webos_but_does_not_repoint_live_gateway(self):
        pack = (ROOT / 'scripts/package_site.py').read_text(encoding='utf-8')
        for name in ('os/index.html', 'os/styles.css', 'os/webos.js', 'os/sw.js'):
            self.assertIn(name, pack)
        gateway = (ROOT / 'index.html').read_text(encoding='utf-8')
        self.assertIn('https://michaelwave369.github.io/PhiOS/', gateway)
        self.assertNotIn('href="os/', gateway)

if __name__ == '__main__':
    unittest.main()
