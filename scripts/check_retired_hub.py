#!/usr/bin/env python3
"""Reject retired Hub product/workload names outside compatibility-only files."""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
ALLOW_EXACT_DOMAIN = {
    Path('deploy/production/legacy-hub-redirect.yaml'),
    Path('src/utils/is.test.ts'),
    Path('.github/workflows/deploy-web.yaml'),
    Path('scripts/check_retired_hub.py'),
}
SKIP_DIRS = {'.git', 'node_modules', 'dist', 'dist-electron', 'release'}
PATTERNS = {
    'retired domain': re.compile(r'(?<![\w.-])(?:https?://)?(?:\*\.)?hub(?:-test)?\.acedata\.cloud'),
    'retired code symbol': re.compile(r'\b(?:BASE_URL_HUB|BASE_HOST_HUB|getBaseUrlHub|VITE_BASE_URL_HUB)\b'),
    'retired workload': re.compile(r'\b(?:hub-frontend|acedatacloud-hub-frontend|ghcr\.io/acedatacloud/hub-frontend)\b'),
}

def candidates():
    for path in ROOT.rglob('*'):
        if not path.is_file() or any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.suffix.lower() in {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.icns', '.woff', '.woff2', '.ttf', '.dmg'}:
            continue
        yield path

bad = []
for path in candidates():
    rel = path.relative_to(ROOT)
    text = path.read_text(encoding='utf-8', errors='ignore')
    for label, pattern in PATTERNS.items():
        if label == 'retired domain' and rel in ALLOW_EXACT_DOMAIN:
            continue
        if label in {'retired code symbol', 'retired workload'} and rel == Path('scripts/check_retired_hub.py'):
            continue
        if label == 'retired workload' and rel == Path('.github/workflows/deploy-web.yaml'):
            # Deletion of the old Kubernetes objects is the migration's final step.
            continue
        for match in pattern.finditer(text):
            line = text.count('\n', 0, match.start()) + 1
            bad.append(f'{rel}:{line}: {label}: {match.group(0)}')

if bad:
    print('Retired Hub references found outside compatibility allowlist:')
    print('\n'.join(bad))
    raise SystemExit(1)
print('Retired Hub guard OK')
