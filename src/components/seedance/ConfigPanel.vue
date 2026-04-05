<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <prompt-input class="mb-4" />
      <model-selector class="mb-4" />
      <duration-selector class="mb-4" />
      <generate-audio-switch class="mb-4" />
      <service-tier-selector class="mb-4" />
      <return-last-frame-switch class="mb-4" />
      <first-frame-image class="mb-2" />
      <last-frame-image class="mb-2" />
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <consumption :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round @click="onGenerate">
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('seedance.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import PromptInput from './config/PromptInput.vue';
import ModelSelector from './config/ModelSelector.vue';
import DurationSelector from './config/DurationSelector.vue';
import GenerateAudioSwitch from './config/GenerateAudioSwitch.vue';
import FirstFrameImage from './config/FirstFrameImage.vue';
import LastFrameImage from './config/LastFrameImage.vue';
import ServiceTierSelector from './config/ServiceTierSelector.vue';
import ReturnLastFrameSwitch from './config/ReturnLastFrameSwitch.vue';
import Consumption from '../common/Consumption.vue';
import { getConsumption } from '@/utils';

export default defineComponent({
  name: 'SeedanceConfigPanel',
  components: {
    ElButton,
    FontAwesomeIcon,
    PromptInput,
    ModelSelector,
    DurationSelector,
    GenerateAudioSwitch,
    ServiceTierSelector,
    ReturnLastFrameSwitch,
    FirstFrameImage,
    LastFrameImage,
    Consumption
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.seedance?.config;
    },
    consumption() {
      return getConsumption(this.config, this.service?.cost);
    },
    service() {
      return this.$store.state.seedance?.service;
    }
  },
  methods: {
    onGenerate() {
      this.$emit('generate');
    }
  }
});
</script>
