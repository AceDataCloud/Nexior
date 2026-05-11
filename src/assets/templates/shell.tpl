curl -X {{{method}}} '{{{url}}}' \
{{#headers}}
-H '{{{key}}}: {{{value}}}' \
{{/headers}}
-d '{
  {{#body}}
  "{{{key}}}": {{{value}}}{{^last}},{{/last}}
  {{/body}}
}'
