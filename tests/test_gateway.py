import re
import unittest
from pathlib import Path
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[1]

class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links=[]
        self.ids=set()
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if 'id' in a: self.ids.add(a['id'])
        if tag=='a': self.links.append(a)

class GatewaySmokeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html=(ROOT/'index.html').read_text(encoding='utf-8')
        cls.css=(ROOT/'assets/styles.css').read_text(encoding='utf-8')
        cls.parser=LinkParser();cls.parser.feed(cls.html)
    def test_three_destinations(self):
        launch={a.get('data-destination'):a.get('href') for a in self.parser.links if a.get('data-destination')}
        self.assertEqual(launch,{
            'live':'https://michaelwave369.github.io/PhiOS/',
            'xr':'https://michaelwave369.github.io/PhiOS-XR/',
            'mobile':'https://michaelwave369.github.io/PhiOS-Mobile/',
        })
    def test_artwork_exists(self):
        for f in ('phi-field-desktop-ui-ready.webp','phi-field-mobile-full-world.webp','phi-field-animated-halo.svg'):
            self.assertTrue((ROOT/f).is_file(), f)
        for f in ('styles.css','app.js'):
            self.assertTrue((ROOT/'assets'/f).is_file(), f)
        self.assertIn("url('../phi-field-desktop-ui-ready.webp')",self.css)
        self.assertIn("url('../phi-field-mobile-full-world.webp')",self.css)
    def test_static_web_usable_without_js(self):
        self.assertIn('<nav class="destinies"',self.html)
        self.assertIn('href="#destinies"',self.html)
        self.assertIn('destinies',self.parser.ids)
        self.assertIn('prefers-reduced-motion:reduce',self.css)
    def test_meta_and_config(self):
        self.assertIn('https://phi-field.com/',self.html)
        self.assertIn('publish = "."',(ROOT/'netlify.toml').read_text())
        self.assertTrue((ROOT/'favicon.svg').exists())
        self.assertTrue((ROOT/'site.webmanifest').exists())
        self.assertTrue((ROOT/'sitemap.xml').exists())
    def test_no_external_js_or_script_injection(self):
        self.assertNotRegex(self.html, r'<script[^>]*src="https?://')
        self.assertNotIn('onclick=',self.html)
        self.assertEqual(len(re.findall(r'data-destination=',self.html)),3)

if __name__=='__main__': unittest.main()


class PagesAndInteractions(unittest.TestCase):
    """Deploy to either / (Netlify) or /phi-field/ (GitHub Pages) without recompiling."""
    @classmethod
    def setUpClass(cls):
        cls.html = (ROOT / 'index.html').read_text(encoding='utf-8')
        cls.js = (ROOT / 'assets/app.js').read_text(encoding='utf-8')
        cls.css = (ROOT / 'assets/styles.css').read_text(encoding='utf-8')

    def test_subpath_safe_home_and_manifest(self):
        import json
        self.assertRegex(self.html, r'class="brand" href="\./"')
        manifest = json.loads((ROOT / 'site.webmanifest').read_text(encoding='utf-8'))
        self.assertEqual(manifest['start_url'], './')
        self.assertEqual(manifest['scope'], './')
        self.assertNotIn('href="/"', self.html)

    def test_progressive_enhancement_and_motion(self):
        self.assertEqual(self.html.count('data-destination='), 3)
        self.assertIn('event.preventDefault()', self.js)
        self.assertIn('event.ctrlKey', self.js)
        self.assertIn('prefers-reduced-motion: reduce', self.js)
        self.assertIn('prefers-reduced-motion:reduce', self.css)
        self.assertIn('transition.hidden = false', self.js)
        self.assertIn('role="status"', self.html)

    def test_hosting_isolation(self):
        pages = (ROOT / '.github/workflows/pages.yml').read_text(encoding='utf-8')
        smoke = (ROOT / '.github/workflows/smoke.yml').read_text(encoding='utf-8')
        self.assertIn('actions/deploy-pages@v4', pages)
        self.assertIn('branches: [main]', pages)
        self.assertIn('path: ./dist', pages)
        self.assertNotIn('netlify deploy', pages.lower())
        self.assertNotIn('actions/deploy-pages', smoke)


class Rung3LivingWorldTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (ROOT / 'index.html').read_text(encoding='utf-8')
        cls.css = (ROOT / 'assets/styles.css').read_text(encoding='utf-8')
        cls.script = (ROOT / 'assets/world.js').read_text(encoding='utf-8')
        cls.app = (ROOT / 'assets/app.js').read_text(encoding='utf-8')

    def test_scene_is_decorative_and_progressive(self):
        for name in ('world__gate-beam', 'world__gate-rings', 'world__cursor-glow'):
            self.assertIn('class="' + name + '"', self.html)
            self.assertIn('.' + name, self.css)
        self.assertIn('src="assets/world.js" defer', self.html)
        self.assertIn("event.pointerType === 'touch'", self.script)

    def test_motion_and_low_power(self):
        self.assertIn('prefers-reduced-motion: reduce', self.script)
        self.assertIn("navigator.connection && navigator.connection.saveData", self.script)
        self.assertIn('data-quality="lite"', self.css)
        self.assertIn("html.dataset.motion === 'off'", self.script)

    def test_cancelable_transition(self):
        self.assertIn('class="portal-transition__cancel"', self.html)
        self.assertIn("?.addEventListener('click'", self.app)
        self.assertIn('cancelTransition()', self.app)

    def test_controller_without_xr_takeover(self):
        self.assertIn('navigator.xr) return', self.script)
        self.assertIn("gamepadconnected", self.script)
        self.assertIn('lastDirection = true; lastConfirm = true', self.script)
        self.assertIn("cards[index].click()", self.script)

    def test_browser_ci_and_no_netlify_deploy(self):
        workflow = (ROOT / '.github/workflows/browser-smoke.yml').read_text(encoding='utf-8')
        self.assertIn('python tests/browser_smoke.py', workflow)
        self.assertIn('pull_request:', workflow)
        self.assertNotIn('netlify deploy', workflow.lower())
