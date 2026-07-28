#!/usr/bin/env python3
"""Block PR merges when any non-base locale lacks any zh-CN key.

Background:

  Nexior (and PlatformFrontend) used `@transmart/cli` with a
  content-hashed sentinel cache. When `gpt-4o-mini` under JSON-mode
  occasionally drops keys from a chunk response, transmart writes the
  partial output AND a sentinel file. Subsequent runs see both and skip.
  Result: silent regressions like the one PlatformFrontend PR #287 had
  to backfill.

  This script is the regression guard. It is intentionally simple:

    For each (locale, namespace), flatten the JSON and assert
        set(target_keys) ⊇ set(zh_keys)

  Nexior i18n entries are shaped `{key: {message, description}}` where
  `key` is a literal dotted name (NOT nested). Both `message` and
  `description` are translated into the target locale. We enforce:

    - every top-level zh-CN key exists in the target file
    - each target value is an object with a non-empty `message` string
    - no key is left holding the untranslated English seed that
      `i18n_backfill.py` writes to satisfy the key check above

  `description` is treated as advisory — a missing description does NOT
  fail the check (it's a translator hint, not user-facing copy).

Exit codes:
  0 — all locales fully cover zh-CN
    1 — at least one locale fails validation (`::error file=…::` lines emitted)
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
I18N_ROOT = REPO_ROOT / "src" / "i18n"
BASE_LOCALE = "zh-CN"
ENGLISH_LOCALE = "en"
ALLOW_ENGLISH_FILE = I18N_ROOT / ".allow-english"
REQUIRE_LOCALIZED_MESSAGES = {
    "maestro.json": {
        "name.customize",
        "name.customizeScenario",
        "name.customizeStyle",
        "name.customizeVoice",
        "description.customize.auto",
        "description.customize.manual",
    }
}


def collect_keys(data: Any) -> set[str]:
    """Return the set of top-level keys whose value carries a `message`."""
    if not isinstance(data, dict):
        return set()
    keys: set[str] = set()
    for k, v in data.items():
        message = v.get("message") if isinstance(v, dict) else None
        if isinstance(message, str) and message.strip():
            keys.add(k)
    return keys


def get_message(data: Any, key: str) -> str | None:
    """Return a non-empty message string from a locale entry."""
    if not isinstance(data, dict):
        return None
    entry = data.get(key)
    if not isinstance(entry, dict):
        return None
    message = entry.get("message")
    if not isinstance(message, str) or not message.strip():
        return None
    return message.strip()


def load_allowed_english() -> set[str]:
    """Entries allowed to keep the English string.

    Two forms, one per line (`#` comments allowed):
      `<namespace>:<key>`         — every locale
      `<namespace>:<key>@<locale>` — that locale only

    Covers brand names ("WeChat") and cognates whose correct translation *is*
    the English word (German "Status", French "Description").
    """
    if not ALLOW_ENGLISH_FILE.exists():
        return set()
    allowed: set[str] = set()
    for raw in ALLOW_ENGLISH_FILE.read_text(encoding="utf-8").splitlines():
        line = raw.split("#", 1)[0].strip()
        if line:
            allowed.add(line)
    return allowed


def scoped_allow(entries: set[str], namespace: str, locale: str) -> set[str]:
    """Keys from `entries` that apply to this (namespace, locale) pair."""
    keys: set[str] = set()
    for entry in entries:
        if not entry.startswith(f"{namespace}:"):
            continue
        key = entry.split(":", 1)[1]
        key, sep, want_locale = key.partition("@")
        if not sep or want_locale == locale:
            keys.add(key)
    return keys


def find_stale(
    zh_data: Any,
    en_data: Any,
    target_data: Any,
    keys: set[str],
    allowed: set[str] = frozenset(),
) -> list[str]:
    """Keys whose target message is still the untranslated English seed.

    `i18n_backfill.py` seeds new keys with the English entry so the key check
    above passes; `translate_i18n.py` then skips them because the key is no
    longer missing, so they ship as English in every locale. Comparing against
    zh-CN too keeps brand nouns ("API Key", "Stripe") — identical across
    locales by design — from being flagged.
    """
    stale: list[str] = []
    for key in keys:
        if key in allowed:
            continue
        zh_message = get_message(zh_data, key)
        en_message = get_message(en_data, key)
        target_message = get_message(target_data, key)
        if zh_message is None or en_message is None or target_message is None:
            continue
        if target_message == en_message and zh_message != en_message:
            stale.append(key)
    return sorted(stale)


def main() -> int:
    base_dir = I18N_ROOT / BASE_LOCALE
    if not base_dir.is_dir():
        print(f"::error::base locale dir missing: {base_dir}", file=sys.stderr)
        return 1

    locales = sorted(
        p.name
        for p in I18N_ROOT.iterdir()
        if p.is_dir() and p.name not in {BASE_LOCALE, ".cache"}
    )
    if not locales:
        print("::error::no target locales found", file=sys.stderr)
        return 1

    namespaces = sorted(p.name for p in base_dir.glob("*.json"))
    failures = 0
    total_stale = 0
    allow_english = load_allowed_english()
    english_messages: dict[str, dict[str, str]] = {}

    for namespace, localized_keys in REQUIRE_LOCALIZED_MESSAGES.items():
        en_path = I18N_ROOT / ENGLISH_LOCALE / namespace
        if not en_path.exists():
            failures += 1
            rel = en_path.relative_to(REPO_ROOT)
            print(f"::error file={rel}::missing English source file")
            continue

        en_data = json.loads(en_path.read_text(encoding="utf-8"))
        invalid = sorted(key for key in localized_keys if get_message(en_data, key) is None)
        if invalid:
            failures += 1
            rel = en_path.relative_to(REPO_ROOT)
            preview = ", ".join(invalid)
            print(f"::error file={rel}::missing valid English message for: {preview}")
            continue

        english_messages[namespace] = {
            key: message
            for key in localized_keys
            if (message := get_message(en_data, key)) is not None
        }

    for locale in locales:
        for namespace in namespaces:
            zh_path = base_dir / namespace
            target_path = I18N_ROOT / locale / namespace
            zh_data = json.loads(zh_path.read_text(encoding="utf-8"))
            zh_keys = collect_keys(zh_data)

            if not target_path.exists():
                failures += 1
                rel = target_path.relative_to(REPO_ROOT)
                print(
                    f"::error file={rel}::missing locale file ({len(zh_keys)} key(s) expected)"
                )
                continue

            target_data = json.loads(target_path.read_text(encoding="utf-8"))
            target_keys = collect_keys(target_data)
            missing = sorted(zh_keys - target_keys)
            if missing:
                failures += 1
                rel = target_path.relative_to(REPO_ROOT)
                preview = ", ".join(missing[:5]) + (
                    f"  …(+{len(missing) - 5} more)" if len(missing) > 5 else ""
                )
                print(
                    f"::error file={rel}::missing {len(missing)} key(s) vs zh-CN: {preview}"
                )

            localized_keys = REQUIRE_LOCALIZED_MESSAGES.get(namespace, set())
            reference_messages = english_messages.get(namespace)
            if locale != ENGLISH_LOCALE and localized_keys and reference_messages:
                untranslated = sorted(
                    key
                    for key in localized_keys
                    if get_message(target_data, key) == reference_messages[key]
                )
                if untranslated:
                    failures += 1
                    rel = target_path.relative_to(REPO_ROOT)
                    preview = ", ".join(untranslated)
                    print(
                        f"::error file={rel}::English placeholder remains for: {preview}"
                    )

            if locale != ENGLISH_LOCALE:
                en_path = I18N_ROOT / ENGLISH_LOCALE / namespace
                en_data = (
                    json.loads(en_path.read_text(encoding="utf-8"))
                    if en_path.exists()
                    else {}
                )
                allowed_here = scoped_allow(allow_english, namespace, locale)
                stale = find_stale(
                    zh_data, en_data, target_data, zh_keys, allowed_here
                )
                if stale:
                    failures += 1
                    total_stale += len(stale)
                    rel = target_path.relative_to(REPO_ROOT)
                    preview = ", ".join(stale[:5]) + (
                        f"  …(+{len(stale) - 5} more)" if len(stale) > 5 else ""
                    )
                    print(
                        f"::error file={rel}::{len(stale)} untranslated English "
                        f"placeholder(s): {preview}"
                    )

    if failures:
        hint = ""
        if total_stale:
            hint = (
                f" ({total_stale} untranslated English placeholder(s) — run "
                f"`python3 scripts/translate_i18n.py --repair`)"
            )
        print(
            f"\n::error::{failures} locale/namespace pair(s) failed i18n "
            f"validation{hint}",
            file=sys.stderr,
        )
        return 1

    print(
        f"i18n validation OK: {len(locales)} locale(s) "
        f"× {len(namespaces)} namespace(s) cover zh-CN; "
        "required localized messages contain no English placeholders."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
