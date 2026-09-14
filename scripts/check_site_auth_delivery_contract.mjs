import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Auth owns delivery configuration while test actions remain separate', () => {
  const auth = read('src/components/setting/Auth.vue');
  const operator = read('src/operators/siteAuthDelivery.ts');
  const components =
    read('src/components/setting/SiteEmailTransport.vue') + read('src/components/setting/SitePhoneDelivery.vue');
  assert.doesNotMatch(operator, /\/sites\/.*auth-deliveries/);
  assert.match(operator, /site-auth-deliveries\/\$\{siteId\}\/email\/test/);
  assert.match(auth, /:update-delivery="updateEmailDelivery"/);
  assert.match(auth, /:update-delivery="updatePhoneDelivery"/);
  assert.match(auth, /siteOperator\.get\(siteId\)/);
  assert.match(auth, /siteOperator\.update/);
  assert.doesNotMatch(components, /siteOperator\.(get|update)/);
  assert.doesNotMatch(components, /configurationRevision/);
  assert.doesNotMatch(components, /siteAuthDeliveryOperator\.(get|update|remove)/);
});

test('delivery writes remove management-only projection fields', () => {
  const components =
    read('src/components/setting/SiteEmailTransport.vue') + read('src/components/setting/SitePhoneDelivery.vue');
  for (const field of ['password_configured', 'secret_configured', 'verified', 'verified_at', 'test_proof']) {
    assert.match(components, new RegExp(`delete value\\.(smtp|webhook)\\.${field}`));
  }
});

test('Site auth delivery exposes only derived verification state', () => {
  const models = read('src/models/site.ts');
  const components =
    read('src/components/setting/SiteEmailTransport.vue') + read('src/components/setting/SitePhoneDelivery.vue');
  assert.doesNotMatch(models + components, /verification_source|saved_config_test|legacy_migration/);
});
