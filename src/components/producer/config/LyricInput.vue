<template>
  <div class="field">
    <div class="flex items-center justify-between mb-1">
      <div class="flex items-center">
        <span class="text-sm font-bold">{{ $t('producer.name.lyrics') }}</span>
        <info-icon :content="$t('producer.description.lyrics')" />
      </div>
      <el-button
        v-if="config?.action !== 'extend'"
        size="small"
        :loading="generatingLyrics"
        round
        @click="onGenerateLyrics"
      >
        <magic-icon v-if="!generatingLyrics" class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('producer.button.generate_lyrics') }}
      </el-button>
    </div>
    <el-input
      v-if="config?.action !== 'extend'"
      v-model="lyric"
      :rows="5"
      type="textarea"
      class="lyrics"
      :placeholder="$t('producer.placeholder.lyrics')"
    />
    <el-input
      v-else
      v-model="lyric"
      :rows="5"
      type="textarea"
      class="lyrics"
      :placeholder="$t('producer.placeholder.extend.lyrics')"
    />
  </div>
</template>

<script lang="ts">
import { MagicIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElInput, ElButton, ElMessage, ElMessageBox } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { producerOperator } from '@/operators/producer';
import { isScenarioX402Enabled, scenarioPaymentState } from '@/utils/x402/scenarioPayment';
import {
  X402PaymentCancelledError,
  type OperatorRequestOptions,
  type X402PaymentQuote,
  type X402WalletContext,
  resolveX402WalletContext
} from '@/operators/x402';

export const DEFAULT_LYRIC = '';

export default defineComponent({
  name: 'LyricInput',
  components: {
    MagicIcon,
    ElInput,
    ElButton,
    InfoIcon
  },
  data() {
    return {
      generatingLyrics: false
    };
  },
  computed: {
    lyric: {
      get() {
        return this.$store.state.producer?.config?.lyric;
      },
      set(val: string) {
        this.$store.commit('producer/setConfig', {
          ...this.$store.state.producer?.config,
          lyric: val
        });
      }
    },
    config() {
      return this.$store.state.producer?.config;
    },
    credential() {
      return this.$store.state.producer?.credential;
    },
    walletMode(): boolean {
      return isScenarioX402Enabled() && scenarioPaymentState('producer').mode === 'wallet';
    }
  },
  mounted() {
    if (!this.lyric) {
      this.lyric = DEFAULT_LYRIC;
    }
  },
  methods: {
    paymentOptions(): OperatorRequestOptions | undefined {
      if (!this.walletMode) {
        const token = this.credential?.token;
        return token ? { token } : undefined;
      }
      const wallet = this.getWalletContext();
      if (!wallet) {
        ElMessage.warning(this.$t('common.x402Scenario.connectWalletFirst'));
        return undefined;
      }
      return {
        mode: 'x402',
        x402: {
          wallet,
          confirm: (quote) => this.confirmWalletPayment(quote),
          identityToken: this.credential?.token
        }
      };
    },
    async onGenerateLyrics() {
      const options = this.paymentOptions();
      if (!options) return;
      const prompt = this.config?.style || this.config?.title || 'a beautiful song';
      this.generatingLyrics = true;
      ElMessage.info(this.$t('producer.message.generatingLyrics'));

      try {
        const response = await producerOperator.lyric({ prompt }, options);
        const data = response.data?.data;
        if (data?.text) {
          this.lyric = data.text;
          if (data?.title && !this.config?.title) {
            this.$store.commit('producer/setConfig', {
              ...this.$store.state.producer?.config,
              lyric: data.text,
              title: data.title
            });
          }
          ElMessage.success(this.$t('producer.message.generateLyricsSuccess'));
        }
      } catch (error) {
        if (error instanceof X402PaymentCancelledError) return;
        ElMessage.error(this.$t('producer.message.generateLyricsFailed'));
      } finally {
        this.generatingLyrics = false;
      }
    },
    getWalletContext(): X402WalletContext | undefined {
      return resolveX402WalletContext((this as any).$wallet);
    },
    async confirmWalletPayment(quote: X402PaymentQuote): Promise<boolean> {
      return ElMessageBox.confirm(
        this.$t('common.x402Scenario.confirmPayment', { amount: quote.amountUsdc }),
        this.$t('order.message.x402ConfirmTitle'),
        {
          confirmButtonText: this.$t('order.message.x402WalletPayCta'),
          cancelButtonText: this.$t('common.button.cancel'),
          type: 'warning'
        }
      )
        .then(() => true)
        .catch(() => false);
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  :deep(.el-textarea__inner) {
    font-family: monospace;
    line-height: 1.6;
  }
}
</style>
