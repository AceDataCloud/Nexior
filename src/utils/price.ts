import { CURRENCY_LABEL_MAPPING } from '@/constants/mapping';
import store from '@/store';
import jsonLogic from 'json-logic-js';

/**
 * Input a value and target currency (e.g. cny), return the price which the current locale
 */
export const getPrice = (payload: { value: number; currency?: string }) => {
  const exchange = store.state.exchange;
  let { value, currency = store.state.currency || 'usd' } = payload;
  const label = CURRENCY_LABEL_MAPPING[currency];
  if (!exchange) {
    return {
      value: value,
      currency: currency,
      label: label
    };
  }
  const key = `usd-${currency}`;
  const rate = exchange[key];
  if (rate) {
    value = value * rate;
  }
  console.log('new price', { value, currency });
  return {
    value,
    currency,
    label
  };
};

export const getPriceString = (payload: {
  value: number | undefined;
  defaultValue?: number | undefined;
  fractionDigits?: number | undefined;
}) => {
  let { value, defaultValue, fractionDigits = 2 } = payload;
  if (value === undefined) {
    value = defaultValue;
  }
  if (value === undefined) {
    return '';
  }
  const price = getPrice({
    value
  });
  return `${price.label}${price.value?.toFixed(fractionDigits)}`;
};

export const getConsumption = (payload: any, rules: any): number | undefined => {
  if (!rules || !Array.isArray(rules)) {
    return undefined;
  }
  console.debug('payload', payload);
  console.debug('rules', rules);
  for (const rule of rules) {
    const conditions = rule.conditions;
    if (jsonLogic.apply(conditions, payload)) {
      return jsonLogic.apply(rule.consumption) as number;
    }
  }
  return 0;
};
