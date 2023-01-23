JSONObject jsonObject = new JSONObject();
{{#body}}
jsonObject.put("{{{key}}}", "{{{value}}}");
{{/body}}
MediaType mediaType = "application/json; charset=utf-8".toMediaType();
RequestBody body = jsonObject.toString().toRequestBody(mediaType);
Request request = new Request.Builder()
  .url("{{{url}}}")
  .{{{method}}}(body)
{{#headers}}
  .addHeader("{{{key}}}", "{{{value}}}")
{{/headers}}
  .build();

OkHttpClient client = new OkHttpClient();
Response response = client.newCall(request).execute();
System.out.print(response.body!!.string())