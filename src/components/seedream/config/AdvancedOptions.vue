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
    <div v-if="capabilities.transparentBackground && mode === 'image' && hasSingleImage" class="field">
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
import { ElOption, ElSelect, ElSwitch } from 'element-plus';
import { getSeedreamCapabilities } from '@/utils/seedream/capabilities';

export default defineComponent({
  name: 'SeedreamAdvancedOptions',
  components: { ElOption, ElSelect, ElSwitch },
  computed: {
    config(): any {
      return this.$store.state.seedream?.config || {};
    },
    capabilities() {
      return getSeedreamCapabilities(this.config.model);
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
          config.image = (config.image || []).slice(0, 1);
          config.size = 'auto';
          delete config.background;
          delete config.sequential_image_generation;
          delete config.sequential_image_generation_options;
          delete config.tools;
        } else {
          delete config.layer_decomposition;
          if (config.size === 'auto') delete config.size;
        }
        this.$store.commit('seedream/setConfig', config);
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
