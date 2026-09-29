#!/usr/bin/env python3
from html.parser import HTMLParser
import sys
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

class Assets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = set()
    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        value = values.get("src") if tag == "script" else values.get("href") if tag == "link" and values.get("rel") == "stylesheet" else None
        if value and urlparse(value).path.startswith("/assets/"):
            self.paths.add(value)

base = sys.argv[1]
request = Request(base, headers={"Cache-Control": "no-cache", "User-Agent": "release-cutover-verifier"})
with urlopen(request, timeout=30) as response:
    html = response.read().decode("utf-8")
    if response.status != 200:
        raise SystemExit(f"HTML returned {response.status}")
    cache = response.headers.get("Cache-Control", "")
    if "no-store" not in cache and "no-cache" not in cache:
        raise SystemExit(f"HTML is cacheable: {cache}")
parser = Assets()
parser.feed(html)
if not parser.paths:
    raise SystemExit("HTML contains no hashed entry assets")
for path in sorted(parser.paths):
    with urlopen(Request(urljoin(base, path), headers={"User-Agent": "release-cutover-verifier"}), timeout=30) as response:
        content_type = response.headers.get("Content-Type", "")
        if response.status != 200 or ("javascript" not in content_type and "css" not in content_type):
            raise SystemExit(f"bad asset {path}: {response.status} {content_type}")
print(f"verified {len(parser.paths)} entry assets from {base}")
