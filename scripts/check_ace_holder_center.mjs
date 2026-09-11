import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('holder center uses backend entitlement contracts', () => {
  const page = read('src/pages/console/holder/Index.vue');
  const operator = read('src/operators/ace.ts');
  assert.match(page, /aceOperator\.summary\(\)/);
  assert.match(page, /aceOperator\.operatorProfile\(\)/);
  assert.match(page, /aceOperator\.applyOperator/);
  assert.match(operator, /get\('\/coin-wallet\/summary\/'/);
  assert.match(operator, /post\('\/ace-operator\/'/);
  assert.match(operator, /patch\('\/ace-operator\/'/);
});

test('holder showcase requests are identity-scoped and separated on home', () => {
  const showcase = read('src/operators/showcase.ts');
  const home = read('src/pages/home/Index.vue');
  assert.match(showcase, /store\.getters\.authenticated \? optionalHttpClient : publicClient/);
  assert.match(showcase, /const key = `\$\{identity\}:/);
  assert.match(home, /visibleHolderShowcases/);
  assert.match(home, /minimumAceTier/);
  assert.match(home, /coin\.holderLab\.title/);
  assert.match(read('src/components/common/ShowcaseGrid.vue'), /item\.operator\.display_name/);
});

test('translation JSON mode names JSON in the user prompt', () => {
  const translator = read('scripts/translate_i18n.py');
  assert.match(translator, /user_prompt = "Translate this JSON object and return JSON only:/);
});

test('holder center is limited to the official site and native apps', () => {
  const route = read('src/router/console.ts');
  const sidePanel = read('src/components/console/SidePanel.vue');
  const userCenter = read('src/components/user/Center.vue');
  assert.match(route, /isMainOfficial\(\) \|\| isNative\(\)/);
  assert.match(sidePanel, /isMainOfficial\(\) \|\| isNative\(\)/);
  assert.match(userCenter, /this\.isMainOfficialHost \|\| this\.isNative/);
});

test('operator copy never promises featured placement', () => {
  const zh = JSON.parse(read('src/i18n/zh-CN/coin.json'));
  const en = JSON.parse(read('src/i18n/en/coin.json'));
  assert.match(zh['operator.description'].message, /不保证 Featured/);
  assert.match(en['operator.description'].message, /does not guarantee Featured/);
});
