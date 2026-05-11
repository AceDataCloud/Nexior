wget --quiet \
  --method={{{method}}} \
{{#headers}}
  --header='{{{key}}}: {{{value}}}' \
{{/headers}}
  --body-data='{
  {{#body}}
  "{{{key}}}": {{{value}}}{{^last}},{{/last}}
  {{/body}}
  }' \
  --output-document=- \
  '{{{url}}}'
