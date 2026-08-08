<template>
  <el-dialog
    v-model="visible"
    :title="$t('user.browserDevice.pairTitle')"
    width="min(620px, 94vw)"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @closed="onClosed"
  >
    <el-alert
      :title="$t('user.browserDevice.localApprovalOnly')"
      type="info"
      :closable="false"
      show-icon
      class="pairing-alert"
    />

    <div v-if="loading" class="pairing-loading">
      <el-skeleton :rows="4" animated />
    </div>

    <template v-else-if="challenge">
      <p class="pairing-intro">{{ $t('user.browserDevice.pairInstructions') }}</p>
      <div class="pairing-code-row">
        <code class="pairing-code">{{ challenge.code }}</code>
        <el-button
          size="small"
          :aria-label="codeCopied ? $t('common.message.copied') : $t('common.button.copy')"
          @click="copyCode"
        >
          <success-icon v-if="codeCopied" class="mr-1" size="1em" aria-hidden="true" focusable="false" />
          <copy-icon v-else class="mr-1" size="1em" aria-hidden="true" focusable="false" />
          {{ codeCopied ? $t('common.message.copied') : $t('common.button.copy') }}
        </el-button>
        <span class="sr-only" role="status" aria-live="polite">
          {{ codeCopied ? $t('common.message.copied') : '' }}
        </span>
      </div>
      <p class="pairing-expiry">
        {{ $t('user.browserDevice.codeExpiresIn', { seconds: secondsRemaining }) }}
      </p>

      <template v-if="claim">
        <el-divider />
        <h3 class="claim-title">{{ $t('user.browserDevice.verifyClaimTitle') }}</h3>
        <p class="claim-hint">{{ $t('user.browserDevice.verifyClaimHint') }}</p>
        <dl class="claim-details">
          <div>
            <dt>{{ $t('user.browserDevice.keyFingerprint') }}</dt>
            <dd>
              <code>{{ claim.key_fingerprint }}</code>
            </dd>
          </div>
          <div>
            <dt>{{ $t('user.browserDevice.platform') }}</dt>
            <dd>{{ claim.platform }}</dd>
          </div>
          <div>
            <dt>{{ $t('user.browserDevice.extensionVersion') }}</dt>
            <dd>{{ claim.extension_version }}</dd>
          </div>
          <div>
            <dt>{{ $t('user.browserDevice.origin') }}</dt>
            <dd>
              <code>{{ claim.origin }}</code>
            </dd>
          </div>
        </dl>
        <el-input
          v-model.trim="deviceName"
          :placeholder="$t('user.browserDevice.namePlaceholder')"
          maxlength="128"
          show-word-limit
        />
      </template>

      <div v-else class="waiting-claim">
        <loading-icon class="waiting-icon" size="1em" aria-hidden="true" focusable="false" />
        <span>{{ $t('user.browserDevice.waitingForAgent') }}</span>
      </div>
    </template>

    <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" show-icon />

    <template #footer>
      <el-button v-if="!claim" @click="visible = false">{{ $t('common.button.cancel') }}</el-button>
      <el-button v-if="errorMessage && !claim" type="primary" :loading="loading" @click="startPairing">
        {{ $t('user.browserDevice.tryAgain') }}
      </el-button>
      <template v-if="claim">
        <el-button
          type="danger"
          plain
          :loading="decision === 'reject'"
          :disabled="decision !== null || decisionExpired"
          @click="reject"
        >
          {{ $t('user.browserDevice.rejectClaim') }}
        </el-button>
        <el-button
          type="primary"
          :loading="decision === 'confirm'"
          :disabled="decision !== null || decisionExpired"
          @click="confirm"
        >
          {{ $t('user.browserDevice.confirmClaim') }}
        </el-button>
      </template>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ElAlert, ElButton, ElDialog, ElDivider, ElInput, ElMessage, ElSkeleton } from 'element-plus';
import { CopyIcon, LoadingIcon, SuccessIcon } from '@acedatacloud/core/icons/components';
import { browserDeviceOperator } from '@/operators/browserDevice';
import { IBrowserDevice, IBrowserPairingChallenge, IBrowserPairingClaim } from '@/models/browserDevice';

let cachedChallenge: IBrowserPairingChallenge | null = null;

interface IData {
  visible: boolean;
  loading: boolean;
  polling: boolean;
  challenge: IBrowserPairingChallenge | null;
  claim: IBrowserPairingClaim | null;
  deviceName: string;
  errorMessage: string;
  nowMs: number;
  // `number`, not ReturnType<typeof setInterval> — Nexior's tsconfig pulls in
  // Node types, where that resolves to NodeJS.Timeout and clashes with the
  // browser's numeric handle.
  pollTimer: number | null;
  clockTimer: number | null;
  decision: 'confirm' | 'reject' | null;
  requestGeneration: number;
  codeCopied: boolean;
  codeCopiedTimer: number | null;
}

export default defineComponent({
  name: 'BrowserPairingDialog',
  components: { CopyIcon, ElAlert, ElButton, ElDialog, ElDivider, ElInput, ElSkeleton, LoadingIcon, SuccessIcon },
  props: {
    modelValue: { type: Boolean as PropType<boolean>, default: false }
  },
  emits: ['update:modelValue', 'paired', 'rejected', 'closed'],
  data(): IData {
    return {
      visible: this.modelValue,
      loading: false,
      polling: false,
      challenge: cachedChallenge?.expires_at_ms && cachedChallenge.expires_at_ms > Date.now() ? cachedChallenge : null,
      claim: null,
      deviceName: '',
      errorMessage: '',
      nowMs: Date.now(),
      pollTimer: null,
      clockTimer: null,
      decision: null,
      requestGeneration: 0,
      codeCopied: false,
      codeCopiedTimer: null
    };
  },
  computed: {
    secondsRemaining(): number {
      const expiresAt = this.claim?.expires_at_ms ?? this.challenge?.expires_at_ms;
      if (!expiresAt) return 0;
      return Math.max(0, Math.ceil((expiresAt - this.nowMs) / 1000));
    },
    decisionExpired(): boolean {
      return this.secondsRemaining === 0;
    }
  },
  watch: {
    modelValue(value: boolean) {
      this.visible = value;
      if (value) this.startPairing();
    },
    visible(value: boolean) {
      this.$emit('update:modelValue', value);
      if (value) this.startClock();
      else this.stopTimers();
    }
  },
  mounted() {
    if (this.visible) this.startPairing();
  },
  beforeUnmount() {
    this.stopTimers();
  },
  methods: {
    async startPairing() {
      if (this.loading) return;
      this.codeCopied = false;
      if (this.codeCopiedTimer !== null) {
        window.clearTimeout(this.codeCopiedTimer);
        this.codeCopiedTimer = null;
      }
      this.stopPolling();
      const generation = ++this.requestGeneration;
      this.loading = true;
      this.errorMessage = '';
      this.decision = null;
      try {
        this.startClock();
        if (!this.challenge || this.challenge.expires_at_ms <= Date.now()) {
          const { data } = await browserDeviceOperator.createPairingChallenge();
          if (!this.visible || generation !== this.requestGeneration) return;
          this.challenge = data;
          cachedChallenge = data;
          this.claim = null;
          this.deviceName = '';
        }
        this.nowMs = Date.now();
        await this.pollClaims();
        if (!this.claim && this.challenge && !this.errorMessage) {
          this.pollTimer = window.setInterval(() => this.pollClaims(), 1500);
        }
      } catch (error: unknown) {
        if (this.visible && generation === this.requestGeneration) {
          this.errorMessage = this.errorDetail(error, 'user.browserDevice.pairUnavailable');
        }
      } finally {
        if (generation === this.requestGeneration) this.loading = false;
      }
    },
    async pollClaims() {
      if (!this.challenge || this.polling || this.claim) return;
      const generation = this.requestGeneration;
      const challengeId = this.challenge.challenge_id;
      this.nowMs = Date.now();
      if (this.challenge.expires_at_ms <= this.nowMs) {
        this.errorMessage = String(this.$t('user.browserDevice.codeExpired'));
        this.stopPolling();
        return;
      }
      this.polling = true;
      try {
        const { data } = await browserDeviceOperator.listPendingClaims();
        if (!this.visible || generation !== this.requestGeneration || this.challenge?.challenge_id !== challengeId) {
          return;
        }
        const exactClaim = data.find((claim) => claim.challenge_id === challengeId);
        if (exactClaim) {
          this.claim = exactClaim;
          this.stopPolling();
        }
      } catch (error: unknown) {
        if (this.visible && generation === this.requestGeneration) {
          this.errorMessage = this.errorDetail(error, 'user.browserDevice.pollFailed');
          this.stopPolling();
        }
      } finally {
        if (generation === this.requestGeneration) this.polling = false;
      }
    },
    async copyCode() {
      if (!this.challenge) return;
      try {
        await navigator.clipboard.writeText(this.challenge.code);
        this.codeCopied = true;
        if (this.codeCopiedTimer !== null) window.clearTimeout(this.codeCopiedTimer);
        this.codeCopiedTimer = window.setTimeout(() => {
          this.codeCopied = false;
          this.codeCopiedTimer = null;
        }, 3000);
      } catch {
        ElMessage.error(this.$t('common.message.copyFailed'));
      }
    },
    async confirm() {
      const claim = this.claim;
      if (!claim || this.decision || this.decisionExpired) return;
      const generation = this.requestGeneration;
      const claimId = claim.claim_id;
      this.decision = 'confirm';
      try {
        const { data } = await browserDeviceOperator.confirmClaim(
          claim.claim_id,
          claim.key_fingerprint,
          this.deviceName || undefined
        );
        if (!this.visible || generation !== this.requestGeneration || this.claim?.claim_id !== claimId) return;
        ElMessage.success(this.$t('user.browserDevice.pairSuccess'));
        this.$emit('paired', data.device as IBrowserDevice);
        this.challenge = null;
        cachedChallenge = null;
        this.claim = null;
        this.visible = false;
      } catch (error: unknown) {
        if (this.visible && generation === this.requestGeneration && this.claim?.claim_id === claimId) {
          this.errorMessage = this.errorDetail(error, 'user.browserDevice.decisionFailed');
        }
      } finally {
        if (generation === this.requestGeneration && this.claim?.claim_id === claimId) this.decision = null;
      }
    },
    async reject() {
      const claim = this.claim;
      if (!claim || this.decision || this.decisionExpired) return;
      const generation = this.requestGeneration;
      const claimId = claim.claim_id;
      this.decision = 'reject';
      try {
        await browserDeviceOperator.rejectClaim(claim.claim_id, claim.key_fingerprint);
        if (!this.visible || generation !== this.requestGeneration || this.claim?.claim_id !== claimId) return;
        ElMessage.success(this.$t('user.browserDevice.rejectSuccess'));
        this.$emit('rejected', claim);
        this.challenge = null;
        cachedChallenge = null;
        this.claim = null;
        this.visible = false;
      } catch (error: unknown) {
        if (this.visible && generation === this.requestGeneration && this.claim?.claim_id === claimId) {
          this.errorMessage = this.errorDetail(error, 'user.browserDevice.decisionFailed');
        }
      } finally {
        if (generation === this.requestGeneration && this.claim?.claim_id === claimId) this.decision = null;
      }
    },
    errorDetail(error: unknown, fallbackKey: string): string {
      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      return detail || String(this.$t(fallbackKey));
    },
    stopPolling() {
      if (this.pollTimer !== null) {
        window.clearInterval(this.pollTimer);
        this.pollTimer = null;
      }
    },
    startClock() {
      this.nowMs = Date.now();
      if (this.clockTimer === null) {
        this.clockTimer = window.setInterval(() => {
          this.nowMs = Date.now();
          if (this.secondsRemaining === 0) this.stopPolling();
        }, 1000);
      }
    },
    stopTimers() {
      this.stopPolling();
      if (this.clockTimer !== null) {
        window.clearInterval(this.clockTimer);
        this.clockTimer = null;
      }
      if (this.codeCopiedTimer !== null) {
        window.clearTimeout(this.codeCopiedTimer);
        this.codeCopiedTimer = null;
      }
      this.codeCopied = false;
    },
    onClosed() {
      this.requestGeneration += 1;
      this.stopTimers();
      this.loading = false;
      this.polling = false;
      this.errorMessage = '';
      this.decision = null;
      this.$emit('closed');
    }
  }
});
</script>

<style lang="scss" scoped>
.pairing-alert {
  margin-bottom: 18px;
}
.pairing-loading {
  padding: 12px 0;
}
.waiting-icon {
  animation: pairing-spin 1s linear infinite;
}
@keyframes pairing-spin {
  to {
    transform: rotate(360deg);
  }
}
.pairing-intro,
.claim-hint {
  margin: 0 0 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}
.pairing-code-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.pairing-code {
  flex: 1;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0;
  text-align: center;
}
.pairing-expiry {
  margin: 8px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  text-align: center;
}
.waiting-claim {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 88px;
  color: var(--el-text-color-secondary);
}
.claim-title {
  margin: 0 0 8px;
  font-size: 16px;
}
.claim-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 20px;
  margin: 16px 0;
}
.claim-details div {
  min-width: 0;
}
.claim-details dt {
  margin-bottom: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.claim-details dd {
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--el-text-color-primary);
  font-size: 13px;
}
@media (max-width: 640px) {
  .pairing-code-row {
    align-items: stretch;
    flex-direction: column;
  }
  .pairing-code {
    font-size: 20px;
  }
  .claim-details {
    grid-template-columns: 1fr;
  }
}
</style>
