#!/usr/bin/env python3
import json
import sys
from html.parser import HTMLParser
from urllib.parse import quote, urljoin
from urllib.request import Request, urlopen


class Head(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self.description = ""
        self.icons = []
        self._in_title = False

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "title":
            self._in_title = True
        elif tag == "meta" and values.get("name") == "description":
            self.description = values.get("content", "")
        elif tag == "link" and values.get("rel") in {"icon", "apple-touch-icon"}:
            self.icons.append(values.get("href", ""))

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False

    def handle_data(self, data):
        if self._in_title:
            self.title += data


def fetch(url):
    request = Request(url, headers={"Cache-Control": "no-cache", "User-Agent": "release-site-head-verifier"})
    with urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8")


def main(origin):
    metadata = json.loads(fetch(f"https://platform.acedata.cloud/api/v1/site-head/{quote(origin, safe='')}"))
    parser = Head()
    parser.feed(fetch(f"https://{origin}/?release-verify=site-head"))
    if parser.title != metadata["title"]:
        raise SystemExit(f"title mismatch for {origin}: {parser.title!r} != {metadata['title']!r}")
    if parser.description != metadata["description"]:
        raise SystemExit(f"description mismatch for {origin}: {parser.description!r} != {metadata['description']!r}")
    expected_icon = metadata.get("favicon", "")
    if expected_icon and parser.icons != [expected_icon, expected_icon]:
        raise SystemExit(f"favicon mismatch for {origin}: {parser.icons!r} != {expected_icon!r}")
    for path in ("/favicon.ico", "/apple-touch-icon.png"):
        with urlopen(Request(urljoin(f"https://{origin}", path), method="GET"), timeout=30) as response:
            if response.status != 200 or not response.headers.get_content_type().startswith("image/"):
                raise SystemExit(f"bad icon response for {origin}{path}: {response.status} {response.headers.get_content_type()}")
    print(f"verified site head for {origin}")


if __name__ == "__main__":
    main(sys.argv[1])
