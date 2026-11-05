from pathlib import Path
from shutil import copy2, rmtree
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'dist'
ASSETS = ('assets/styles.css', 'assets/app.js', 'assets/world.js', 'assets/field-companion.js', 'assets/field-companion.css')
OS_FILES = (
    'os/index.html', 'os/styles.css', 'os/webos.js', 'os/sw.js',
    'os/manifest.webmanifest', 'os/icon.svg', 'os/README.md',
)
ROOT_FILES = (
    'index.html', 'favicon.svg', 'site.webmanifest', 'robots.txt',
    'sitemap.xml', 'netlify.toml', 'phi-field-desktop-ui-ready.webp',
    'phi-field-mobile-full-world.webp', 'phi-field-animated-halo.svg',
)


def main():
    if OUTPUT.exists():
        rmtree(OUTPUT)
    for name in (*ROOT_FILES, *ASSETS, *OS_FILES):
        source = ROOT / name
        if not source.is_file():
            raise SystemExit(f'Missing required release asset: {name}')
        target = OUTPUT / name
        target.parent.mkdir(parents=True, exist_ok=True)
        copy2(source, target)

    archive = ROOT / 'phi-field-netlify-release.zip'
    if archive.exists():
        archive.unlink()
    with ZipFile(archive, 'w', ZIP_DEFLATED) as zipped:
        for path in sorted(OUTPUT.rglob('*')):
            if path.is_file():
                zipped.write(path, path.relative_to(OUTPUT))
    print(f'Prepared {archive.name}: {archive.stat().st_size:,} bytes, {len(ROOT_FILES) + len(ASSETS) + len(OS_FILES)} files')


if __name__ == '__main__':
    main()
