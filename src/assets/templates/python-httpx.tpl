import httpx

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

with httpx.Client(timeout=60.0) as client:
    response = client.{{{method}}}(url, json=payload, headers=headers)
    print(response.text)
