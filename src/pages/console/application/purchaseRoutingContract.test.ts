import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string): string =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

const statusSource = readSource('../../../components/application/Status.vue');
const listSource = readSource('./List.vue');
const extraSource = readSource('./Extra.vue');
const subscribeSource = readSource('./Subscribe.vue');
const sunoActionsSource = readSource('../../../store/suno/actions.ts');

describe('application purchase routing contract', () => {
  it.each([
    ['Status.vue', statusSource],
    ['List.vue', listSource]
  ])('%s routes Buy More through the shared type-aware helper', (_name, source) => {
    expect(source).toContain('getApplicationPurchaseRoute(application)');
    expect(source).not.toContain('name: ROUTE_CONSOLE_APPLICATION_EXTRA, params: { id: application.id }');
  });

  it('preserves native in-app and web new-tab navigation', () => {
    expect(statusSource).toContain('if (isNative())');
    expect(statusSource).toContain('this.$router.push(target)');
    expect(statusSource).toContain("window.open(this.$router.resolve(target).href, '_blank')");
  });

  it('redirects direct Period top-up URLs to subscription checkout', () => {
    const guard = extraSource.indexOf('if (data.type === IApplicationType.PERIOD)');
    const assignment = extraSource.indexOf('this.application = data;');

    expect(guard).toBeGreaterThan(-1);
    expect(extraSource).toContain('name: ROUTE_CONSOLE_APPLICATION_SUBSCRIBE');
    expect(extraSource).toContain('params: { id: data.id }');
    expect(extraSource).toContain('this.$router.replace({');
    expect(guard).toBeLessThan(assignment);
  });

  it('uses the matching Usage application when leaving subscription checkout', () => {
    expect(subscribeSource).toContain('void this.onFetchUsageApplication()');
    expect(subscribeSource).toContain('if (this.creatingUsageApplication) return;');
    expect(subscribeSource).toContain('await this.onFetchUsageApplication();');
    expect(subscribeSource).toContain('type: IApplicationType.USAGE');
    expect(subscribeSource).toContain('id: this.usageApplication.id');
    expect(subscribeSource).not.toContain('id: this.applicationId');
  });

  it('lists both application types for individual apps but keeps global apps Usage-only', () => {
    expect(listSource).toContain('? [IApplicationType.USAGE, IApplicationType.PERIOD]');
    expect(listSource).toContain(': IApplicationType.USAGE');
  });

  it('keeps Period-only controls off the Usage balance contract', () => {
    expect(listSource).toContain('scope.row.type === applicationType.USAGE');
    expect(listSource).toContain('app.type === applicationType.USAGE');
    expect(listSource).toContain('if (application.type === IApplicationType.PERIOD)');
  });

  it('keeps Suno application discovery untyped so Period subscriptions remain usable', () => {
    expect(sunoActionsSource).toContain('service_id: SUNO_SERVICE_ID');
    expect(sunoActionsSource).not.toContain('service_id: SUNO_SERVICE_ID,\n        type: IApplicationType.USAGE');
  });
});
