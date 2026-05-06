<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <prompt-input class="mb-4" @open-inspiration="inspirationOpen = true" />
      <model-selector class="mb-4" />
      <ratio-selector class="mb-4" />
      <start-image class="mb-2" />
      <end-image class="mb-2" />
      <duration-selector class="mb-4" />
      <mode-selector class="mb-4" />
      <generate-audio-selector class="mb-4" />
      <camera-control-selector class="mb-4" />
      <cfg-scale-selector class="mb-4" />
      <negative-prompt-input class="mb-4" />
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <summary-chip />
      <consumption :value="consumption" :service="service" />
      <el-button
        v-if="config?.video_url !== undefined || config?.custom"
        type="primary"
        class="btn w-full"
        round
        @click="onGenerate"
      >
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('kling.button.extend') }}
      </el-button>
      <el-button v-else type="primary" class="btn w-full" round @click="onGenerate">
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('kling.button.generate') }}
      </el-button>
    </div>
    <inspiration-drawer v-model="inspirationOpen" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import ModelSelector from './config/ModelSelector.vue';
import ModeSelector from './config/ModeSelector.vue';
import DurationSelector from './config/DurationSelector.vue';
import RatioSelector from './config/RatioSelector.vue';
import StartImage from './config/StartImage.vue';
import EndImage from './config/EndImage.vue';
import Consumption from '../common/Consumption.vue';
import CfgScaleSelector from './config/CfgScaleSelector.vue';
import GenerateAudioSelector from './config/GenerateAudioSelector.vue';
import CameraControlSelector from './config/CameraControlSelector.vue';
import PromptInput from './config/PromptInput.vue';
import NegativePromptInput from './config/NegativePromptInput.vue';
import InspirationDrawer from './inspiration/InspirationDrawer.vue';
import SummaryChip from './SummaryChip.vue';
import { getConsumption } from '@/utils';

export default defineComponent({
  name: 'ConfigPanel',
  components: {
    ElButton,
    Consumption,
    FontAwesomeIcon,
    PromptInput,
    NegativePromptInput,
    ModelSelector,
    ModeSelector,
    DurationSelector,
    RatioSelector,
    StartImage,
    CfgScaleSelector,
    GenerateAudioSelector,
    CameraControlSelector,
    InspirationDrawer,
    SummaryChip,
    EndImage
  },
  emits: ['generate'],
  data() {
    return {
      inspirationOpen: false
    };
  },
  computed: {
    config() {
      return this.$store.state.kling?.config;
    },
    consumption() {
      return getConsumption(this.config, this.service?.cost);
    },
    service() {
      return this.$store.state.kling?.service;
    }
  },
  methods: {
    onGenerate() {
      this.$emit('generate');
    }
  }
});
</script>
