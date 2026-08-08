import { ElMessage, ElMessageBox } from 'element-plus';
import { isScenarioX402Enabled, scenarioPaymentState } from './scenarioPayment';
import type { OperatorRequestOptions, X402PaymentQuote, X402WalletContext } from '@/operators/x402';

interface SunoPaymentComponent {
  $wallet?: any;
  $store: any;
  $t(key: string, values?: Record<string, unknown>): string;
}

export function isSunoWalletMode(): boolean {
  return isScenarioX402Enabled() && scenarioPaymentState('suno').mode === 'wallet';
}

export function sunoPaymentOptions(component: SunoPaymentComponent): OperatorRequestOptions | undefined {
  const token = component.$store.state.suno?.credential?.token;
  if (!isSunoWalletMode()) return token ? { token } : undefined;
  const wallet = sunoWalletContext(component);
  if (!wallet) {
    ElMessage.warning(component.$t('common.x402Scenario.connectWalletFirst'));
    return undefined;
  }
  return {
    mode: 'x402',
    x402: {
      wallet,
      confirm: (quote) => confirmSunoPayment(component, quote),
      identityToken: token
    }
  };
}

function sunoWalletContext(component: SunoPaymentComponent): X402WalletContext | undefined {
  const publicKey = component.$wallet?.publicKey?.value;
  const adapter = component.$wallet?.wallet?.value?.adapter;
  if (!publicKey || !adapter?.signTransaction) return undefined;
  return { publicKey, signTransaction: adapter.signTransaction.bind(adapter) };
}

function confirmSunoPayment(component: SunoPaymentComponent, quote: X402PaymentQuote): Promise<boolean> {
  return ElMessageBox.confirm(
    component.$t('common.x402Scenario.confirmPayment', { amount: quote.amountUsdc }),
    component.$t('order.message.x402ConfirmTitle'),
    {
      confirmButtonText: component.$t('order.message.x402WalletPayCta'),
      cancelButtonText: component.$t('common.button.cancel'),
      type: 'warning'
    }
  )
    .then(() => true)
    .catch(() => false);
}
