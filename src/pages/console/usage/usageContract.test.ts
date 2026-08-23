import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const readSource = (path: string): string => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

describe('API usage page contract', () => {
  const usageSource = readSource('./List.vue');
  const usageOperatorSource = readSource('../../../operators/usage.ts');
  const applicationListSource = readSource('../application/List.vue');
  const applicationInfoSource = readSource('../../../components/application/Info.vue');

  it('uses a service-first filter with operation drilldown', () => {
    expect(usageSource.indexOf("$t('usage.field.service')")).toBeLessThan(
      usageSource.indexOf("$t('usage.field.operation')")
    );
    expect(usageSource).toContain('v-model="serviceIds"');
    expect(usageSource).toContain('type: [IServiceType.API, IServiceType.Agent]');
    expect(usageSource).toContain(
      "applicationOperator.getAll({ limit: 1000, offset: 0, ordering: '-created_at', user_id: 'me' })"
    );
    expect(usageSource).toContain('const services = new Map(catalog.items.map((service) => [service.id, service]))');
    expect(usageSource).toContain(':disabled="!serviceIds.length && !apiIds.length"');
    expect(usageSource).toContain('apiOperator.getAllForService(serviceId');
    expect(usageSource).not.toContain(
      "limit: 1000,\n          offset: 0,\n          ordering: '-created_at'\n        })\n        .then"
    );
  });

  it('sends service_id through every usage data path', () => {
    expect(usageOperatorSource.match(/service_id\?: string \| string\[\];/g)).toHaveLength(3);
    expect(usageSource).toContain("service_id: serviceIds.length ? serviceIds.join(',') : undefined");
    expect(usageSource.match(/\{ service_id: this\.serviceIds \}/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it('preserves legacy api_id deep links and hydrates their services', () => {
    expect(usageSource).toContain('async hydrateApiSelection()');
    expect(usageSource).toContain('this.apiIds.map((apiId) => apiOperator.get(apiId))');
    expect(usageSource).toContain('const services = new Set(this.serviceIds)');
    expect(usageSource).toContain('if (serviceId) services.add(serviceId)');
  });

  it('renders service icons in options, selected labels, and usage rows', () => {
    expect(usageSource).toContain('<template #label="{ label, value }">');
    expect(usageSource).toContain('serviceIcon(value)');
    expect(usageSource).toContain('v-if="item.icon_url"');
    expect(usageSource).toContain('scope.row?.service?.icon_url');
    expect(usageSource).toContain("scope.row?.service?.title || '-'");
  });

  it('shows service and operation as separate usage columns', () => {
    expect(usageSource).toContain('<el-table-column :label="$t(\'usage.field.service\')"');
    expect(usageSource).toContain('<el-table-column :label="$t(\'usage.field.operation\')"');
    expect(usageSource).toContain("scope.row?.service?.title || '-'");
    expect(usageSource).toContain("scope.row?.api?.title || '-'");
  });

  it('retains dormant proxy compatibility and API-only usage actions', () => {
    expect(usageSource).toContain('type: IServiceType.API,');
    expect(usageSource).toContain('proxyUsageOperator');
    expect(usageSource).toContain('onFetchProxyUsages');
    expect(applicationListSource).toContain('v-if="scope.row?.service?.type === serviceType.API"');
    expect(applicationListSource).toContain('v-if="app?.service?.type === serviceType.API"');
    expect(applicationInfoSource).toContain(
      'return !this.application?.service || this.application.service.type === IServiceType.API;'
    );
  });
});
