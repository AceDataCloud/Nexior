import requests

url = "{{{url}}}"

headers = {
{{#headers}}
    '{{{key}}}': '{{{value}}}'{{^last}},{{/last}}
{{/headers}}
}

payload = {
{{#body}}
    '{{{key}}}': '{{{value}}}'{{^last}},{{/last}}
{{/body}}
}

response = requests.{{{method}}}}(url, json=payload, headers=headers)
print(response.text)