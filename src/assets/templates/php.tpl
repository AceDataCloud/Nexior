<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('{{{method}}}', '{{{url}}}', [
  'body' => '{
{{#body}}
    "{{{key}}}": {{{value}}}{{^last}},{{/last}}
{{/body}}
  }',
  'headers' => [
{{#headers}}
    '{{{key}}}': {{{value}}}{{^last}},{{/last}}
{{/headers}}
  ],
]);

echo $response->getBody();