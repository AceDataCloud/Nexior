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

test('OAuth App editor remains provider-neutral and API-free', () => {
  const component = read('src/components/setting/SiteOAuthAppEditor.vue');
  assert.match(component, /descriptor\.requiresSecret/);
  assert.match(component, /secret_values/);
  assert.match(component, /this\.\$emit\('change'/);
  assert.doesNotMatch(component, /httpClient|siteOperator|auth-providers\//);
});

test('descriptors cover confidential GitHub and Google clients plus Services-ID-only Apple', () => {
  const descriptors = read('src/constants/siteOAuthProviders.ts');
  assert.match(descriptors, /SITE_OAUTH_PROVIDER_IDS = \['github', 'google', 'apple'\]/);
  assert.match(descriptors, /github: \{[\s\S]*?requiresSecret: true/);
  assert.match(descriptors, /google: \{[\s\S]*?requiresSecret: true/);
  assert.match(descriptors, /apple: \{[\s\S]*?requiresSecret: false/);
  const apple = descriptors.slice(descriptors.indexOf('  apple:'));
  assert.match(apple, /authAppleOAuthServicesId/);
  assert.doesNotMatch(apple, /clientSecret|privateKey|teamId|keyId|\.p8/);
});

test('OAuth drafts are provider-indexed and saves inject only the selected provider', () => {
  const auth = read('src/components/setting/Auth.vue');
  assert.match(auth, /Partial<Record<SiteOAuthProviderId, SiteOAuthCredentialsDraft>>/);
  assert.match(auth, /writableOAuthAuth\(providerId: SiteOAuthProviderId\)/);
  assert.match(auth, /const credentials = this\.oauthCredentialDrafts\[providerId\]/);
  assert.match(auth, /delete provider\.credentials/);
  assert.match(auth, /delete provider\.delivery/);
  assert.match(auth, /delete drafts\[providerId\]/);
  assert.match(auth, /this\.oauthCredentialDrafts = \{\};/);
});
