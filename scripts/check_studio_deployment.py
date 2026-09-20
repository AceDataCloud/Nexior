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
assert 'kubectl rollout status "deployment/$DEPLOYMENT"' in apply_proxy
assert 'deploy/apply-studio-proxy.sh' in run_script
assert 'deploy/apply-studio-proxy.sh' in cutover

proxy_pdb = next(doc for doc in proxy_docs if doc.get('kind') == 'PodDisruptionBudget')
proxy_caddy = next(container for container in proxy_template['spec']['containers'] if container['name'] == 'caddy')
expected_caddy_image = 'caddy:2.11.4-alpine@sha256:de23def33b17fb5d1290b0f6c2add1d70780e52341896c00a4c8a2a2fe9d355e'
assert proxy_caddy['image'] == expected_caddy_image
assert proxy_deployment['spec']['replicas'] == 2
assert proxy_deployment['spec']['minReadySeconds'] == 10
assert proxy_deployment['spec']['revisionHistoryLimit'] == 2
assert proxy_deployment['spec']['strategy'] == {
    'type': 'RollingUpdate',
    'rollingUpdate': {'maxSurge': 1, 'maxUnavailable': 0},
}
assert proxy_pdb['spec']['minAvailable'] == 1
assert proxy_pdb['spec']['selector']['matchLabels'] == {'app': 'caddy-studio-proxy'}
spread = proxy_template['spec']['topologySpreadConstraints'][0]
assert spread['topologyKey'] == 'kubernetes.io/hostname'
assert spread['whenUnsatisfiable'] == 'DoNotSchedule'
anti_affinity = proxy_template['spec']['affinity']['podAntiAffinity']['requiredDuringSchedulingIgnoredDuringExecution'][0]
assert anti_affinity['topologyKey'] == 'kubernetes.io/hostname'
assert '"strategy":{"type":"Recreate"' in apply_proxy
main_body = apply_proxy.split('main() {', 1)[1]
assert main_body.index('preflight_image') < main_body.index('start_target_single')
assert main_body.index('start_target_single') < main_body.rindex('kubectl apply -f "$rendered"')
assert 'verify_tls "$MIGRATION_VERIFY_HOSTS"' in apply_proxy
assert 'verify_runtime 2' in apply_proxy
assert 'rollout undo' not in apply_proxy
assert 'caddy:2.8' not in apply_proxy
assert 'migration_marker' in apply_proxy
assert 'nodeSelector' in apply_proxy
assert 'render_single_manifest' in apply_proxy
assert proxy_template['spec']['nodeSelector'] == {'kubernetes.io/arch': 'amd64'}
assert 'bash deploy/apply-studio-proxy.sh' in run_script
assert 'bash deploy/apply-studio-proxy.sh' in cutover

proxy_pvc = next(doc for doc in proxy_docs if doc.get('kind') == 'PersistentVolumeClaim')
assert proxy_pvc['metadata']['name'] == 'caddy-studio'
assert proxy_pvc['spec']['accessModes'] == ['ReadWriteMany']
assert proxy_pvc['spec']['storageClassName'] == 'cfs'
proxy_volumes = {item['name']: item for item in proxy_template['spec']['volumes']}
assert proxy_volumes['data']['persistentVolumeClaim']['claimName'] == 'caddy-studio'
assert next(item for item in proxy_caddy['volumeMounts'] if item['name'] == 'data')['mountPath'] == '/data'
assert {item['name']: item['value'] for item in proxy_caddy['env']}['XDG_DATA_HOME'] == '/data'
assert proxy_caddy['readinessProbe']['httpGet']['port'] == 80
assert injector['readinessProbe']['httpGet']['port'] == 3000
assert injector['livenessProbe']['httpGet']['port'] == 3000
