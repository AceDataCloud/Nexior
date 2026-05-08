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

  `description` is treated as advisory — a missing description does NOT
  fail the check (it's a translator hint, not user-facing copy).

Exit codes:
  0 — all locales fully cover zh-CN
  1 — at least one locale is missing keys (`::error file=…::` lines emitted)
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
I18N_ROOT = REPO_ROOT / "src" / "i18n"
BASE_LOCALE = "zh-CN"


def collect_keys(data: Any) -> set[str]:
    """Return the set of top-level keys whose value carries a `message`."""
    if not isinstance(data, dict):
        return set()
    keys: set[str] = set()
    for k, v in data.items():
        if isinstance(v, dict) and isinstance(v.get("message"), str):
            keys.add(k)
    return keys


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

    if failures:
        print(
            f"\n::error::{failures} locale/namespace pair(s) are missing keys",
            file=sys.stderr,
        )
        return 1

    print(
        f"i18n key coverage OK: {len(locales)} locale(s) "
        f"× {len(namespaces)} namespace(s) all match zh-CN."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
