import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
test('Site auth saves one PATCH with If-Match', () => {
  const auth = read('src/components/setting/Auth.vue');
  const operator = read('src/operators/site.ts');
  assert.match(auth, /siteOperator\.get\(siteId\)/);
  assert.match(auth, /this\.configurationRevision/);
  assert.match(auth, /siteOperator\.update/);
  assert.match(auth, /this\.updateQueue\.then\(operation, operation\)/);
  assert.match(auth, /data\.configuration_revision/);
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
test('GitHub custom credentials are gated by an explicit toggle', () => {
  const component = read('src/components/setting/SiteGithubOAuthApp.vue');
  assert.match(component, /<el-switch[\s\S]*:model-value="customVisible"[\s\S]*@change="toggleCustomApp"/);
  assert.match(component, /<el-form v-if="customVisible"/);
  assert.match(component, /<div v-if="customVisible" class="github-oauth__actions">/);
  assert.match(component, /return this\.mode === 'custom' \|\| this\.configuring/);
  assert.match(component, /if \(value === true\) \{[\s\S]*this\.configuring = true;[\s\S]*return;/);
  assert.match(component, /this\.\$emit\('change', \{ mode: 'platform' \}/);
});
