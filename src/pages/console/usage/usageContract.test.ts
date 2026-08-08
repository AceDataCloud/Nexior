import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const readSource = (path: string): string => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

describe('API usage page contract', () => {
  const usageSource = readSource('./List.vue');
  const applicationListSource = readSource('../application/List.vue');
  const applicationInfoSource = readSource('../../../components/application/Info.vue');

  it('keeps the usage page in API mode and filters non-API services', () => {
    expect(usageSource).toContain('<el-col v-show="false" :md="4"');
    expect(usageSource).toContain('type: IServiceType.API,');
    expect(usageSource).not.toContain('type: this.$route.query.type');
    expect(usageSource).toContain('data.items.filter((api: IApi) => api.service?.type === IServiceType.API)');
  });

  it('retains the dormant proxy usage compatibility path', () => {
    expect(usageSource).toContain('proxyUsageOperator');
    expect(usageSource).toContain('onFetchProxyUsages');
  });

  it('only exposes individual usage actions for API services', () => {
    expect(applicationListSource).toContain('v-if="scope.row?.service?.type === serviceType.API"');
    expect(applicationListSource).toContain('v-if="app?.service?.type === serviceType.API"');
    expect(applicationListSource).not.toContain('type: application?.service?.type');
  });

  it('keeps global usage available while hiding non-API service usage', () => {
    expect(applicationInfoSource).toContain('v-if="showUsage"');
    expect(applicationInfoSource).toContain(
      'return !this.application?.service || this.application.service.type === IServiceType.API;'
    );
  });
});
