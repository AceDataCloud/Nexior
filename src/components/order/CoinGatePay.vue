<template>
  <el-dialog
    :model-value="visible"
    :title="$t('order.title.cryptoPay')"
    width="min(500px, 94vw)"
    @close="$emit('hide')"
  >
    <template #header="{ titleId, titleClass }">
      <h2 :id="titleId" :class="[titleClass, 'coingate-title']">
        <coins-icon :size="22" aria-hidden="true" />
        {{ $t('order.title.cryptoPay') }}
      </h2>
    </template>
    <el-alert v-if="payment?.environment === 'sandbox'" type="warning" :closable="false" class="mb-4">
      {{ $t(payment.status === 'paid' ? 'order.message.coingateSandboxPaid' : 'order.message.coingateSandbox') }}
    </el-alert>
    <el-alert v-if="payment?.review_required" type="error" :closable="false" class="mb-4">
      {{ $t('order.message.coingateReview') }}
    </el-alert>
    <p>{{ $t('order.message.buyInExternalUrl') }}</p>
    <p v-if="payment?.burn_preview_usdc" class="mt-4">
      {{ $t('order.message.coingateBurnPending', { amount: payment.burn_preview_usdc }) }}
    </p>
    <template #footer>
      <el-button
        type="primary"
        :disabled="!checkoutUrl || payment?.status === 'paid' || payment?.review_required"
        @click="openCheckout"
      >
        {{ $t('order.button.openCryptoCheckout') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { ElAlert, ElButton, ElDialog } from 'element-plus';
import { CoinsIcon } from '@lucide/vue';
import type { IOrder } from '@/models';
import { coingateCheckoutUrl } from '@/utils/coingateCheckout';

export default defineComponent({
  name: 'CoinGatePayOrder',
  components: { ElAlert, ElButton, ElDialog, CoinsIcon },
  props: {
    modelValue: { type: Object as PropType<IOrder>, required: true },
    visible: { type: Boolean, default: false }
  },
  emits: ['hide', 'update:modelValue'],
  computed: {
    payment() {
      return this.modelValue.coingate_payment;
    },
    checkoutUrl(): string | undefined {
      return coingateCheckoutUrl(this.modelValue.pay_url, this.payment?.environment);
    }
  },
  methods: {
    openCheckout() {
      if (this.checkoutUrl && !this.payment?.review_required && this.payment?.status !== 'paid') {
        window.open(this.checkoutUrl, '_blank', 'noopener,noreferrer');
      }
    }
  }
});
</script>

<style scoped>
.coingate-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}
.coingate-title svg {
  flex-shrink: 0;
  color: var(--el-color-primary);
}
</style>
