// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import OrderList from './List.vue';
import { OrderState } from '@/models';

const { stateTagType } = (OrderList as unknown as { methods: { stateTagType: (state: string) => string } }).methods;

describe('order status badge semantics', () => {
  it('distinguishes an expired or refunded order from a payment failure', () => {
    expect(stateTagType(OrderState.EXPIRED)).toBe('warning');
    expect(stateTagType(OrderState.REFUNDED)).toBe('warning');
    expect(stateTagType(OrderState.FAILED)).toBe('danger');
  });

  it('only presents paid or finished orders as successful', () => {
    expect(stateTagType(OrderState.PAID)).toBe('success');
    expect(stateTagType(OrderState.FINISHED)).toBe('success');
    expect(stateTagType(OrderState.PENDING)).toBe('info');
    expect(stateTagType('future-state')).toBe('info');
  });
});
