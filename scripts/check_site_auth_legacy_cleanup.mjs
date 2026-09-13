import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
test('delivery config uses Site API while test actions remain', () => {
  const operator = read('src/operators/siteAuthDelivery.ts');
  const components =
    read('src/components/setting/SiteEmailTransport.vue') + read('src/components/setting/SitePhoneDelivery.vue');
  assert.doesNotMatch(operator, /\/sites\/.*auth-deliveries/);
  assert.match(operator, /site-auth-deliveries\/\$\{siteId\}\/email\/test/);
  assert.match(components, /siteOperator\.get/);
  assert.match(components, /siteOperator\.update/);
  assert.doesNotMatch(components, /siteAuthDeliveryOperator\.(get|update|remove)/);
});
