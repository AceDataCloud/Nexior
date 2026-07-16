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

Env vars:
  ACEDATACLOUD_OPENAI_KEY   (preferred) or VITE_OPENAI_API_KEY
  TRANSLATE_API_URL         override the gateway
                            (default: api.acedata.cloud)
  TRANSLATE_MODEL           override the model (default: gpt-4o-mini)

CLI:
  python3 scripts/translate_i18n.py            # all locales
  python3 scripts/translate_i18n.py en de fr   # subset
    python3 scripts/translate_i18n.py --repair-english-placeholders ar
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

API_URL = os.environ.get(
    "TRANSLATE_API_URL", "https://api.acedata.cloud/openai/chat/completions"
)
MODEL = os.environ.get("TRANSLATE_MODEL", "gpt-4o-mini")
BATCH_SIZE = 25
HTTP_TIMEOUT = 120
MAX_RETRIES = 4
RETRY_BASE_SLEEP = 2.0
REPAIR_ENGLISH_PLACEHOLDERS_FLAG = "--repair-english-placeholders"
INTENTIONAL_ENGLISH_MESSAGES = {
    "common.json": {"settings.contactType_wechat"},
    "site.json": {"placeholder.authSmsWebhookUrl"},
}
ARABIC_CHARACTER_RE = re.compile(r"[\u0600-\u06ff]")
HAN_CHARACTER_RE = re.compile(r"[\u3400-\u9fff]")
LATIN_WORD_RE = re.compile(r"[A-Za-z]{3,}")
PRESERVED_TOKEN_RE = re.compile(
    r"\{\{[^{}]+\}\}|\{[^{}]+\}|%[A-Za-z]|\[\[[^\[\]]+\]\]|</?[A-Za-z][^>]*>"
)


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


def collect_preserved_tokens(message: str) -> list[str]:
    """Return interpolation variables and tags that translations must preserve."""
    return sorted(PRESERVED_TOKEN_RE.findall(message))


def collect_english_placeholder_keys(
    zh_data: Any,
    english_data: Any,
    target_data: Any,
    ignored_keys: set[str] | None = None,
) -> set[str]:
    """Return target messages copied from English despite a localized base source."""
    if not all(isinstance(data, dict) for data in (zh_data, english_data, target_data)):
        return set()

    ignored_keys = ignored_keys or set()
    placeholders: set[str] = set()
    for key in collect_keys_with_message(zh_data):
        if key in ignored_keys:
            continue
        zh_message = zh_data[key]["message"].strip()
        english_entry = english_data.get(key)
        target_entry = target_data.get(key)
        if not isinstance(english_entry, dict) or not isinstance(target_entry, dict):
            continue
        english_message = english_entry.get("message")
        target_message = target_entry.get("message")
        if not isinstance(english_message, str) or not isinstance(target_message, str):
            continue
        english_message = english_message.strip()
        target_message = target_message.strip()
        if english_message and target_message == english_message != zh_message:
            placeholders.add(key)
    return placeholders


def collect_arabic_nonlocalized_keys(
    zh_data: Any, target_data: Any, ignored_keys: set[str] | None = None
) -> set[str]:
    """Return Arabic entries that remain Latin-only despite a Chinese source."""
    if not isinstance(zh_data, dict) or not isinstance(target_data, dict):
        return set()

    ignored_keys = ignored_keys or set()
    nonlocalized: set[str] = set()
    for key in collect_keys_with_message(zh_data):
        if key in ignored_keys:
            continue
        zh_message = zh_data[key]["message"]
        target_entry = target_data.get(key)
        if not isinstance(target_entry, dict):
            continue
        target_message = target_entry.get("message")
        if not isinstance(target_message, str):
            continue
        if (
            HAN_CHARACTER_RE.search(zh_message)
            and (
                HAN_CHARACTER_RE.search(target_message)
                or (
                    LATIN_WORD_RE.search(target_message)
                    and not ARABIC_CHARACTER_RE.search(target_message)
                )
            )
        ):
            nonlocalized.add(key)
    return nonlocalized


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
        source_tokens = collect_preserved_tokens(payload_in[key]["message"])
        translated_tokens = collect_preserved_tokens(message)
        if translated_tokens != source_tokens:
            raise RuntimeError(
                f"model changed preserved tokens for {key!r}: "
                f"expected {source_tokens}, got {translated_tokens}"
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
    """Translate `keys` for `locale`, halving the batch on failure."""
    try:
        return translate_batch(api_key, zh_data, keys, locale)
    except Exception as e:
        if len(keys) <= 1:
            raise
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


def process_locale(api_key: str, locale: str, repair_english_placeholders: bool) -> int:
    """Returns the number of keys still missing after the run (should be 0)."""
    base_dir = I18N_ROOT / BASE_LOCALE
    target_dir = I18N_ROOT / locale
    target_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n=== {locale} ({LANGUAGE_NAMES[locale]}) ===", flush=True)
    locale_missing = 0

    for zh_file in sorted(base_dir.glob("*.json")):
        namespace = zh_file.name
        target_file = target_dir / namespace
        english_file = I18N_ROOT / "en" / namespace
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
        repair = []
        if repair_english_placeholders and locale != "en" and english_file.exists():
            english_data = json.loads(english_file.read_text(encoding="utf-8"))
            repair_keys = collect_english_placeholder_keys(
                zh_data,
                english_data,
                target_data,
                INTENTIONAL_ENGLISH_MESSAGES.get(namespace, set()),
            )
            if locale == "ar":
                repair_keys |= collect_arabic_nonlocalized_keys(
                    zh_data,
                    target_data,
                    INTENTIONAL_ENGLISH_MESSAGES.get(namespace, set()),
                )
            repair = sorted(repair_keys)
        keys_to_translate = sorted(set(missing) | set(repair))
        if not keys_to_translate:
            print(f"  {namespace:24s}  OK")
            continue

        print(
            f"  {namespace:24s}  filling {len(missing)} missing, "
            f"repairing {len(repair)} English placeholder(s)...",
            flush=True,
        )

        translated: dict[str, dict[str, str]] = {}
        for i in range(0, len(keys_to_translate), BATCH_SIZE):
            chunk = keys_to_translate[i : i + BATCH_SIZE]
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

        if repair_english_placeholders and locale != "en" and english_file.exists():
            english_data = json.loads(english_file.read_text(encoding="utf-8"))
            remaining_repairs = collect_english_placeholder_keys(
                zh_data,
                english_data,
                ordered,
                INTENTIONAL_ENGLISH_MESSAGES.get(namespace, set()),
            )
            if locale == "ar":
                remaining_repairs |= collect_arabic_nonlocalized_keys(
                    zh_data,
                    ordered,
                    INTENTIONAL_ENGLISH_MESSAGES.get(namespace, set()),
                )
            if remaining_repairs:
                print(
                    f"    ::error file=src/i18n/{locale}/{namespace}::"
                    f"still contains {len(remaining_repairs)} nonlocalized key(s): "
                    f"{sorted(remaining_repairs)[:5]}",
                    flush=True,
                )
                locale_missing += len(remaining_repairs)

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

    repair_english_placeholders = REPAIR_ENGLISH_PLACEHOLDERS_FLAG in sys.argv[1:]
    requested = [
        arg for arg in sys.argv[1:] if arg != REPAIR_ENGLISH_PLACEHOLDERS_FLAG
    ]
    if requested:
        unknown = [loc for loc in requested if loc not in TARGET_LOCALES]
        if unknown:
            print(f"::error::unknown locale(s): {unknown}", file=sys.stderr)
            return 2
        locales = requested
    else:
        locales = list(TARGET_LOCALES)

    total_missing = 0
    for locale in locales:
        total_missing += process_locale(api_key, locale, repair_english_placeholders)

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
