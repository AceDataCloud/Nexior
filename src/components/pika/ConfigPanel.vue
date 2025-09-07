<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-[15px]">
      <prompt-input class="mb-4" />
      <model-selector class="mb-4" />
      <ingredients-selector class="mb-4" />
      <effect-selector class="mb-4" />
      <image-url-input v-if="config?.ingredients" class="mb-4" />
      <ingredients-model-selector v-if="config?.ingredients" class="mb-4" />
    </div>
    <div class="flex flex-col items-center justify-center px-[15px] pb-[15px]">
      <consumption :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round @click="onGenerate">
        <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
        {{ $t('pika.button.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import IngredientsSelector from './config/IngredientsSelector.vue';
import EffectSelector from './config/EffectSelector.vue';
import IngredientsModelSelector from './config/IngredientsModelSelector.vue';
import ModelSelector from './config/ModelSelector.vue';
import ImageUrlInput from './config/ImageUrlInput.vue';
import PromptInput from './config/PromptInput.vue';
import Consumption from '../common/Consumption.vue';
import { getConsumption } from '@/utils';
export default defineComponent({
  name: 'PresetPanel',
  components: {
    ImageUrlInput,
    ElButton,
    FontAwesomeIcon,
    Consumption,
    PromptInput,
    IngredientsSelector,
    IngredientsModelSelector,
    ModelSelector,
    EffectSelector
  },
  emits: ['generate'],
  computed: {
    config() {
      return this.$store.state.pika?.config;
    },
    consumption() {
      return getConsumption(this.config, this.service?.metadata?.price);
    },
    service() {
      return this.$store.state.pika?.service;
    }
  },
  methods: {
    onGenerate() {
      this.$emit('generate');
    }
  }
});
</script>
