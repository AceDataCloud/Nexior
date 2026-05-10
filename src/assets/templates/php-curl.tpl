<?php
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => "{{{url}}}",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => "{{{methodUpper}}}",
    CURLOPT_POSTFIELDS => json_encode([
{{#body}}
        "{{{key}}}" => {{{value}}}{{^last}},{{/last}}
{{/body}}
    ]),
    CURLOPT_HTTPHEADER => [
{{#headers}}
        "{{{key}}}: " . {{{value}}}{{^last}},{{/last}}
{{/headers}}
    ],
]);

$response = curl_exec($curl);
curl_close($curl);
echo $response;
