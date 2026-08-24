#!/usr/bin/env python3
"""Permanent contract for the canonical Studio workload and legacy redirect."""
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parent.parent
studio = yaml.safe_load((ROOT / 'deploy/production/studio-deployment.yaml').read_text())
redirect = yaml.safe_load((ROOT / 'deploy/production/legacy-hub-redirect.yaml').read_text())
workflow = (ROOT / '.github/workflows/deploy-web.yaml').read_text()

assert studio['metadata']['name'] == 'studio-frontend'
assert studio['spec']['template']['spec']['containers'][0]['image'].startswith('ghcr.io/acedatacloud/studio-frontend:')
assert redirect['metadata']['name'] == 'hub-frontend'  # immutable live compatibility object
assert redirect['metadata']['labels']['acedata.cloud/role'] == 'legacy-redirect'
assert 'return 301 https://studio.acedata.cloud$request_uri;' in redirect['metadata']['annotations']['nginx.ingress.kubernetes.io/configuration-snippet']
assert [rule['http']['paths'][0]['backend']['service']['name'] for rule in redirect['spec']['rules']] == ['studio-frontend', 'studio-frontend']
assert 'delete deployment hub-frontend' not in workflow
assert 'delete service hub-frontend' not in workflow
assert 'ghcr.io/acedatacloud/hub-frontend' not in workflow
print('Studio deployment contract OK')
