<template>
  <el-dialog :model-value="visible" :title="$t('application.title.buyService')" width="500px" center>
    <p class="text-center">
      {{ $t('order.message.buyInExternalUrl') }}
    </p>
  </el-dialog>
</template>

<script lang="ts">
import { orderOperator } from '@/operators';
import { defineComponent } from 'vue';
import { ElDialog } from 'element-plus';
import { IOrder, IOrderDetailResponse, OrderState } from '@/models';
import { isAndroid } from '@/utils';

interface IData {
  refreshTimer: number | undefined;
  androidSheetLaunched: boolean;
}

export default defineComponent({
  name: 'PayOrderDialog',
  components: {
    ElDialog
  },
  props: {
    modelValue: {
      type: Object as () => IOrder,
      required: true
    },
    visible: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  emits: ['hide', 'update:modelValue'],
  data(): IData {
    return {
      refreshTimer: undefined,
      androidSheetLaunched: false
    };
  },
  watch: {
    visible: {
      handler(val) {
        if (!val) {
          this.androidSheetLaunched = false;
          return;
        }
        const clientSecret = this.modelValue?.metadata?.stripe_client_secret as string | undefined;
        // Android native flow: pay_url is empty; payment is collected via
        // the in-app Stripe PaymentSheet using the PaymentIntent client_secret
        // returned by PayBackend.
        if (isAndroid() && clientSecret) {
          this.launchNativePaymentSheet(clientSecret).catch((err) => {
            console.error('Stripe PaymentSheet failed', err);
          });
          return;
        }
        if (this.modelValue.pay_url) {
          window.open(this.modelValue.pay_url, '_blank');
        }
      }
    }
  },
  mounted() {
    this.onRefresh();
  },
  unmounted() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
  },
  methods: {
    async launchNativePaymentSheet(clientSecret: string) {
      if (this.androidSheetLaunched) return;
      this.androidSheetLaunched = true;
      const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
      if (!publishableKey) {
        console.error('VITE_STRIPE_PUBLISHABLE_KEY is not configured');
        return;
      }
      // Dynamic import keeps the plugin out of the web bundle for
      // browsers / iOS, where it would never be invoked.
      const { Stripe, PaymentSheetEventsEnum } = await import('@capacitor-community/stripe');
      await Stripe.initialize({ publishableKey });
      await Stripe.createPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'AceData'
      });
      // Listen for the user-driven outcomes; the polling loop is still our
      // source of truth for PAID, but immediate emit/refresh feels snappier.
      const completedHandler = await Stripe.addListener(PaymentSheetEventsEnum.Completed, () => {
        this.onRefresh();
        completedHandler.remove();
      });
      const canceledHandler = await Stripe.addListener(PaymentSheetEventsEnum.Canceled, () => {
        this.$emit('hide');
        canceledHandler.remove();
      });
      const failedHandler = await Stripe.addListener(PaymentSheetEventsEnum.FailedToLoad, () => {
        this.$emit('hide');
        failedHandler.remove();
      });
      await Stripe.presentPaymentSheet();
    },
    onRefresh() {
      if (!this.modelValue.id) {
        console.error('id does not exist');
        return;
      }
      orderOperator
        .refresh(this.modelValue.id)
        .then(({ data: data }: { data: IOrderDetailResponse }) => {
          // if not paid, check for next loop
          if (data.state !== OrderState.PAID) {
            setTimeout(() => {
              this.onRefresh();
            }, 2000);
          } else {
            // paid, just notify parent, and hide the dialog
            this.$emit('hide');
          }
          this.$emit('update:modelValue', data);
        })
        .catch(() => {
          setTimeout(() => {
            this.onRefresh();
          }, 5000);
        });
    }
  }
});
</script>

<style lang="scss" scoped>
.paycodes {
  padding: 30px 0;
  width: 500px;
  margin: auto;
}
</style>
