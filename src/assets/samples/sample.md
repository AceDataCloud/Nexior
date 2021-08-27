### 4.3 数学公式

> 支持平台：微信公众号、知乎。

行内`公式`使用方法，比如这个化学公式：$\\frac{n!}{k!(n-k)!} = \\binom{n}{k}$ `sdfdsf`

块公式使用方法如下：

$$H(D_2) = -\left(\frac{2}{4}\log_2 \frac{2}{4} + \frac{2}{4}\log_2 \frac{2}{4}\right) = 1$$

矩阵：

$$
  \begin{pmatrix}
  1 & a_1 & a_1^2 & \cdots & a_1^n \\
  1 & a_2 & a_2^2 & \cdots & a_2^n \\
  \vdots & \vdots & \vdots & \ddots & \vdots \\
  1 & a_m & a_m^2 & \cdots & a_m^n \\
  \end{pmatrix}
$$

公式由于微信不支持，目前的解决方案是转成 `svg` 放到微信中，无需调整，矢量不失真。

目前测试如果公式量过大，在 Chrome 下会存在粘贴后无响应，但是在 Firefox 中始终能够成功。

```python
import scrapy
from scrapy.http import JsonRequest, FormRequest


class HttpbinSpider(scrapy.Spider):
    name = 'httpbin'
    allowed_domains = ['httpbin.org']
    start_url = 'http://httpbin.org/post'
    data = {'name': 'germey', 'age': '26'}

    def start_requests(self):
        yield FormRequest(self.start_url,
                          callback=self.parse_response,
                          formdata=self.data)
        yield JsonRequest(self.start_url,
                          callback=self.parse_response,
                          data=self.data)

    def parse_response(self, response):
        print('text', response.text)
```

这里我们利用 `start_requests` 方法生成了一个 `FormRequest` 和 `JsonRequest`，请求的页面链接修改为了 http://httpbin.org/post，它可以把 POST 请求的详情返回，另外 `data` 保持不变。

这个 `Request` 类怎么使用呢？那自然要了解下它的构造参数都有什么，梳理如下。

- `url`：`Request` 的页面链接，即 `Request URL`。
- `callback`：`Request` 的回调方法，通常这个方法需要定义在 `Spider` 类里面，并且需要对应一个 `response` 参数，代表 `Request` 执行请求后得到的 `Response` 对象。如果这个 `callback` 参数不指定，默认会使用 `Spider` 类里面的 `parse` 方法。
- `method`：`Request` 的方法，默认是 GET，还可以设置 POST、PUT、DELETE 等。
- `meta`：`Request` 请求携带的额外参数，利用 `meta`，我们可以指定任意处理参数，特定的参数经由 Scrapy 各个组件处理可以得到不同的效果，另外，`meta` 还可以用来向回调方法传递信息。
- `body`：`Request` 的内容，即 `Request Body`，往往 `Request Body` 对应的是 POST 请求，我们可以使用 `FormRequest` 或 `JsonRequest` 更方便地实现 POST 请求。
- `headers`：`Request Headers`，是字典形式。
- `cookies`：`Request` 携带的 Cookie，可以是字典或列表形式。
- `encoding`：`Request` 的编码，默认是 `utf-8`。
- `prority`：`Request` 优先级，默认是 0，这个优先级是给 Scheduler 做 Request 调度使用的，数值越大，就越被优先调度并执行。
- `dont_filter`：`Request` 不去重，Scrapy 默认会根据 `Request` 的信息进行去重，使得在爬取过程中不会出现重复请求，设置为 `True` 代表这个 `Request` 会被忽略去重操作，默认是 `False`。
- `errback`：错误处理方法，如果在请求处理过程中出现了错误，这个方法就会被调用。
- `flags`：请求的标志，可以用于记录类似的处理。
- `cb_kwargs`：回调方法的额外参数，可以作为字典传递。
