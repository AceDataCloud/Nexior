<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <!-- Step 1 — the face that will do the talking -->
      <section ref="face" class="field-block mb-6">
        <div class="field-head">
          <h2 class="field-title font-bold">{{ $t('digitalhuman.name.step1') }}</h2>
          <span v-if="isMissing('face')" class="required-badge">{{ $t('digitalhuman.name.required') }}</span>
          <info-icon :content="$t('digitalhuman.description.step1')" class="ml-1" />
        </div>
        <el-radio-group v-model="faceMode" class="mode-switch mb-3" @change="onFaceModeChange">
          <el-radio-button value="video">{{ $t('digitalhuman.name.faceModeVideo') }}</el-radio-button>
          <el-radio-button value="photo">{{ $t('digitalhuman.name.faceModePhoto') }}</el-radio-button>
        </el-radio-group>
        <media-input
          v-if="faceMode === 'video'"
          kind="video"
          :accept="DIGITALHUMAN_VIDEO_ACCEPT"
          :button-text="$t('digitalhuman.button.uploadFaceVideo')"
          :hint="$t('digitalhuman.message.faceVideoHint')"
          @change="onFaceVideoChange"
        />
        <media-input
          v-else
          kind="image"
          :accept="DIGITALHUMAN_IMAGE_ACCEPT"
          :button-text="$t('digitalhuman.button.uploadFacePhoto')"
          :hint="$t('digitalhuman.message.facePhotoHint')"
          @change="onFacePhotoChange"
        />
      </section>

      <!-- Step 2 — the voice that face will speak with -->
      <section ref="voice" class="field-block mb-6">
        <div class="field-head">
          <h2 class="field-title font-bold">{{ $t('digitalhuman.name.step2') }}</h2>
          <span v-if="isMissing('text') || isMissing('timbre') || isMissing('audio')" class="required-badge">
            {{ $t('digitalhuman.name.required') }}
          </span>
          <info-icon :content="$t('digitalhuman.description.step2')" class="ml-1" />
        </div>
        <el-radio-group v-model="voiceMode" class="mode-switch mb-3" @change="onVoiceModeChange">
          <el-radio-button value="text">{{ $t('digitalhuman.name.voiceModeText') }}</el-radio-button>
          <el-radio-button value="audio">{{ $t('digitalhuman.name.voiceModeAudio') }}</el-radio-button>
        </el-radio-group>

        <template v-if="voiceMode === 'text'">
          <prompt-textarea
            v-model="text"
            class="mb-3"
            :title="$t('digitalhuman.name.speech')"
            :placeholder="$t('digitalhuman.placeholder.speech')"
            :min-rows="5"
            :max-rows="14"
          />
          <timbre-selector v-model="voiceId" />
        </template>
        <media-input
          v-else
          kind="audio"
          :accept="DIGITALHUMAN_AUDIO_ACCEPT"
          :button-text="$t('digitalhuman.button.uploadSpeechAudio')"
          :hint="$t('digitalhuman.message.audioHint')"
          @change="onAudioChange"
        />
      </section>

      <el-collapse v-model="advancedOpen" class="advanced">
        <el-collapse-item name="advanced" :title="$t('digitalhuman.name.advanced')">
          <div class="field-row">
            <div class="field-head">
              <h2 class="field-title font-bold">{{ $t('digitalhuman.name.speed') }}</h2>
              <info-icon :content="$t('digitalhuman.description.speed')" class="ml-1" />
            </div>
            <el-input-number
              v-model="speed"
              class="field-control"
              :min="0.5"
              :max="2"
              :step="0.1"
              :precision="1"
              controls-position="right"
            />
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <p v-if="missing.length > 0" class="hint-missing">
        <warning-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ missing[0].message }}
      </p>
      <scenario-payment-mode scenario="digitalhuman" />
      <consumption v-if="!walletMode" :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round @click="onGenerate">
        <magic-icon class="mr-2" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('digitalhuman.button.generateVideo') }}
      </el-button>
      <p class="hint-eta">{{ $t('digitalhuman.message.eta') }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { MagicIcon, WarningIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import {
  ElButton,
  ElCollapse,
  ElCollapseItem,
  ElInputNumber,
  ElMessage,
  ElRadioButton,
  ElRadioGroup
} from 'element-plus';
import Consumption from '../common/Consumption.vue';
import InfoIcon from '@/components/common/InfoIcon.vue';
import PromptTextarea from '@/components/common/PromptTextarea.vue';
import MediaInput from './config/MediaInput.vue';
import TimbreSelector from './config/TimbreSelector.vue';
import { getConsumption } from '@/utils';
import { DIGITALHUMAN_AUDIO_ACCEPT, DIGITALHUMAN_IMAGE_ACCEPT, DIGITALHUMAN_VIDEO_ACCEPT } from '@/constants';
import { IDigitalHumanConfig } from '@/models';
import ScenarioPaymentMode from '../common/ScenarioPaymentMode.vue';
import { isScenarioX402Enabled, scenarioPaymentState } from '@/utils/x402/scenarioPayment';
import { buildDigitalHumanVideoRequest, digitalHumanOperator } from '@/operators/digitalhuman';

interface IMissing {
  key: string;
  message: string;
}

interface IData {
  faceMode: 'video' | 'photo';
  voiceMode: 'audio' | 'text';
  advancedOpen: string[];
  DIGITALHUMAN_VIDEO_ACCEPT: string;
  DIGITALHUMAN_IMAGE_ACCEPT: string;
  DIGITALHUMAN_AUDIO_ACCEPT: string;
  quoteTimer: number;
  quoteRunId: number;
}

export default defineComponent({
  name: 'ConfigPanel',
  components: {
    Consumption,
    ElButton,
    ElCollapse,
    ElCollapseItem,
    ElInputNumber,
    ElRadioButton,
    ElRadioGroup,
    InfoIcon,
    MagicIcon,
    MediaInput,
    PromptTextarea,
    TimbreSelector,
    WarningIcon,
    ScenarioPaymentMode
  },
  emits: ['generate'],
  data(): IData {
    return {
      faceMode: 'video',
      voiceMode: 'text',
      advancedOpen: [],
      DIGITALHUMAN_VIDEO_ACCEPT,
      DIGITALHUMAN_IMAGE_ACCEPT,
      DIGITALHUMAN_AUDIO_ACCEPT,
      quoteTimer: 0,
      quoteRunId: 0
    };
  },
  computed: {
    config(): IDigitalHumanConfig | undefined {
      return this.$store.state.digitalhuman?.config;
    },
    service() {
      return this.$store.state.digitalhuman?.service;
    },
    consumption() {
      return getConsumption(this.config, this.service?.cost);
    },
    /**
     * Everything still standing between the user and a generation, in the
     * order they should fix it. A plain boolean cannot say WHAT is missing,
     * which is the whole problem with a silently disabled button.
     */
    missing(): IMissing[] {
      const out: IMissing[] = [];
      const faceOk = this.faceMode === 'video' ? !!this.config?.video_url : !!this.config?.image_url;
      if (!faceOk) {
        out.push({ key: 'face', message: this.$t('digitalhuman.message.missingFace') as string });
      }
      if (this.voiceMode === 'text') {
        if (!this.config?.text?.trim()) {
          out.push({ key: 'text', message: this.$t('digitalhuman.message.missingText') as string });
        }
        if (!this.config?.voice_id) {
          out.push({ key: 'timbre', message: this.$t('digitalhuman.message.missingTimbre') as string });
        }
      } else if (!this.config?.audio_url) {
        out.push({ key: 'audio', message: this.$t('digitalhuman.message.missingAudio') as string });
      }
      return out;
    },
    text: {
      get(): string | undefined {
        return this.config?.text;
      },
      set(val: string) {
        this.update({ text: val });
      }
    },
    voiceId: {
      get(): string | undefined {
        return this.config?.voice_id;
      },
      set(val: string | undefined) {
        this.update({ voice_id: val });
      }
    },
    speed: {
      get(): number {
        return this.config?.speed ?? 1;
      },
      set(val: number) {
        this.update({ speed: val });
      }
    },
    walletMode(): boolean {
      return isScenarioX402Enabled() && scenarioPaymentState('digitalhuman').mode === 'wallet';
    }
  },
  watch: {
    walletMode: {
      handler(enabled: boolean) {
        if (enabled) this.scheduleQuote();
      },
      immediate: true
    },
    config: {
      handler() {
        if (this.walletMode) this.scheduleQuote();
      },
      deep: true
    },
    faceMode() {
      if (this.walletMode) this.scheduleQuote();
    },
    voiceMode() {
      if (this.walletMode) this.scheduleQuote();
    }
  },
  mounted() {
    // restore the UI mode from any persisted config
    if (this.config?.image_url && !this.config?.video_url) {
      this.faceMode = 'photo';
    }
    if (this.config?.audio_url) {
      this.voiceMode = 'audio';
    }
  },
  beforeUnmount() {
    window.clearTimeout(this.quoteTimer);
    this.quoteRunId += 1;
  },
  methods: {
    scheduleQuote() {
      window.clearTimeout(this.quoteTimer);
      this.quoteTimer = window.setTimeout(this.refreshQuote, 350);
    },
    async refreshQuote() {
      const state = scenarioPaymentState('digitalhuman');
      const runId = ++this.quoteRunId;
      state.quoteLoading = true;
      state.quoteUsdc = undefined;
      try {
        const request = buildDigitalHumanVideoRequest(this.config, this.faceMode, this.voiceMode);
        const quote = await digitalHumanOperator.quote(request);
        if (runId === this.quoteRunId && state.mode === 'wallet') state.quoteUsdc = quote.amountUsdc;
      } catch (error) {
        console.warn('x402 quote failed', error);
      } finally {
        if (runId === this.quoteRunId) state.quoteLoading = false;
      }
    },
    isMissing(key: string): boolean {
      return this.missing.some((item) => item.key === key);
    },
    update(patch: Partial<IDigitalHumanConfig>) {
      this.$store.commit('digitalhuman/setConfig', {
        ...this.config,
        ...patch
      });
    },
    onFaceModeChange(mode: string | number | boolean | undefined) {
      // keep only the active face field so the request never carries both
      this.update(mode === 'video' ? { image_url: undefined } : { video_url: undefined });
    },
    onVoiceModeChange(mode: string | number | boolean | undefined) {
      this.update(mode === 'audio' ? { text: undefined, voice_id: undefined } : { audio_url: undefined });
    },
    onFaceVideoChange(url: string | undefined) {
      this.update({ video_url: url });
    },
    onFacePhotoChange(url: string | undefined) {
      this.update({ image_url: url });
    },
    onAudioChange(url: string | undefined) {
      this.update({ audio_url: url });
    },
    onGenerate() {
      const blocker = this.missing[0];
      if (blocker) {
        // A disabled button cannot answer "why?" — say what is missing and
        // take the user to it.
        ElMessage.warning(blocker.message);
        const anchor = blocker.key === 'face' ? 'face' : 'voice';
        (this.$refs[anchor] as HTMLElement | undefined)?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
        return;
      }
      this.$emit('generate', buildDigitalHumanVideoRequest(this.config, this.faceMode, this.voiceMode));
    }
  }
});
</script>

<style lang="scss" scoped>
.field-head {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.field-title {
  font-size: 14px;
  margin: 0;
}
.field-block > .field-head {
  margin-bottom: 8px;
}
.field-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
.field-control {
  width: 140px;
}

// Equal-width halves so the pair reads as one either/or control.
.mode-switch {
  display: flex;
  width: 100%;
  :deep(.el-radio-button) {
    flex: 1;
  }
  :deep(.el-radio-button__inner) {
    width: 100%;
  }
}

.required-badge {
  margin-left: 6px;
  padding: 0 6px;
  font-size: 11px;
  line-height: 16px;
  border-radius: 8px;
  color: var(--el-color-warning);
  background-color: var(--el-color-warning-light-9);
  border: 1px solid var(--el-color-warning-light-7);
}

.hint-missing {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 1.4;
  text-align: center;
  color: var(--el-color-warning);
}

.hint-eta {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.4;
  text-align: center;
  color: var(--el-text-color-secondary);
}

.advanced {
  border-top: none;
  border-bottom: none;
  :deep(.el-collapse-item__header) {
    font-size: 14px;
    font-weight: bold;
    border-bottom: none;
  }
  :deep(.el-collapse-item__wrap) {
    border-bottom: none;
  }
}
</style>
