import asyncio

import aiohttp


async def main() -> None:
    url = "{{{url}}}"

    headers = {
{{#headers}}
        "{{{key}}}": {{{value}}}{{^last}},{{/last}}
{{/headers}}
    }

    payload = {
{{#body}}
        "{{{key}}}": {{{value}}}{{^last}},{{/last}}
{{/body}}
    }

    async with aiohttp.ClientSession() as session:
        async with session.{{{method}}}(url, json=payload, headers=headers) as response:
            print(await response.text())


asyncio.run(main())
