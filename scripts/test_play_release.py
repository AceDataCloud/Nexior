from contextlib import contextmanager
from pathlib import Path
import unittest

from scripts.play_release import PREFIX, PlayClient, decide, run


def release(state="PUBLISHED", code=67301, track="production"):
    return {"track": track, "releaseLifecycleState": PREFIX + state,
            "activeArtifacts": [{"versionCode": code}]}


class FakePlay:
    def __init__(self, rows=None, codes=None, later=None):
        self.rows = rows if rows is not None else [release(code=66800)]
        self.codes = codes if codes is not None else {66800}
        self.later = later
        self.reads = 0
        self.writes = []
        self.uploads = []
        self.cleaned = False

    @contextmanager
    def edit(self):
        try:
            yield "edit-1"
        finally:
            self.cleaned = True

    def releases(self, edit_id, track):
        self.reads += 1
        return self.later if self.reads > 1 and self.later is not None else self.rows

    def uploaded_codes(self, edit_id):
        return self.codes

    def upload(self, edit_id, artifact):
        self.uploads.append(artifact)
        return 67301

    def request(self, method, path, **kwargs):
        self.writes.append((method, path, kwargs))
        return {}


class DecisionTests(unittest.TestCase):
    def test_any_track_in_review_blocks_even_a_newer_version(self):
        for track in ("production", "beta", "alpha", "internal", "custom-testing"):
            with self.subTest(track=track):
                decision = decide([release("IN_REVIEW", track=track)], {67301}, 67400, "production", True)
                self.assertFalse(decision.submit)
                self.assertFalse(decision.build)
                self.assertIn("IN_REVIEW", decision.reason)

    def test_published_allows_new_version(self):
        d = decide([release()], {67301}, 67400, "production", True)
        self.assertTrue(d.submit)
        self.assertTrue(d.build)

    def test_same_or_older_published_version_is_not_resubmitted(self):
        for code in (67301, 67200):
            self.assertFalse(decide([release()], {67301}, code, "production", True).submit)

    def test_uploaded_beta_can_be_promoted_after_review_finishes_without_rebuild(self):
        d = decide([release(code=66800), release(track="beta")], {66800, 67301}, 67301, "production", True)
        self.assertTrue(d.submit)
        self.assertFalse(d.build)

    def test_approved_target_is_not_resubmitted(self):
        self.assertFalse(decide([release("APPROVED_NOT_PUBLISHED")], {67301}, 67301, "production", True).submit)

    def test_staged_edit_can_be_sent_without_reupload(self):
        d = decide([release("NOT_SENT_FOR_REVIEW", track="beta")], {67301}, 67301, "beta", False)
        self.assertTrue(d.submit)
        self.assertFalse(d.build)

    def test_rejection_requires_a_new_version(self):
        self.assertFalse(decide([release("NOT_APPROVED")], {67301}, 67301, "production", True).submit)
        self.assertTrue(decide([release("NOT_APPROVED")], {67301}, 67400, "production", True).submit)

    def test_unknown_or_missing_lifecycle_fails_closed(self):
        for state in ("FUTURE_STATE", "RELEASE_LIFECYCLE_STATE_UNSPECIFIED", None):
            with self.assertRaises(ValueError):
                decide([dict(release(), releaseLifecycleState=state)], set(), 67400, "beta", True)

    def test_in_review_with_no_artifacts_still_blocks(self):
        self.assertFalse(decide([dict(release("IN_REVIEW"), activeArtifacts=[])], set(), 67400, "beta", True).submit)

    def test_policy_hold_still_blocks_production(self):
        self.assertFalse(decide([release()], {67301}, 67400, "production", False).submit)
        self.assertTrue(decide([release()], {67301}, 67400, "beta", False).submit)


class SubmissionTests(unittest.TestCase):
    def execute(self, client, **kwargs):
        args = dict(target=67301, version="3.373.1", track="beta", promote=True,
                    rollout=1.0, policy_cleared=True, publish=True, artifact=Path("package.aab"))
        args.update(kwargs)
        return run(client, **args)

    def test_in_review_never_uploads_changes_tracks_or_commits(self):
        client = FakePlay([release("IN_REVIEW", code=66800)])
        self.assertFalse(self.execute(client)["submitted"])
        self.assertEqual(client.uploads, [])
        self.assertEqual(client.writes, [])
        self.assertTrue(client.cleaned)

    def test_check_mode_is_read_only(self):
        client = FakePlay()
        result = self.execute(client, publish=False)
        self.assertTrue(result["should-build"])
        self.assertTrue(result["should-submit"])
        self.assertEqual(client.writes, [])
        self.assertEqual(client.uploads, [])

    def test_beta_and_production_are_one_commit_at_full_rollout(self):
        client = FakePlay()
        self.assertTrue(self.execute(client)["submitted"])
        self.assertEqual([w[0] for w in client.writes], ["PUT", "PUT", "POST"])
        self.assertEqual([w[2]["json"]["track"] for w in client.writes[:2]], ["beta", "production"])
        for write in client.writes[:2]:
            self.assertEqual(write[2]["json"]["releases"][0],
                             {"name": "3.373.1", "versionCodes": ["67301"], "status": "completed"})
        self.assertEqual(client.writes[-1][2]["params"], {})

    def test_review_started_during_upload_aborts_without_commit(self):
        client = FakePlay(later=[release("IN_REVIEW", code=67400, track="alpha")])
        self.assertFalse(self.execute(client)["submitted"])
        self.assertFalse(any(w[0] == "POST" for w in client.writes))
        self.assertTrue(client.cleaned)

    def test_api_failure_never_commits(self):
        client = FakePlay()
        client.releases = lambda *_: (_ for _ in ()).throw(RuntimeError("HTTP 403"))
        with self.assertRaises(RuntimeError):
            self.execute(client)
        self.assertEqual(client.writes, [])
        self.assertTrue(client.cleaned)

    def test_wrong_artifact_cannot_change_tracks(self):
        client = FakePlay()
        client.upload = lambda *_: 99999
        with self.assertRaises(ValueError):
            self.execute(client)
        self.assertEqual(client.writes, [])

    def test_reuses_existing_bundle(self):
        client = FakePlay(codes={66800, 67301})
        self.assertTrue(self.execute(client)["submitted"])
        self.assertEqual(client.uploads, [])

    def test_optional_policy_staging_is_not_reported_as_submitted(self):
        client = FakePlay()
        self.assertFalse(self.execute(client, stage=True)["submitted"])
        self.assertEqual(client.writes[-1][2]["params"], {"changesNotSentForReview": "true"})

    def test_staged_rollout_keeps_beta_full_and_production_fraction(self):
        client = FakePlay()
        self.execute(client, rollout=0.1)
        self.assertEqual(client.writes[0][2]["json"]["releases"][0]["status"], "completed")
        self.assertEqual(client.writes[1][2]["json"]["releases"][0]["userFraction"], 0.1)

    def test_direct_production_has_one_track_update(self):
        client = FakePlay()
        self.execute(client, track="production", promote=False)
        self.assertEqual([w[0] for w in client.writes], ["PUT", "POST"])

    def test_invalid_rollout_rejected_before_any_request(self):
        for rollout in (0, -0.1, 1.1, float("nan"), float("inf")):
            client = FakePlay()
            with self.assertRaises(ValueError):
                self.execute(client, rollout=rollout)
            self.assertEqual(client.reads, 0)


class LifecycleTransportTests(unittest.TestCase):
    def test_discovers_custom_tracks_and_uses_non_edit_lifecycle_endpoint(self):
        client = PlayClient(None, "com.acedatacloud.nexior")
        paths = []
        def request(method, path, **kwargs):
            paths.append(path)
            if path == "/edits/e/tracks":
                return {"tracks": [{"track": "production"}, {"track": "custom/test"}]}
            if path == "/tracks/custom%2Ftest/releases":
                return {"releases": [release("IN_REVIEW", track="custom/test")]}
            return {}
        client.request = request
        rows = client.releases("e", "beta")
        self.assertIn("/tracks/custom%2Ftest/releases", paths)
        self.assertFalse(decide(rows, set(), 67400, "production", True).submit)

    def test_missing_track_list_fails_closed(self):
        client = PlayClient(None, "app")
        client.request = lambda *_: {}
        with self.assertRaises(ValueError):
            client.releases("e", "beta")


if __name__ == "__main__":
    unittest.main()
