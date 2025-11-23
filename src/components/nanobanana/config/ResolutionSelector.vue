<template>
  <div class="field">
    <div class="label">
      <h2 class="title font-bold">{{ $t('nanobanana.name.resolution') }}</h2>
      <span v-if="!isProModel" class="hint">{{ $t('nanobanana.description.resolutionProOnly') }}</span>
    </div>
    <el-select v-model="value" class="value" :placeholder="$t('nanobanana.placeholder.select')" :disabled="!isProModel">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import {
  NANOBANANA_DEFAULT_RESOLUTION,
  NANOBANANA_MODEL_NANO_BANANA_PRO,
  NANOBANANA_RESOLUTION_1K,
  NANOBANANA_RESOLUTION_2K,
  NANOBANANA_RESOLUTION_4K
} from '@/constants';

export default defineComponent({
  name: 'NanobananaResolutionSelector',
  components: {
    ElSelect,
    ElOption
  },
  data() {
    return {
      cachedResolution: NANOBANANA_DEFAULT_RESOLUTION,
      options: [
        {
          value: NANOBANANA_RESOLUTION_1K,
          label: NANOBANANA_RESOLUTION_1K
        },
        {
          value: NANOBANANA_RESOLUTION_2K,
          label: NANOBANANA_RESOLUTION_2K
        },
        {
          value: NANOBANANA_RESOLUTION_4K,
          label: NANOBANANA_RESOLUTION_4K
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.nanobanana?.config?.resolution;
      },
      set(val: string) {
        this.$store.commit('nanobanana/setConfig', {
          ...this.$store.state.nanobanana?.config,
          resolution: val
        });
      }
    },
    isProModel(): boolean {
      return this.$store.state.nanobanana?.config?.model === NANOBANANA_MODEL_NANO_BANANA_PRO;
    }
  },
  watch: {
    value(newVal: string) {
      if (this.isProModel && newVal) {
        this.cachedResolution = newVal;
      }
    },
    isProModel(newVal: boolean) {
      if (newVal) {
        if (!this.value) {
          this.value = this.cachedResolution || NANOBANANA_DEFAULT_RESOLUTION;
        }
      } else {
        if (this.value) {
          this.cachedResolution = this.value;
        }
        this.$store.commit('nanobanana/setConfig', {
          ...this.$store.state.nanobanana?.config,
          resolution: undefined
        });
      }
    }
  },
  mounted() {
    if (this.isProModel && !this.value) {
      this.value = NANOBANANA_DEFAULT_RESOLUTION;
    }
    if (!this.isProModel && this.value) {
      this.cachedResolution = this.value;
      this.$store.commit('nanobanana/setConfig', {
        ...this.$store.state.nanobanana?.config,
        resolution: undefined
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  .label {
    width: 30%;

    .title {
      font-size: 14px;
      margin: 0;
    }

    .hint {
      display: block;
      font-size: 12px;
      color: var(--el-text-color-placeholder);
      line-height: 1.2;
    }
  }

  .value {
    width: 160px;
  }
}
</style>
