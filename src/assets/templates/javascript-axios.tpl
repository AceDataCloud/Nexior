import axios from "axios";

const { data } = await axios({
  method: "{{{method}}}",
  url: "{{{url}}}",
  headers: {
{{#headers}}
    "{{{key}}}": {{{value}}}{{^last}},{{/last}}
{{/headers}}
  },
  data: {
{{#body}}
    "{{{key}}}": {{{value}}}{{^last}},{{/last}}
{{/body}}
  }
});

console.log(data);
