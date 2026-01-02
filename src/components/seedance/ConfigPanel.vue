<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-[15px]">
      <prompt-input class="mb-4" />
      <model-selector class="mb-4" />
      <service-tier-selector class="mb-4" />
      <return-last-frame-switch class="mb-4" />
      <first-frame-image class="mb-2" />
      <last-frame-image class="mb-2" />
    </div>
    <div class="flex flex-col items-center justify-center px-[15px] pb-[15px]">
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

