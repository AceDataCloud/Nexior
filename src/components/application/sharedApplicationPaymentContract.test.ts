import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const readSource = (path: string): string => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

describe('shared application payment contract', () => {
  const infoSource = readSource('./Info.vue');
  const listSource = readSource('../../pages/console/application/List.vue');
  const messageSource = readSource('../chat/Message.vue');
  const extraSource = readSource('../../pages/console/application/Extra.vue');
  const subscribeSource = readSource('../../pages/console/application/Subscribe.vue');

  it('hides payment actions for grantees in application selectors and lists', () => {
    expect(infoSource).toContain("this.application.role === 'grantee' || isRechargeDisabled");
    expect(listSource).toContain("application.role === 'grantee' || isRechargeDisabled");
  });

  it('hides the used-up payment action for a shared application', () => {
    expect(messageSource).toContain("this.application?.role === 'grantee' || isRechargeDisabled");
  });

  it('redirects grantees away from direct purchase pages', () => {
    expect(extraSource).toContain("if (data.role === 'grantee')");
    expect(extraSource).toContain('this.$router.replace({ name: ROUTE_CONSOLE_APPLICATION_LIST });');
    expect(subscribeSource).toContain("if (this.application?.role === 'grantee')");
    expect(subscribeSource).toContain('this.$router.replace({ name: ROUTE_CONSOLE_APPLICATION_LIST });');
  });
});
