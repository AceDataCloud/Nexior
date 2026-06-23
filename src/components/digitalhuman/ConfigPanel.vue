<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <!-- Face source -->
      <div class="mb-4">
        <span class="text-sm font-bold mb-2 block">{{ $t('digitalhuman.name.face') }}</span>
        <el-radio-group v-model="faceMode" class="w-full mb-2" @change="onFaceModeChange">
          <el-radio-button value="video">{{ $t('digitalhuman.name.faceVideo') }}</el-radio-button>
          <el-radio-button value="photo">{{ $t('digitalhuman.name.facePhoto') }}</el-radio-button>
        </el-radio-group>
        <file-input
          v-if="faceMode === 'video'"
          :accept="DIGITALHUMAN_VIDEO_ACCEPT"
          :button-text="$t('digitalhuman.button.uploadVideo')"
          icon="fa-solid fa-film"
          @change="onFaceVideoChange"
        />
        <file-input
          v-else
          :accept="DIGITALHUMAN_IMAGE_ACCEPT"
          :button-text="$t('digitalhuman.button.uploadPhoto')"
          icon="fa-solid fa-image"
          @change="onFacePhotoChange"
        />
        <p class="text-xs text-[var(--el-text-color-secondary)] mt-1">{{ $t('digitalhuman.description.face') }}</p>
      </div>

      <!-- Voice source -->
      <div class="mb-4">
        <span class="text-sm font-bold mb-2 block">{{ $t('digitalhuman.name.voice') }}</span>
        <el-radio-group v-model="voiceMode" class="w-full mb-2" @change="onVoiceModeChange">
          <el-radio-button value="audio">{{ $t('digitalhuman.name.voiceAudio') }}</el-radio-button>
          <el-radio-button value="text">{{ $t('digitalhuman.name.voiceText') }}</el-radio-button>
        </el-radio-group>

        <file-input
          v-if="voiceMode === 'audio'"
          :accept="DIGITALHUMAN_AUDIO_ACCEPT"
          :button-text="$t('digitalhuman.button.uploadAudio')"
          icon="fa-solid fa-music"
          @change="onAudioChange"
        />
        <template v-else>
          <el-input
            v-model="text"
            type="textarea"
            :rows="4"
            :placeholder="$t('digitalhuman.placeholder.text')"
            class="mb-2"
          />
          <voice-clone />
        </template>
      </div>

      <!-- Engine -->
      <div class="mb-4">
        <span class="text-sm font-bold mb-2 block">{{ $t('digitalhuman.name.engine') }}</span>
        <el-radio-group v-model="engine" class="w-full">
          <el-radio-button v-for="e in DIGITALHUMAN_ALLOWED_ENGINES" :key="e" :value="e">{{ e }}</el-radio-button>
        </el-radio-group>
      </div>

      <!-- Resolution -->
      <div class="mb-4">
        <span class="text-sm font-bold mb-2 block">{{ $t('digitalhuman.name.resolution') }}</span>
        <el-radio-group v-model="resolution" class="w-full">
          <el-radio-button v-for="r in DIGITALHUMAN_ALLOWED_RESOLUTIONS" :key="r" :value="r">{{ r }}</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <consumption :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round :disabled="!canGenerate" @click="onGenerate">
        <font-awesome-icon icon="fa-solid fa-user" class="mr-2" />
        {{ $t('digitalhuman.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElInput, ElRadioGroup, ElRadioButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import Consumption from '../common/Consumption.vue';
import FileInput from './config/FileInput.vue';
import VoiceClone from './config/VoiceClone.vue';
import { getConsumption } from '@/utils';
import {
  DIGITALHUMAN_ALLOWED_ENGINES,
  DIGITALHUMAN_ALLOWED_RESOLUTIONS,
  DIGITALHUMAN_VIDEO_ACCEPT,
  DIGITALHUMAN_IMAGE_ACCEPT,
  DIGITALHUMAN_AUDIO_ACCEPT,
  DIGITALHUMAN_DEFAULT_ENGINE,
  DIGITALHUMAN_DEFAULT_RESOLUTION
} from '@/constants';
import { IDigitalHumanConfig, IDigitalHumanGenerateRequest } from '@/models';

interface IData {
  faceMode: 'video' | 'photo';
  voiceMode: 'audio' | 'text';
  DIGITALHUMAN_ALLOWED_ENGINES: string[];
  DIGITALHUMAN_ALLOWED_RESOLUTIONS: string[];
  DIGITALHUMAN_VIDEO_ACCEPT: string;
  DIGITALHUMAN_IMAGE_ACCEPT: string;
  DIGITALHUMAN_AUDIO_ACCEPT: string;
}

export default defineComponent({
  name: 'ConfigPanel',
  components: {
    ElButton,
    ElInput,
    ElRadioGroup,
    ElRadioButton,
    Consumption,
    FileInput,
    VoiceClone,
    FontAwesomeIcon
  },
  emits: ['generate'],
  data(): IData {
    return {
      faceMode: 'video',
      voiceMode: 'audio',
      DIGITALHUMAN_ALLOWED_ENGINES,
      DIGITALHUMAN_ALLOWED_RESOLUTIONS,
      DIGITALHUMAN_VIDEO_ACCEPT,
      DIGITALHUMAN_IMAGE_ACCEPT,
      DIGITALHUMAN_AUDIO_ACCEPT
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
    canGenerate(): boolean {
      const faceOk = this.faceMode === 'video' ? !!this.config?.video_url : !!this.config?.image_url;
      const voiceOk =
        this.voiceMode === 'audio' ? !!this.config?.audio_url : !!this.config?.text?.trim() && !!this.config?.voice_id;
      return faceOk && voiceOk;
    },
    text: {
      get(): string | undefined {
        return this.config?.text;
      },
      set(val: string) {
        this.update({ text: val });
      }
    },
    engine: {
      get(): string | undefined {
        return this.config?.engine;
      },
      set(val: string) {
        this.update({ engine: val as IDigitalHumanConfig['engine'] });
      }
    },
    resolution: {
      get(): string | undefined {
        return this.config?.resolution;
      },
      set(val: string) {
        this.update({ resolution: val as IDigitalHumanConfig['resolution'] });
      }
    }
  },
  mounted() {
    // restore the UI mode from any persisted config, then seed option defaults
    if (this.config?.image_url && !this.config?.video_url) {
      this.faceMode = 'photo';
    }
    if (this.config?.text || this.config?.voice_id) {
      this.voiceMode = 'text';
    }
    this.update({
      engine: this.config?.engine ?? (DIGITALHUMAN_DEFAULT_ENGINE as IDigitalHumanConfig['engine']),
      resolution: this.config?.resolution ?? (DIGITALHUMAN_DEFAULT_RESOLUTION as IDigitalHumanConfig['resolution'])
    });
  },
  methods: {
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
      // build a clean request from the active modes only — never leak the
      // inactive face/voice fields into the payload
      const c = this.config || {};
      const request: IDigitalHumanGenerateRequest = {
        engine: c.engine,
        resolution: c.resolution
      };
      if (this.faceMode === 'video') {
        request.video_url = c.video_url;
      } else {
        request.image_url = c.image_url;
      }
      if (this.voiceMode === 'audio') {
        request.audio_url = c.audio_url;
      } else {
        request.text = c.text;
        request.voice_id = c.voice_id;
      }
      this.$emit('generate', request);
    }
  }
});
</script>
