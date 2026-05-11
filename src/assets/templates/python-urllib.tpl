import json
import urllib.request

url = "{{{url}}}"

headers = {
{{#headers}}
    "{{{key}}}": {{{value}}}{{^last}},{{/last}}
{{/headers}}
}

payload = {
{{#body}}
    "{{{key}}}": {{{value}}}{{^last}},{{/last}}
{{/body}}
}

data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(url, data=data, headers=headers, method="{{{methodUpper}}}")
with urllib.request.urlopen(req) as response:
    print(response.read().decode("utf-8"))
