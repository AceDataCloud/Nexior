import { reactive } from 'vue';
import type { CanonicalX402PaymentError } from './paymentError';

const errors = reactive<Record<string, CanonicalX402PaymentError | undefined>>({});

export function scenarioPaymentError(scenario: string): CanonicalX402PaymentError | undefined {
  return errors[scenario];
}

export function setScenarioPaymentError(scenario: string, error?: CanonicalX402PaymentError): void {
  errors[scenario] = error;
}

export function clearScenarioPaymentError(scenario: string): void {
  errors[scenario] = undefined;
}

export function clearAllScenarioPaymentErrors(): void {
  Object.keys(errors).forEach((scenario) => {
    errors[scenario] = undefined;
  });
}
