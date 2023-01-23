const options = {
  method: '{{{method}}}',
  headers: {
{{#headers}}
    '{{{key}}}': '{{{value}}}'{{^last}},{{/last}}
{{/headers}}
  },
  body: JSON.stringify({
{{#body}}
    {{{key}}}: '{{{value}}}'{{^last}},{{/last}}
{{/body}}
  })
};

fetch('{{{url}}}', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));