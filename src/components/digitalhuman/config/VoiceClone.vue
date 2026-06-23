<template>
  <div class="voice-clone">
    <p class="text-xs text-[var(--el-text-color-secondary)] mb-2">{{ $t('digitalhuman.description.voiceClone') }}</p>
    <div class="flex flex-row items-center gap-2 mb-2">
      <file-input
        :accept="DIGITALHUMAN_AUDIO_ACCEPT"
        :button-text="$t('digitalhuman.button.uploadSample')"
        icon="fa-solid fa-microphone"
        @change="onSampleChange"
      />
      <el-select v-model="lang" size="small" class="!w-[90px]">
        <el-option v-for="l in DIGITALHUMAN_ALLOWED_LANGS" :key="l" :label="l" :value="l" />
      </el-select>
    </div>
    <el-button size="small" type="primary" round :loading="cloning" :disabled="!sampleUrl || cloning" @click="onClone">
      <font-awesome-icon icon="fa-solid fa-wand-magic-sparkles" class="mr-1" />
      {{ cloning ? $t('digitalhuman.button.cloning') : $t('digitalhuman.button.clone') }}
    </el-button>

    <el-alert v-if="voiceId" :closable="false" type="success" class="mt-2">
      <p class="text-xs mb-0">
        <font-awesome-icon icon="fa-solid fa-check" class="mr-1" />
        {{ $t('digitalhuman.name.voiceReady') }}: {{ voiceId }}
      </p>
    </el-alert>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElSelect, ElOption, ElAlert, ElMessage } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import FileInput from './FileInput.vue';
import { digitalHumanOperator } from '@/operators';
import { DIGITALHUMAN_ALLOWED_LANGS, DIGITALHUMAN_AUDIO_ACCEPT, DIGITALHUMAN_DEFAULT_LANG } from '@/constants';
import { IDigitalHumanLang } from '@/models';

const POLL_INTERVAL = 3000;
const POLL_MAX = 60;

interface IData {
  sampleUrl: string | undefined;
  lang: IDigitalHumanLang;
  cloning: boolean;
  destroyed: boolean;
  runId: number;
  DIGITALHUMAN_ALLOWED_LANGS: string[];
  DIGITALHUMAN_AUDIO_ACCEPT: string;
}

export default defineComponent({
  name: 'VoiceClone',
  components: {
    ElButton,
    ElSelect,
    ElOption,
    ElAlert,
    FileInput,
    FontAwesomeIcon
  },
  data(): IData {
    return {
      sampleUrl: undefined,
      lang: DIGITALHUMAN_DEFAULT_LANG as IDigitalHumanLang,
      cloning: false,
      destroyed: false,
      runId: 0,
      DIGITALHUMAN_ALLOWED_LANGS,
      DIGITALHUMAN_AUDIO_ACCEPT
    };
  },
  computed: {
    credentialToken(): string | undefined {
      return this.$store.state.digitalhuman?.credential?.token;
    },
    voiceId(): string | undefined {
      return this.$store.state.digitalhuman?.config?.voice_id;
    }
  },
  watch: {
    // a different language invalidates a voice cloned from the previous setting
    lang() {
      this.invalidate();
    }
  },
  beforeUnmount() {
    this.destroyed = true;
    this.runId++;
  },
  methods: {
    onSampleChange(url: string | undefined) {
      this.sampleUrl = url;
      // a new sample invalidates any prior / in-flight clone so we never submit a stale voice
      this.invalidate();
    },
    invalidate() {
      this.runId++;
      this.cloning = false;
      if (this.voiceId) {
        this.setVoiceId(undefined);
      }
    },
    isStale(runId: number): boolean {
      return this.destroyed || runId !== this.runId;
    },
    setVoiceId(voiceId: string | undefined) {
      this.$store.commit('digitalhuman/setConfig', {
        ...this.$store.state.digitalhuman?.config,
        voice_id: voiceId
      });
    },
    sleep(ms: number): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },
    async onClone() {
      const token = this.credentialToken;
      if (!this.sampleUrl || !token) {
        return;
      }
      const runId = ++this.runId;
      this.cloning = true;
      this.setVoiceId(undefined);
      try {
        const { data } = await digitalHumanOperator.cloneVoice(
          { audio_url: this.sampleUrl, lang: this.lang },
          { token }
        );
        if (this.isStale(runId)) {
          return;
        }
        if (data?.voice_id) {
          this.onCloned(data.voice_id);
          return;
        }
        if (data?.task_id) {
          await this.pollVoice(data.task_id, token, runId);
        } else {
          throw new Error('no task');
        }
      } catch (_e) {
        if (!this.isStale(runId)) {
          ElMessage.error(this.$t('digitalhuman.message.voiceCloneFailed'));
        }
      } finally {
        if (!this.isStale(runId)) {
          this.cloning = false;
        }
      }
    },
    async pollVoice(taskId: string, token: string, runId: number) {
      for (let i = 0; i < POLL_MAX; i++) {
        if (this.isStale(runId)) {
          return;
        }
        await this.sleep(POLL_INTERVAL);
        if (this.isStale(runId)) {
          return;
        }
        const { data } = await digitalHumanOperator.pollTask(taskId, { token });
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
    onCloned(voiceId: string) {
      this.setVoiceId(voiceId);
      ElMessage.success(this.$t('digitalhuman.message.voiceCloneSuccess'));
    }
  }
});
</script>
