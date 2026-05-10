const xhr = new XMLHttpRequest();
xhr.open("{{{methodUpper}}}", "{{{url}}}");
{{#headers}}
xhr.setRequestHeader("{{{key}}}", {{{value}}});
{{/headers}}

xhr.onload = () => {
  console.log(xhr.responseText);
};

xhr.send(JSON.stringify({
{{#body}}
  "{{{key}}}": {{{value}}}{{^last}},{{/last}}
{{/body}}
}));
