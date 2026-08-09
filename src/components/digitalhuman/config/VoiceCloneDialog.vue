<template>
  <el-dialog
    :model-value="visible"
    :title="$t('digitalhuman.name.cloneVoice')"
    width="440"
    align-center
    append-to-body
    :close-on-click-modal="!cloning"
    :close-on-press-escape="!cloning"
    @update:model-value="onVisible"
  >
    <p class="text-xs text-[var(--el-text-color-secondary)] mb-3">{{ $t('digitalhuman.message.voiceCloneHint') }}</p>

    <media-input
      kind="audio"
      :accept="DIGITALHUMAN_AUDIO_ACCEPT"
      :button-text="$t('digitalhuman.button.uploadSample')"
      :hint="$t('digitalhuman.message.audioHint')"
      class="mb-4"
      @change="onSampleChange"
    />

    <div class="field mb-3">
      <span class="label">{{ $t('digitalhuman.name.voiceName') }}</span>
      <el-input v-model="name" class="control" :placeholder="$t('digitalhuman.placeholder.voiceName')" />
    </div>

    <div class="field">
      <span class="label">{{ $t('digitalhuman.name.voiceLang') }}</span>
      <el-radio-group v-model="lang" class="control">
        <el-radio-button v-for="option in langOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </el-radio-button>
      </el-radio-group>
    </div>

    <el-alert v-if="cloning" :closable="false" type="info" class="mt-4">
      <p class="text-xs mb-0">{{ $t('digitalhuman.message.voiceCloneRunning') }}</p>
    </el-alert>
    <p v-else class="mt-4 text-xs text-[var(--el-text-color-secondary)]">
      {{ $t('digitalhuman.message.voiceStoredLocally') }}
    </p>

    <template #footer>
      <div class="footer">
        <span v-if="walletMode" class="cost text-xs text-[var(--el-text-color-secondary)]">
          {{
            voiceQuoteLoading
              ? '…'
              : voiceQuoteUsdc
                ? `${voiceQuoteUsdc} USDC`
                : $t('common.x402Scenario.quoteBeforeSigning')
          }}
        </span>
        <consumption v-else :value="DIGITALHUMAN_VOICE_CLONE_CONSUMPTION" :service="service" class="cost" />
        <div>
          <el-button :disabled="cloning" @click="onVisible(false)">{{ $t('common.button.cancel') }}</el-button>
          <el-button type="primary" :loading="cloning" :disabled="!sampleUrl || cloning" @click="onClone">
            {{ $t('digitalhuman.button.startClone') }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  ElAlert,
  ElButton,
  ElDialog,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElRadioButton,
  ElRadioGroup
} from 'element-plus';
import Consumption from '@/components/common/Consumption.vue';
import MediaInput from './MediaInput.vue';
import { buildDigitalHumanVoiceRequest, digitalHumanOperator } from '@/operators/digitalhuman';
import {
  DIGITALHUMAN_ALLOWED_LANGS,
  DIGITALHUMAN_AUDIO_ACCEPT,
  DIGITALHUMAN_DEFAULT_LANG,
  DIGITALHUMAN_VOICE_CLONE_CONSUMPTION
} from '@/constants';
import { addVoice, nextVoiceName } from '@/utils/digitalhumanVoices';
import { isScenarioX402Enabled, scenarioPaymentState } from '@/utils/x402/scenarioPayment';
import {
  X402PaymentCancelledError,
  type OperatorRequestOptions,
  type X402PaymentQuote,
  type X402WalletContext,
  resolveX402WalletContext
} from '@/operators/x402';
import { IDigitalHumanLang } from '@/models';

const POLL_INTERVAL = 3000;
const POLL_MAX = 60;

interface IData {
  sampleUrl: string | undefined;
  name: string;
  lang: IDigitalHumanLang;
  cloning: boolean;
  destroyed: boolean;
  runId: number;
  DIGITALHUMAN_AUDIO_ACCEPT: string;
  DIGITALHUMAN_VOICE_CLONE_CONSUMPTION: number;
  voiceQuoteUsdc: string | undefined;
  voiceQuoteLoading: boolean;
  quoteRunId: number;
}

export default defineComponent({
  name: 'DigitalHumanVoiceCloneDialog',
  components: {
    Consumption,
    ElAlert,
    ElButton,
    ElDialog,
    ElInput,
    ElRadioButton,
    ElRadioGroup,
    MediaInput
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:visible', 'cloned'],
  data(): IData {
    return {
      sampleUrl: undefined,
      name: '',
      lang: DIGITALHUMAN_DEFAULT_LANG as IDigitalHumanLang,
      cloning: false,
      destroyed: false,
      runId: 0,
      DIGITALHUMAN_AUDIO_ACCEPT,
      DIGITALHUMAN_VOICE_CLONE_CONSUMPTION,
      voiceQuoteUsdc: undefined,
      voiceQuoteLoading: false,
      quoteRunId: 0
    };
  },
  computed: {
    service() {
      return this.$store.state.digitalhuman?.service;
    },
    credentialToken(): string | undefined {
      return this.$store.state.digitalhuman?.credential?.token;
    },
    walletMode(): boolean {
      return isScenarioX402Enabled() && scenarioPaymentState('digitalhuman').mode === 'wallet';
    },
    langOptions(): { value: string; label: string }[] {
      return DIGITALHUMAN_ALLOWED_LANGS.map((value) => ({
        value,
        label: this.$t(`digitalhuman.name.lang_${value}`) as string
      }));
    }
  },
  watch: {
    walletMode(enabled: boolean) {
      this.voiceQuoteUsdc = undefined;
      if (enabled && this.visible && this.sampleUrl) this.refreshVoiceQuote();
    },
    visible(open: boolean) {
      if (open) {
        this.sampleUrl = undefined;
        this.name = nextVoiceName(this.$t('digitalhuman.name.myVoice') as string);
        this.lang = DIGITALHUMAN_DEFAULT_LANG as IDigitalHumanLang;
      } else {
        // abandon any in-flight poll so a reopened dialog never adopts it
        this.runId++;
        this.quoteRunId++;
        this.cloning = false;
        this.voiceQuoteLoading = false;
      }
    }
  },
  beforeUnmount() {
    this.destroyed = true;
    this.runId++;
    this.quoteRunId++;
  },
  methods: {
    onVisible(open: boolean) {
      if (this.cloning && !open) {
        return;
      }
      this.$emit('update:visible', open);
    },
    onSampleChange(url: string | undefined) {
      this.sampleUrl = url;
      this.voiceQuoteUsdc = undefined;
      if (url && this.walletMode) this.refreshVoiceQuote();
    },
    isStale(runId: number): boolean {
      return this.destroyed || runId !== this.runId;
    },
    sleep(ms: number): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },
    async refreshVoiceQuote() {
      if (!this.sampleUrl) return;
      const runId = ++this.quoteRunId;
      this.voiceQuoteLoading = true;
      try {
        const quote = await digitalHumanOperator.quoteVoice(this.voiceRequest());
        if (runId === this.quoteRunId && this.walletMode) this.voiceQuoteUsdc = quote.amountUsdc;
      } catch (error) {
        console.warn('x402 voice quote failed', error);
      } finally {
        if (runId === this.quoteRunId) this.voiceQuoteLoading = false;
      }
    },
    voiceRequest() {
      return buildDigitalHumanVoiceRequest({
        audio_url: this.sampleUrl || '',
        lang: this.lang,
        name: this.name || undefined
      });
    },
    paymentOptions(): OperatorRequestOptions | undefined {
      if (!this.walletMode) return this.credentialToken ? { token: this.credentialToken } : undefined;
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
          identityToken: this.credentialToken
        }
      };
    },
    async onClone() {
      if (!this.sampleUrl) return;
      const options = this.paymentOptions();
      if (!options) return;
      const runId = ++this.runId;
      this.cloning = true;
      try {
        const { data } = await digitalHumanOperator.cloneVoice(this.voiceRequest(), options);
        if (this.isStale(runId)) {
          return;
        }
        if (data?.voice_id) {
          this.onCloned(data.voice_id);
          return;
        }
        if (data?.task_id) {
          await this.pollVoice(data.task_id, runId);
        } else {
          throw new Error('no task');
        }
      } catch (error) {
        if (error instanceof X402PaymentCancelledError) return;
        if (!this.isStale(runId)) {
          ElMessage.error(this.$t('digitalhuman.message.voiceCloneFailed'));
        }
      } finally {
        if (!this.isStale(runId)) {
          this.cloning = false;
        }
      }
    },
    async pollVoice(taskId: string, runId: number) {
      for (let i = 0; i < POLL_MAX; i++) {
        if (this.isStale(runId)) {
          return;
        }
        await this.sleep(POLL_INTERVAL);
        if (this.isStale(runId)) {
          return;
        }
        const token = this.credentialToken;
        const { data } = await digitalHumanOperator.pollTask(taskId, token ? { token } : { mode: 'x402' });
        if (this.isStale(runId)) {
          return;
        }
        if (data?.voice_id) {
          this.onCloned(data.voice_id);
          return;
        }
        if (data?.state === 'failed') {
          throw new Error('clone failed');
        }
      }
      throw new Error('timeout');
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
    },
    onCloned(voiceId: string) {
      addVoice({
        voice_id: voiceId,
        name: this.name || (this.$t('digitalhuman.name.myVoice') as string),
        lang: this.lang,
        created_at: Date.now() / 1000
      });
      ElMessage.success(this.$t('digitalhuman.message.voiceCloneSuccess'));
      this.cloning = false;
      this.$emit('cloned', voiceId);
      this.$emit('update:visible', false);
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  .label {
    font-size: 14px;
    font-weight: bold;
    flex: none;
  }

  .control {
    width: 260px;
  }
}

.footer {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  .cost {
    margin: 0;
  }
}
</style>
