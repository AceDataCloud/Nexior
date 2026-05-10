import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

String body = """
{
{{#body}}
  "{{{key}}}": {{{value}}}{{^last}},{{/last}}
{{/body}}
}
""";

HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("{{{url}}}"))
{{#headers}}
    .header("{{{key}}}", {{{value}}})
{{/headers}}
    .method("{{{methodUpper}}}", HttpRequest.BodyPublishers.ofString(body))
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());
