// Pricing helpers now live in @acedatacloud/core/pricing. getConsumption is the
// pure JsonLogic evaluator; the currency-aware formatters are built from the
// store's exchange/currency here. Exported names/signatures unchanged.
import { getConsumption as coreGetConsumption, createPriceFormatter } from '@acedatacloud/core/pricing';
import { CURRENCY_LABEL_MAPPING } from '@/constants/mapping';
import store from '@/store';

const formatter = createPriceFormatter({
  getExchange: () => store.state.exchange,
  getCurrency: () => store.state.currency,
  currencyLabels: CURRENCY_LABEL_MAPPING
});

export const getPrice = formatter.getPrice;
export const getPriceString = formatter.getPriceString;
// Keep the historically-loose signature (call sites pass `config | undefined`).
export const getConsumption = (payload: any, rules: any): number | undefined => coreGetConsumption(payload, rules);
