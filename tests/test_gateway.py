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

