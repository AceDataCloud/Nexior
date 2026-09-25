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
assert injector_env['OFFICIAL_STUDIO_HOST'] == 'studio.acedata.cloud'
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
assert proxy_caddy['image'] == 'caddy:2.11.4-alpine@sha256:de23def33b17fb5d1290b0f6c2add1d70780e52341896c00a4c8a2a2fe9d355e'
assert injector['image'] == 'node:22.20.0-alpine@sha256:dbcedd8aeab47fbc0f4dd4bffa55b7c3c729a707875968d467aaaea42d6225af'
assert proxy_deployment['spec']['replicas'] == 2
assert proxy_deployment['spec']['minReadySeconds'] == 10
assert proxy_deployment['spec']['strategy'] == {'type': 'RollingUpdate', 'rollingUpdate': {'maxSurge': 1, 'maxUnavailable': 0}}
assert proxy_template['spec']['nodeSelector'] == {'kubernetes.io/arch': 'amd64'}
assert proxy_template['spec']['topologySpreadConstraints'][0]['whenUnsatisfiable'] == 'DoNotSchedule'
assert proxy_template['spec']['affinity']['podAntiAffinity']['requiredDuringSchedulingIgnoredDuringExecution'][0]['topologyKey'] == 'kubernetes.io/hostname'
assert proxy_pdb['spec']['minAvailable'] == 1
proxy_pvc = next(doc for doc in proxy_docs if doc.get('kind') == 'PersistentVolumeClaim')
assert proxy_pvc['spec']['accessModes'] == ['ReadWriteMany']
assert proxy_pvc['spec']['storageClassName'] == 'cfs'
proxy_volumes = {item['name']: item for item in proxy_template['spec']['volumes']}
assert proxy_volumes['data']['persistentVolumeClaim']['claimName'] == 'caddy-studio'
assert next(item for item in proxy_caddy['volumeMounts'] if item['name'] == 'data')['mountPath'] == '/data'
assert {item['name']: item['value'] for item in proxy_caddy['env']}['XDG_DATA_HOME'] == '/data'
assert 'caddy:2.8' not in apply_proxy
assert 'MIGRATION_VERIFY_HOSTS' not in apply_proxy
assert 'kubectl patch deployment' not in apply_proxy
assert 'kubectl rollout status "deployment/$DEPLOYMENT"' in apply_proxy
assert 'bash deploy/apply-studio-proxy.sh' in run_script
assert 'bash deploy/apply-studio-proxy.sh' in cutover


studio_ingress = yaml.safe_load((ROOT / 'deploy/production/studio-ingress.yaml').read_text())
studio_rules = studio_ingress['spec']['rules']
assert [rule['host'] for rule in studio_rules] == ['studio.acedata.cloud', '*.studio.acedata.cloud']
for rule in studio_rules:
    routes = {path['path']: (path['pathType'], path['backend']['service']['name'], path['backend']['service']['port']['number']) for path in rule['http']['paths']}
    assert routes['/'] == ('Prefix', 'caddy-studio-internal', 8080)
    assert routes['/assets/'] == ('Prefix', 'studio-frontend', 8085)
    assert routes['/api/v1/'] == ('Prefix', 'studio-frontend', 8085)
    assert routes['/favicon.ico'] == ('Exact', 'studio-frontend', 8085)
    assert routes['/apple-touch-icon.png'] == ('Exact', 'studio-frontend', 8085)

internal_service = next(doc for doc in proxy_docs if doc.get('kind') == 'Service' and doc['metadata']['name'] == 'caddy-studio-internal')
assert internal_service['spec']['type'] == 'ClusterIP'
assert internal_service['spec']['selector'] == {'app': 'caddy-studio-proxy'}
assert internal_service['spec']['ports'] == [{'name': 'ingress-http', 'port': 8080, 'targetPort': 'ingress-http', 'protocol': 'TCP'}]
caddy_ports = {item['name']: item['containerPort'] for item in proxy_caddy['ports']}
assert caddy_ports['ingress-http'] == 8080
assert ':8080 {' in proxy_source
assert 'import studio_routes' in proxy_source
assert proxy_source.index('@websocket {') < proxy_source.index('@direct {') < proxy_source.index('reverse_proxy localhost:3000')
assert proxy_template['metadata']['annotations']['acedata.cloud/studio-proxy-config-sha'] == '${PROXY_CONFIG_SHA}'
assert 'proxy_config_sha=$(openssl dgst -sha256 "$MANIFEST"' in apply_proxy
assert 'INTERNAL_SERVICE=caddy-studio-internal' in apply_proxy
assert run_script.index('bash deploy/apply-studio-proxy.sh') < run_script.index('kubectl apply -f deploy/production/studio-ingress.yaml')
assert cutover.index('bash deploy/apply-studio-proxy.sh') < cutover.index('kubectl apply -f deploy/production/studio-ingress.yaml')
assert 'verify-site-head.py' in cutover
assert 'rollback_ingress' in cutover
assert cutover.index('roll_stage "$RELEASE_TAG"') < cutover.index('kubectl apply -f deploy/production/studio-ingress.yaml') < cutover.index('verify-site-head.py')
