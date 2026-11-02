"""Create a deterministic GitHub-tested folder for Pages and manual Netlify Drop.
No Netlify API calls, secrets, network requests or automatic production deployment.
"""
import hashlib
import json
import re
import subprocess
from pathlib import Path
from shutil import copy2, rmtree
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'dist'
ASSETS = (
    'assets/styles.css', 'assets/app.js', 'assets/world.js',
    'assets/field-companion.js', 'assets/field-companion.css',
)
ROOT_FILES = (
    'index.html', 'favicon.svg', 'site.webmanifest', 'robots.txt',
    'sitemap.xml', 'netlify.toml', '_headers',
    'phi-field-desktop-ui-ready.webp', 'phi-field-mobile-full-world.webp',
    'phi-field-animated-halo.svg',
)


def source_revision():
    try:
        value = subprocess.check_output(
            ['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True, stderr=subprocess.DEVNULL,
        ).strip()
        return value if re.fullmatch('[0-9a-f]{40}', value) else 'unverified-local'
    except (OSError, subprocess.CalledProcessError):
        return 'unverified-local'


def main():
    if OUTPUT.exists():
        rmtree(OUTPUT)
    for name in (*ROOT_FILES, *ASSETS):
        source = ROOT / name
        if not source.is_file():
            raise SystemExit(f'Missing required release asset: {name}')
        target = OUTPUT / name
        target.parent.mkdir(parents=True, exist_ok=True)
        copy2(source, target)

    source_sha = source_revision()
    (OUTPUT / 'release.json').write_text(json.dumps({
        'project': 'MichaelWave369/phi-field',
        'source_commit': source_sha,
        'format_version': 1,
        'deployment': 'static-manual-production-promotion',
    }, indent=2, sort_keys=True) + '\n', encoding='utf-8')

    archive = ROOT / 'phi-field-netlify-release.zip'
    if archive.exists():
        archive.unlink()
    # Stable ZIP metadata: same inputs produce byte-identical release archives.
    with ZipFile(archive, 'w') as zipped:
        for path in sorted(OUTPUT.rglob('*')):
            if not path.is_file():
                continue
            info = ZipInfo(path.relative_to(OUTPUT).as_posix(), (2026, 1, 1, 0, 0, 0))
            info.compress_type = ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            zipped.writestr(info, path.read_bytes(), compress_type=ZIP_DEFLATED, compresslevel=9)
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    print(f'Prepared {archive.name}: {archive.stat().st_size:,} bytes, '
          f'{len(ROOT_FILES) + len(ASSETS) + 1} files, commit={source_sha}, sha256={digest}')


if __name__ == '__main__':
    main()
