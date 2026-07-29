#!/usr/bin/env python3
"""Diff-and-fill i18n translator for Nexior.

Replaces `@transmart/cli` with a deterministic, fail-loud workflow.

Why not transmart:

- Transmart chunks each namespace JSON, asks gpt-4o-mini under JSON-mode
  to round-trip the whole chunk, and accepts whatever comes back.
- Under load, gpt-4o-mini sometimes drops keys from the response.
- Transmart writes the partial output AND a sentinel cache file at
  `src/i18n/.cache/<sha1(chunk)>`. Subsequent runs see both and log
  `cache file and output file exists, skip for namespace …`. The hole
  stays. Auto-approve + auto-merge ships the broken PR.

Algorithm:

  For each non-base locale, for each `src/i18n/zh-CN/<namespace>.json`:
    1. Load zh-CN as a flat `{key: {message, description}}` map.
    2. Load the existing target locale (or `{}`).
    3. Compute `missing = zh_keys - target_keys` (where a "valid" target
       entry is an object with a non-empty `message` string).
    4. Batch missing keys (≤ BATCH_SIZE) and POST to the AceDataCloud
       OpenAI gateway with `response_format: json_object`.
    5. Strictly validate every returned key is present and shaped
       `{message, description}`. On failure, retry the batch in halves
       before giving up.
    6. Merge translated entries into the existing target. Existing
       translations are NEVER overwritten — we only fill holes.

Idempotent: a green tree → zero writes, zero API calls.

`--repair` additionally retranslates entries whose `message` is still the
untranslated English seed left behind by `i18n_backfill.py`. Without it those
keys exist, so step 3's missing-key diff skips them and they stay English.

Env vars:
  ACEDATACLOUD_OPENAI_KEY   (preferred) or VITE_OPENAI_API_KEY
  TRANSLATE_API_URL         override the gateway
                            (default: api.acedata.cloud)
  TRANSLATE_MODEL           override the model (default: gpt-4o-mini)

CLI:
  python3 scripts/translate_i18n.py             # all locales, fill holes only
  python3 scripts/translate_i18n.py en de fr    # subset
  python3 scripts/translate_i18n.py --repair    # also fix English placeholders
  python3 scripts/translate_i18n.py ko --repair # one locale, with repair
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

BASE_LOCALE = "zh-CN"
TARGET_LOCALES = (
    "en",
    "de",
    "pt",
    "es",
    "fr",
    "zh-TW",
    "it",
    "ko",
    "ja",
    "ru",
    "pl",
    "fi",
    "sv",
    "el",
    "uk",
    "ar",
    "sr",
)
LANGUAGE_NAMES = {
    "en": "English",
    "de": "German (Deutsch)",
    "pt": "Portuguese (Português)",
    "es": "Spanish (Español)",
    "fr": "French (Français)",
    "zh-TW": "Traditional Chinese (繁體中文)",
    "it": "Italian (Italiano)",
    "ko": "Korean (한국어)",
    "ja": "Japanese (日本語)",
    "ru": "Russian (Русский)",
    "pl": "Polish (Polski)",
    "fi": "Finnish (Suomi)",
    "sv": "Swedish (Svenska)",
    "el": "Greek (Ελληνικά)",
    "uk": "Ukrainian (Українська)",
    "ar": "Arabic (العربية)",
    "sr": "Serbian (Српски)",
}
REPO_ROOT = Path(__file__).resolve().parent.parent
I18N_ROOT = REPO_ROOT / "src" / "i18n"
ALLOW_ENGLISH_FILE = I18N_ROOT / ".allow-english"

API_URL = os.environ.get(
    "TRANSLATE_API_URL", "https://api.acedata.cloud/openai/chat/completions"
)
MODEL = os.environ.get("TRANSLATE_MODEL", "gpt-4o-mini")
BATCH_SIZE = 25
HTTP_TIMEOUT = 120
MAX_RETRIES = 4
RETRY_BASE_SLEEP = 2.0


# ---------- helpers ----------


def collect_keys_with_message(data: Any) -> set[str]:
    """Top-level keys whose value is `{message: str, ...}` with non-empty message."""
    if not isinstance(data, dict):
        return set()
    keys: set[str] = set()
    for k, v in data.items():
        if isinstance(v, dict) and isinstance(v.get("message"), str) and v["message"]:
            keys.add(k)
    return keys


HAN_RE = re.compile(r"[一-鿿]")
# Locales that legitimately contain Han characters.
HAN_LOCALES = {"zh-CN", "zh-TW", "ja"}


def leaks_source_script(value: str, locale: str) -> bool:
    """True if a non-CJK translation still carries Chinese source characters.

    gpt-4o-mini occasionally half-translates ("任意 조건 충족"). Japanese keeps
    kanji so it is exempt; Korean is not.
    """
    return locale not in HAN_LOCALES and bool(HAN_RE.search(value))


def load_allowed_english() -> set[str]:
    """`<namespace>:<key>` pairs allowed to stay English (see the file header)."""
    if not ALLOW_ENGLISH_FILE.exists():
        return set()
    allowed: set[str] = set()
    for raw in ALLOW_ENGLISH_FILE.read_text(encoding="utf-8").splitlines():
        line = raw.split("#", 1)[0].strip()
        if line:
            allowed.add(line)
    return allowed


def find_stale_keys(
    zh_data: dict[str, Any],
    en_data: dict[str, Any],
    target_data: dict[str, Any],
    keys: list[str],
) -> list[str]:
    """Keys whose target `message` is still the untranslated English seed.

    `i18n_backfill.py` fills new keys with the English entry so the coverage
    guard passes. Those keys then exist, so the missing-key diff never sees
    them again and they stay English forever. A key is stale when the target
    message equals English *and* zh-CN differs from English — the zh-CN check
    is what keeps brand nouns ("API Key", "Stripe"), which are identical in
    every locale by design, from being flagged.
    """

    def message_of(data: dict[str, Any], key: str) -> str | None:
        entry = data.get(key)
        if isinstance(entry, dict) and isinstance(entry.get("message"), str):
            return entry["message"]
        return None

    stale: list[str] = []
    for key in keys:
        zh_message = message_of(zh_data, key)
        en_message = message_of(en_data, key)
        target_message = message_of(target_data, key)
        if zh_message is None or en_message is None or target_message is None:
            continue
        if (
            target_message.strip() == en_message.strip()
            and zh_message.strip() != en_message.strip()
        ):
            stale.append(key)
    return stale


# ---------- HTTP ----------


def chat_completion(api_key: str, messages: list[dict]) -> str:
    body = json.dumps(
        {
            "model": MODEL,
            "messages": messages,
            "response_format": {"type": "json_object"},
            "temperature": 0.3,
        }
    ).encode()
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    last_err: str | None = None
    for attempt in range(MAX_RETRIES):
        req = urllib.request.Request(API_URL, data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
                return payload["choices"][0]["message"]["content"]
        except urllib.error.HTTPError as e:
            last_err = f"HTTP {e.code}: {e.read()[:200].decode('utf-8', 'replace')}"
        except Exception as e:  # noqa: BLE001 — network-class
            last_err = repr(e)
        time.sleep(RETRY_BASE_SLEEP * (2**attempt))
    raise RuntimeError(f"chat completion failed after {MAX_RETRIES} retries: {last_err}")


# ---------- translation ----------


SYSTEM_PROMPT_TEMPLATE = (
    "You are translating short UI strings for a SaaS product website. "
    "Translate every entry to {language}. "
    "The keys are stable identifiers — KEEP THE KEYS UNCHANGED. "
    "Each entry is an object with a 'message' (the user-facing string) "
    "and a 'description' (Chinese explanation of what the message means "
    "and how it is used). Translate BOTH `message` and `description` to "
    "{language}. Use the `description` to disambiguate the meaning of the "
    "`message`. "
    "Do NOT add or remove any keys. "
    "Output strict JSON: an object whose keys are exactly the same as the "
    "input keys and whose values are objects with `message` and "
    "`description` string fields. "
    "Preserve placeholders like {{name}}, {{date}}, %s, HTML tags <a>, <b>, "
    "line breaks, and punctuation style. "
    "UI text should be concise and layout-friendly (especially button "
    "labels and form field labels). "
    "Do not wrap the output in markdown."
)


def translate_batch(
    api_key: str,
    zh_data: dict[str, Any],
    keys: list[str],
    locale: str,
) -> dict[str, dict[str, str]]:
    """Translate one batch and validate every requested key returned with a message."""
    payload_in: dict[str, dict[str, str]] = {}
    for key in keys:
        entry = zh_data[key]
        if not isinstance(entry, dict):
            raise RuntimeError(f"zh-CN key {key!r} is not an object")
        message = entry.get("message")
        if not isinstance(message, str):
            raise RuntimeError(f"zh-CN key {key!r} missing string `message`")
        description = entry.get("description")
        payload_in[key] = {
            "message": message,
            "description": description if isinstance(description, str) else "",
        }

    sys_prompt = SYSTEM_PROMPT_TEMPLATE.format(language=LANGUAGE_NAMES[locale])
    user_prompt = json.dumps(payload_in, ensure_ascii=False)

    raw = chat_completion(
        api_key,
        [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    try:
        out = json.loads(raw)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"invalid JSON from model: {e}\n{raw[:400]}") from e
    if not isinstance(out, dict):
        raise RuntimeError(f"model returned non-object JSON: {type(out).__name__}")

    result: dict[str, dict[str, str]] = {}
    for key in keys:
        v = out.get(key)
        if not isinstance(v, dict):
            raise RuntimeError(
                f"model dropped key {key!r} or returned non-object value "
                f"(got {type(v).__name__}). Returned keys: {sorted(out)[:20]}"
            )
        message = v.get("message")
        if not isinstance(message, str) or not message:
            raise RuntimeError(
                f"model returned key {key!r} without a non-empty `message`: {v!r}"
            )
        if leaks_source_script(message, locale):
            raise RuntimeError(
                f"model left untranslated Chinese in {key!r} for {locale}: {message!r}"
            )
        description = v.get("description")
        if not isinstance(description, str):
            description = payload_in[key]["description"]
        result[key] = {"message": message, "description": description}

    extra = set(out) - set(keys)
    if extra:
        print(
            f"    warning: model returned {len(extra)} unrequested keys "
            f"(ignored): {sorted(extra)[:5]}",
            flush=True,
        )
    return result


def translate_with_split(
    api_key: str,
    zh_data: dict[str, Any],
    keys: list[str],
    locale: str,
) -> dict[str, dict[str, str]]:
    """Translate `keys` for `locale`, halving the batch on failure.

    A single key that keeps failing (usually a brand string the model echoes
    back in Chinese) is dropped rather than aborting the whole run — the caller
    leaves the existing value in place and the coverage guard still reports it.
    """
    try:
        return translate_batch(api_key, zh_data, keys, locale)
    except Exception as e:
        if len(keys) <= 1:
            print(f"    skipping {keys[0]!r}: {e}", flush=True)
            return {}
        mid = len(keys) // 2
        print(
            f"    batch of {len(keys)} failed ({e}); splitting "
            f"into {mid}+{len(keys) - mid}",
            flush=True,
        )
        left = translate_with_split(api_key, zh_data, keys[:mid], locale)
        right = translate_with_split(api_key, zh_data, keys[mid:], locale)
        return {**left, **right}


# ---------- per-locale processing ----------


def process_locale(api_key: str, locale: str, repair: bool = False) -> int:
    """Returns the number of keys still missing after the run (should be 0)."""
    base_dir = I18N_ROOT / BASE_LOCALE
    target_dir = I18N_ROOT / locale
    target_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n=== {locale} ({LANGUAGE_NAMES[locale]}) ===", flush=True)
    locale_missing = 0

    for zh_file in sorted(base_dir.glob("*.json")):
        namespace = zh_file.name
        target_file = target_dir / namespace
        zh_data = json.loads(zh_file.read_text(encoding="utf-8"))
        if not isinstance(zh_data, dict):
            print(f"  {namespace:24s}  SKIP (zh-CN not an object)")
            continue
        zh_keys = sorted(collect_keys_with_message(zh_data))

        if target_file.exists():
            target_data = json.loads(target_file.read_text(encoding="utf-8"))
            if not isinstance(target_data, dict):
                target_data = {}
        else:
            target_data = {}
        target_keys = collect_keys_with_message(target_data)

        missing = [k for k in zh_keys if k not in target_keys]

        stale: list[str] = []
        if repair and locale != "en":
            en_file = I18N_ROOT / "en" / namespace
            en_data: dict[str, Any] = {}
            if en_file.exists():
                loaded = json.loads(en_file.read_text(encoding="utf-8"))
                if isinstance(loaded, dict):
                    en_data = loaded
            stale = find_stale_keys(zh_data, en_data, target_data, zh_keys)
            allowed = {
                entry.split(":", 1)[1]
                for entry in load_allowed_english()
                if entry.startswith(f"{namespace}:")
            }
            stale = [k for k in stale if k not in allowed]

        todo = missing + [k for k in stale if k not in set(missing)]
        if not todo:
            print(f"  {namespace:24s}  OK")
            continue

        detail = f"filling {len(missing)}"
        if stale:
            detail += f" + retranslating {len(stale)} stale"
        print(
            f"  {namespace:24s}  {detail} key(s)...",
            flush=True,
        )

        translated: dict[str, dict[str, str]] = {}
        for i in range(0, len(todo), BATCH_SIZE):
            chunk = todo[i : i + BATCH_SIZE]
            got = translate_with_split(api_key, zh_data, chunk, locale)
            translated.update(got)
            print(
                f"    [{i:>4d}-{i + len(chunk):>4d}]  got {len(got)}/{len(chunk)}",
                flush=True,
            )

        # Merge: existing translations win; only fill holes.
        merged: dict[str, dict[str, str]] = dict(target_data)
        for k, v in translated.items():
            merged[k] = v

        # Re-order keys to match zh-CN ordering for readable diffs;
        # any extra keys (e.g. legacy entries no longer in zh-CN) trail.
        zh_order = list(zh_data.keys())
        ordered: dict[str, Any] = {}
        for k in zh_order:
            if k in merged:
                ordered[k] = merged[k]
        for k in merged:
            if k not in ordered:
                ordered[k] = merged[k]

        target_file.write_text(
            json.dumps(ordered, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

        post_keys = collect_keys_with_message(ordered)
        still_missing = [k for k in zh_keys if k not in post_keys]
        if still_missing:
            print(
                f"    ::error file=src/i18n/{locale}/{namespace}::"
                f"still missing {len(still_missing)} key(s) after run: "
                f"{still_missing[:5]}",
                flush=True,
            )
            locale_missing += len(still_missing)

    return locale_missing


def main() -> int:
    api_key = os.environ.get("ACEDATACLOUD_OPENAI_KEY") or os.environ.get(
        "VITE_OPENAI_API_KEY"
    )
    if not api_key:
        print(
            "::error::set ACEDATACLOUD_OPENAI_KEY (or VITE_OPENAI_API_KEY) "
            "before running translate_i18n.py",
            file=sys.stderr,
        )
        return 1

    requested = [a for a in sys.argv[1:] if a != "--repair"]
    repair = "--repair" in sys.argv[1:]
    if requested:
        unknown = [loc for loc in requested if loc not in TARGET_LOCALES]
        if unknown:
            print(f"::error::unknown locale(s): {unknown}", file=sys.stderr)
            return 2
        locales = requested
    else:
        locales = list(TARGET_LOCALES)

    if repair:
        print(
            "repair mode: also retranslating values still equal to the "
            "English seed (see find_stale_keys)",
            flush=True,
        )

    total_missing = 0
    for locale in locales:
        total_missing += process_locale(api_key, locale, repair=repair)

    if total_missing:
        print(
            f"\n::error::{total_missing} key(s) still missing after translation",
            file=sys.stderr,
        )
        return 1

    print("\nAll locales fully covered.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
