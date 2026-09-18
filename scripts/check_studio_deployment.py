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

container = studio['spec']['template']['spec']['containers'][0]
assert studio['spec']['strategy']['type'] == 'RollingUpdate'
assert studio['spec']['strategy']['rollingUpdate'] == {'maxSurge': 1, 'maxUnavailable': 0}
assert studio['spec']['minReadySeconds'] == 10
assert container['readinessProbe']['httpGet']['path'] == '/index.html'
cutover = (ROOT / 'deploy/verify-cutover.sh').read_text()
dockerfile = (ROOT / 'Dockerfile').read_text()
bridge = cutover.index('roll_stage "${RELEASE_TAG}-bridge"')
final = cutover.index('roll_stage "$RELEASE_TAG"')
verify = cutover.index('verify-html-assets.py')
annotate = cutover.index('last-successful-revision')
assert bridge < final < verify < annotate
assert 'local tag=$1 fallback=$2 expected=' not in cutover
assert 'local tag=$1 fallback=$2\n  local expected="$IMAGE_REPOSITORY:$tag"' in cutover
assert 'FROM ${PREVIOUS_IMAGE} AS bridge' in dockerfile
assert 'FROM runtime-base AS final' in dockerfile
assert workflow.index('preflight-release.sh') < workflow.index('--target bridge') < workflow.index('verify-release-unchanged.sh') < workflow.index('verify-cutover.sh')
print('Studio deployment contract OK')
ci = (ROOT / '.github/workflows/check-pr.yaml').read_text()
assert 'test-compatible-images.sh studio-frontend' in ci

prepare = (ROOT / 'deploy/prepare-previous-assets.sh').read_text()
assert 'docker pull "$PREVIOUS_IMAGE"' in prepare
assert 'kubectl exec' not in prepare

proxy_path = ROOT / 'deploy/production/studio-proxy.yaml'
proxy_source = proxy_path.read_text()
proxy_docs = list(yaml.safe_load_all(proxy_source))
proxy_deployment = next(doc for doc in proxy_docs if doc.get('kind') == 'Deployment')
proxy_template = proxy_deployment['spec']['template']
injector = next(container for container in proxy_template['spec']['containers'] if container['name'] == 'html-injector')
injector_env = {item['name']: item['value'] for item in injector['env']}
apply_proxy = (ROOT / 'deploy/apply-studio-proxy.sh').read_text()
run_script = (ROOT / 'deploy/run.sh').read_text()
assert 'reverse_proxy @websocket studio-frontend.acedatacloud.svc.cluster.local:8085' in proxy_source
assert 'reverse_proxy localhost:3000' in proxy_source
assert injector_env['SITE_HEAD_API'] == 'https://platform.acedata.cloud/api/v1/site-head/'
assert proxy_template['metadata']['annotations']['acedata.cloud/html-injector-sha'] == '${INJECTOR_SHA}'
assert injector['readinessProbe']['httpGet']['path'] == '/healthz'
assert injector['livenessProbe']['httpGet']['path'] == '/healthz'
assert 'kubectl create configmap studio-html-injector' in apply_proxy
assert 'openssl dgst -sha256' in apply_proxy
assert 'kubectl rollout status deployment/caddy-studio-proxy' in apply_proxy
assert 'deploy/apply-studio-proxy.sh' in run_script
assert 'deploy/apply-studio-proxy.sh' in cutover
