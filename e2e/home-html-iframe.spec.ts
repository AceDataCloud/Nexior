import { expect, test } from '@playwright/test';
import {
  buildHomeHtmlIframeDocument,
  HOME_HTML_IFRAME_RESIZE_MESSAGE
} from '../src/utils/homeHtmlIframe';

test('shrinks after fixed overlays close and grows with intrinsic content', async ({ page }) => {
  const srcdoc = buildHomeHtmlIframeDocument(
    `<main id="content" style="height:900px;background:#222"></main>
     <div id="modal" style="position:fixed;inset:0;background:#0008"></div>`,
    'zh-CN', true, 'dark'
  );

  await page.setContent('<iframe id="frame" style="display:block;width:500px;border:0"></iframe>');
  await page.evaluate(
    ({ documentSource, resizeType }) => {
      const frame = document.querySelector('#frame') as HTMLIFrameElement;
      window.addEventListener('message', (event) => {
        if (event.source !== frame.contentWindow || event.data?.type !== resizeType) return;
        frame.style.height = `${event.data.height}px`;
      });
      frame.srcdoc = documentSource;
    },
    { documentSource: srcdoc, resizeType: HOME_HTML_IFRAME_RESIZE_MESSAGE }
  );

  const frame = page.locator('#frame');
  await expect.poll(async () => Math.round((await frame.boundingBox())?.height || 0)).toBe(900);

  await page.locator('#frame').contentFrame().locator('#modal').evaluate((element) => element.remove());
  await page.locator('#frame').contentFrame().locator('#content').evaluate((element) => {
    (element as HTMLElement).style.height = '220px';
  });
  await expect.poll(async () => Math.round((await frame.boundingBox())?.height || 0)).toBe(220);
  await page.waitForTimeout(650);
  expect(Math.round((await frame.boundingBox())?.height || 0)).toBe(220);

  await page.locator('#frame').contentFrame().locator('#content').evaluate((element) => {
    (element as HTMLElement).style.height = '640px';
  });
  await expect.poll(async () => Math.round((await frame.boundingBox())?.height || 0)).toBe(640);

  const context = await page
    .locator('#frame')
    .contentFrame()
    .locator('html')
    .evaluate(() => ({
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      dataLang: document.documentElement.dataset.lang,
      dataTheme: document.documentElement.dataset.theme,
      colorScheme: getComputedStyle(document.documentElement).colorScheme,
      platform: (window as Window & { __ACEDATACLOUD__?: unknown }).__ACEDATACLOUD__
    }));
  expect(context).toEqual({
    lang: 'zh-CN', dir: 'ltr', dataLang: 'zh-CN', dataTheme: 'dark', colorScheme: 'dark',
    platform: { locale: 'zh-CN', dir: 'ltr', theme: 'dark' }
  });
});
