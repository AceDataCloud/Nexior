// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import Consumption from './Consumption.vue';

const mountConsumption = (value: number) =>
  shallowMount(Consumption, {
    props: {
      value,
      service: { id: 'service-id', title: 'Test service', unit: 'credits' }
    },
    global: {
      mocks: {
        $t: (key: string) => key
      }
    }
  });

describe('common/Consumption', () => {
  it('does not display a small positive estimate as zero', () => {
    expect(mountConsumption(0.00011028).text()).toContain('0.0001');
    expect(mountConsumption(0.000001).text()).toContain('<0.0001');
  });

  it('keeps standard two-decimal formatting for larger values', () => {
    expect(mountConsumption(0.033084).text()).toContain('0.03');
  });
});
