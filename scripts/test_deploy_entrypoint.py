import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFESTS = ['studio-deployment.yaml', 'studio-service.yaml', 'studio-proxy.yaml', 'legacy-hub-redirect.yaml', 'studio-ingress.yaml']

FAKE_KUBECTL = r'''
import json, os, sys
from pathlib import Path
args = sys.argv[1:]
assert args[:2] == ['--context', 'test-cluster'], args
with open(os.environ['COMMAND_LOG'], 'a') as log:
    log.write(json.dumps(args) + '\n')
args = args[2:]
if args[:2] == ['apply', '-f']:
    data = {Path(args[i + 1]).name: Path(args[i + 1]).read_text()
            for i, value in enumerate(args) if value == '-f'}
    Path(os.environ['CAPTURE']).write_text(json.dumps(data))
    sys.exit(int(os.environ.get('APPLY_STATUS', '0')))
if args[:2] == ['rollout', 'status']:
    sys.exit(int(os.environ.get('ROLLOUT_STATUS', '0')))
if args[:2] == ['get', 'pods']:
    old = os.environ.get('OLD_POD') == 'true'
    expected = os.environ['IMAGE_REPOSITORY'] + ':' + os.environ['RELEASE_TAG'] + '-bridge'
    items = [{'metadata': {'deletionTimestamp': 'pending'} if old else {},
              'status': {'phase': 'Running'},
              'spec': {'containers': [{'image': 'old-image' if old else expected}]}}]
    print(json.dumps({'items': items}))
    sys.exit(0)
if args[:2] == ['get', 'deployment']:
    fields = {'{.spec.replicas}': '2', '{.metadata.generation}': '4',
              '{.status.observedGeneration}': '4', '{.status.updatedReplicas}': '2',
              '{.status.readyReplicas}': '2', '{.status.availableReplicas}': '2',
              '{.status.unavailableReplicas}': ''}
    print(fields[args[-1].removeprefix('jsonpath=')])
    sys.exit(0)
if args[:2] == ['get', 'endpoints']:
    print('pod-a\npod-b')
    sys.exit(0)
if args[:2] == ['get', 'pod']:
    repository = os.environ['IMAGE_REPOSITORY']
    print(repository + ('@sha256:abc' if 'imageID' in args[-1] else ':12345-2'))
    sys.exit(0)
raise AssertionError(args)
'''


class DeployEntrypointTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name)
        shutil.copytree(ROOT / 'deploy', self.path / 'deploy')
        self.bin = self.path / 'bin'
        self.bin.mkdir()
        self.fake('kubectl', '#!' + sys.executable + '\n' + FAKE_KUBECTL)
        self.env = dict(os.environ, PATH=f'{self.bin}:{os.environ["PATH"]}',
                        RELEASE_TAG='12345-2', KUBE_CONTEXT='test-cluster',
                        COMMAND_LOG=str(self.path / 'commands'), CAPTURE=str(self.path / 'capture'),
                        DEPLOYMENT='studio-frontend', SERVICE='studio-frontend',
                        IMAGE_REPOSITORY='ghcr.io/acedatacloud/studio-frontend')

    def fake(self, name, contents):
        path = self.bin / name
        path.write_text(contents)
        path.chmod(0o755)

    def run_script(self, script, *args):
        return subprocess.run(['bash', str(self.path / 'deploy' / script), *args],
                              cwd='/', env=self.env, text=True, capture_output=True, timeout=10)

    def calls(self):
        log = self.path / 'commands'
        return [json.loads(line) for line in log.read_text().splitlines()] if log.exists() else []

    def test_both_phases_preserve_original_manifest_contents_and_names(self):
        for phase, files, tag in [('bridge', ['studio-deployment.yaml'], '12345-2-bridge'),
                                  ('final', MANIFESTS, '12345-2')]:
            with self.subTest(phase=phase):
                (self.path / 'commands').unlink(missing_ok=True)
                result = self.run_script('run.sh', phase)
                self.assertEqual(result.returncode, 0, result.stderr)
                actual = json.loads((self.path / 'capture').read_text())
                injector = ROOT / 'deploy/production/studio-html-injector.mjs'
                proxy = ROOT / 'deploy/production/studio-proxy.yaml'
                expected = {f: (ROOT / 'deploy/production' / f).read_text().replace('${TAG}', tag)
                            .replace('${INJECTOR_SHA}', hashlib.sha256(injector.read_bytes()).hexdigest())
                            .replace('${PROXY_CONFIG_SHA}', hashlib.sha256(proxy.read_bytes()).hexdigest()) for f in files}
                if phase == 'final':
                    configmap = json.loads(actual.pop('studio-html-injector.yaml'))
                    self.assertEqual(configmap, {'apiVersion': 'v1', 'kind': 'ConfigMap',
                        'metadata': {'name': 'studio-html-injector', 'namespace': 'acedatacloud'},
                        'data': {'server.mjs': injector.read_text()}})
                self.assertEqual(actual, expected)
                self.assertEqual(len(self.calls()), 1)
                self.assertEqual(self.calls()[0][:4], ['--context', 'test-cluster', 'apply', '-f'])

    def test_apply_failure_propagates_without_recovery_commands(self):
        self.env['APPLY_STATUS'] = '37'
        result = self.run_script('run.sh', 'final')
        self.assertEqual(result.returncode, 37)
        self.assertEqual(len(self.calls()), 1)

    def test_checksum_failure_never_reaches_cluster(self):
        self.fake('openssl', '#!/bin/sh\nexit 42\n')
        result = self.run_script('run.sh', 'final')
        self.assertEqual(result.returncode, 42)
        self.assertEqual(self.calls(), [])

    def test_all_rendering_finishes_before_any_apply(self):
        (self.path / 'deploy/production/studio-ingress.yaml').unlink()
        result = self.run_script('run.sh', 'final')
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.calls(), [])

    def test_missing_phase_and_unsafe_inputs_never_reach_cluster(self):
        for args, key, value in [((), None, None), (('final',), 'KUBE_CONTEXT', ''),
                                 (('final',), 'RELEASE_TAG', 'latest'),
                                 (('bridge',), 'RELEASE_TAG', 'x' * 122),
                                 (('final',), 'RELEASE_TAG', 'bad/tag')]:
            with self.subTest(args=args, key=key, value=value):
                original = self.env.copy()
                if key:
                    self.env[key] = value
                self.assertNotEqual(self.run_script('run.sh', *args).returncode, 0)
                self.assertEqual(self.calls(), [])
                self.env = original

    def test_snapshot_rejects_tag_or_digest_drift_before_exporting(self):
        repository = self.env['IMAGE_REPOSITORY']
        for digest, tag, succeeds in [('@sha256:abc', ':12345-2', True),
                                      ('@sha256:other', ':12345-2', False),
                                      ('@sha256:abc', ':old-release', False)]:
            with self.subTest(digest=digest, tag=tag):
                exported = self.path / 'exported'
                exported.unlink(missing_ok=True)
                self.env.update(EXPECTED_IMAGE=repository + digest,
                                EXPECTED_TAGGED_IMAGE=repository + tag,
                                GITHUB_ENV=str(exported))
                result = self.run_script('preflight-release.sh')
                self.assertEqual(result.returncode == 0, succeeds, result.stderr)
                self.assertEqual(exported.exists(), succeeds)
        for key in ('EXPECTED_IMAGE', 'EXPECTED_TAGGED_IMAGE', 'GITHUB_ENV'):
            self.env.pop(key)

    def bridge_preflight(self, image):
        (self.path / 'deploy/preflight-release.sh').write_text(
            f'#!/bin/sh\n[ "$EXPECTED_TAGGED_IMAGE" = "{image}" ]\n'
        )
        # Two date calls: initialize deadline, then expire after the first failed observation.
        self.fake('date', '#!/bin/sh\nif [ -f "$CLOCK_MARK" ]; then echo 1000; else touch "$CLOCK_MARK"; echo 0; fi\n')
        self.env['CLOCK_MARK'] = str(self.path / 'clock')

    def test_bridge_requires_matching_endpoints_and_old_pod_exit(self):
        expected = 'ghcr.io/acedatacloud/studio-frontend:12345-2-bridge'
        for image, old, succeeds in [(expected, 'false', True), ('old-image', 'false', False),
                                      (expected, 'true', False)]:
            with self.subTest(image=image, old=old):
                self.bridge_preflight(image)
                (self.path / 'clock').unlink(missing_ok=True)
                (self.path / 'commands').unlink(missing_ok=True)
                self.env['OLD_POD'] = old
                result = self.run_script('wait-bridge.sh')
                self.assertEqual(result.returncode == 0, succeeds, result.stderr)
                self.assertFalse(any(call[2] in ('apply', 'delete', 'patch', 'set') for call in self.calls()))

    def test_workflow_places_one_barrier_between_bridge_and_final(self):
        workflow = (ROOT / '.github/workflows/deploy-web.yaml').read_text()
        self.assertLess(workflow.index('sh deploy/run.sh bridge'), workflow.index('bash deploy/wait-bridge.sh'))
        self.assertLess(workflow.index('bash deploy/wait-bridge.sh'), workflow.index('sh deploy/run.sh final'))
        self.assertTrue(workflow.rstrip().endswith('run: sh deploy/run.sh final'))
        self.assertNotIn('verify-cutover.sh', workflow)


if __name__ == '__main__':
    unittest.main()
