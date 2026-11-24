<template>
  <div class="advanced-options">
    <div v-if="capabilities.layerDecomposition" class="field">
      <div class="label">
        <h2 class="title font-bold">{{ $t('seedream.name.mode') }}</h2>
      </div>
      <el-select v-model="mode" class="value">
        <el-option :label="$t('seedream.mode.image')" value="image" />
        <el-option :label="$t('seedream.mode.layers')" value="layers" />
      </el-select>
    </div>
    <div v-if="seedream55 && mode === 'layers'" class="field">
      <div class="label">
        <h2 class="title font-bold">{{ $t('seedream.name.maxImages') }}</h2>
      </div>
      <el-input-number v-model="maxLayerImages" :min="2" :max="100" :step-strictly="true" class="value" />
    </div>
    <div v-if="seedream55 && mode === 'layers'" class="field">
      <div class="label">
        <h2 class="title font-bold">OCR</h2>
      </div>
      <el-switch v-model="textRecognition" aria-label="OCR" />
    </div>
    <div v-if="capabilities.transparentBackground && mode === 'image' && (seedream55 || hasSingleImage)" class="field">
      <div class="label">
        <h2 class="title font-bold">{{ $t('seedream.name.background') }}</h2>
      </div>
      <el-select v-model="background" class="value" clearable>
        <el-option :label="$t('seedream.background.opaque')" value="opaque" />
        <el-option :label="$t('seedream.background.transparent')" value="transparent" />
      </el-select>
    </div>
    <div v-if="capabilities.promptOptimization.length" class="field">
      <div class="label">
        <h2 class="title font-bold">{{ $t('seedream.name.promptOptimization') }}</h2>
      </div>
      <el-select v-model="promptOptimization" class="value" clearable>
        <el-option v-for="option in capabilities.promptOptimization" :key="option" :label="option" :value="option" />
      </el-select>
    </div>
    <div v-if="capabilities.webSearch && mode === 'image'" class="field">
      <div class="label">
        <h2 class="title font-bold">{{ $t('seedream.name.webSearch') }}</h2>
      </div>
      <el-switch v-model="webSearch" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInputNumber, ElOption, ElSelect, ElSwitch } from 'element-plus';
import { SEEDREAM_MODEL_5_5 } from '@/constants';
import { getSeedreamCapabilities } from '@/utils/seedream/capabilities';

export default defineComponent({
  name: 'SeedreamAdvancedOptions',
  components: { ElInputNumber, ElOption, ElSelect, ElSwitch },
  computed: {
    config(): any {
      return this.$store.state.seedream?.config || {};
    },
    capabilities() {
      return getSeedreamCapabilities(this.config.model);
    },
    seedream55(): boolean {
      return this.config.model === SEEDREAM_MODEL_5_5;
    },
    hasSingleImage(): boolean {
      return Array.isArray(this.config.image) && this.config.image.length === 1;
    },
    mode: {
      get(): 'image' | 'layers' {
        return this.config.layer_decomposition ? 'layers' : 'image';
      },
      set(value: 'image' | 'layers') {
        const config = { ...this.config };
        if (value === 'layers') {
          config.layer_decomposition = true;
          if (Array.isArray(config.image)) config.image = config.image.slice(0, 1);
          config.size = 'auto';
          delete config.background;
          delete config.sequential_image_generation;
          delete config.sequential_image_generation_options;
          delete config.tools;
        } else {
          delete config.layer_decomposition;
          delete config.layer_decomposition_options;
          if (config.size === 'auto') delete config.size;
        }
        this.$store.commit('seedream/setConfig', config);
      }
    },
    maxLayerImages: {
      get(): number {
        return this.config.layer_decomposition_options?.max_images ?? 30;
      },
      set(max_images: number | undefined) {
        this.$store.commit('seedream/setConfig', {
          ...this.config,
          layer_decomposition_options: { ...this.config.layer_decomposition_options, max_images }
        });
      }
    },
    textRecognition: {
      get(): boolean {
        return this.config.layer_decomposition_options?.text_recognition === true;
      },
      set(text_recognition: boolean) {
        this.$store.commit('seedream/setConfig', {
          ...this.config,
          layer_decomposition_options: { ...this.config.layer_decomposition_options, text_recognition }
        });
      }
    },
    background: {
      get(): 'transparent' | 'opaque' | undefined {
        return this.config.background;
      },
      set(value: 'transparent' | 'opaque' | undefined) {
        const config = { ...this.config, background: value };
        if (value === 'transparent') config.output_format = 'png';
        if (!value) delete config.background;
        this.$store.commit('seedream/setConfig', config);
      }
    },
    promptOptimization: {
      get(): 'standard' | 'fast' | undefined {
        return this.config.optimize_prompt_options?.mode;
      },
      set(value: 'standard' | 'fast' | undefined) {
        const config = { ...this.config };
        if (value) config.optimize_prompt_options = { mode: value };
        else delete config.optimize_prompt_options;
        this.$store.commit('seedream/setConfig', config);
      }
    },
    webSearch: {
      get(): boolean {
        return this.config.tools?.some((tool: any) => tool?.type === 'web_search') === true;
      },
      set(value: boolean) {
        const config = { ...this.config };
        if (value) config.tools = [{ type: 'web_search' }];
        else delete config.tools;
        this.$store.commit('seedream/setConfig', config);
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.advanced-options {
  display: grid;
  gap: 1rem;
}
.field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.label {
  min-width: 30%;
}
.title {
  margin: 0;
  font-size: 14px;
}
.value {
  width: min(200px, 65%);
}
</style>
