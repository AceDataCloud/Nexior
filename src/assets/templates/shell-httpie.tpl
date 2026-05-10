http {{{method}}} '{{{url}}}' \
{{#headers}}
  '{{{key}}}:{{{value}}}' \
{{/headers}}
  --raw='{
  {{#body}}
  "{{{key}}}": {{{value}}}{{^last}},{{/last}}
  {{/body}}
  }'
