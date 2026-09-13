import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
test('Site auth saves one PATCH with If-Match', () => {
  const auth = read('src/components/setting/Auth.vue');
  const operator = read('src/operators/site.ts');
  assert.match(auth, /siteOperator\.update\(this\.site\.id, \{ auth \}, this\.site\.configuration_revision\)/);
  assert.doesNotMatch(auth, /toWritableSitePayload/);
  assert.match(operator, /httpClient\.patch/);
  assert.match(operator, /If-Match/);
});
test('GitHub credentials remain component-local', () => {
  const component = read('src/components/setting/SiteGithubOAuthApp.vue');
  assert.match(component, /secret_values/);
  assert.match(component, /this\.\$emit\('change'/);
  assert.doesNotMatch(component, /httpClient|siteGithubOAuthOperator|auth-providers\/github/);
});
