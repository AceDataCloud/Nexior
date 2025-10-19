<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('sora.name.model') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('sora.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import {
  SORA_DEFAULT_DURATION,
  SORA_DEFAULT_MODEL,
  SORA_DEFAULT_SIZE,
  SORA_MODEL_PRO,
  SORA_MODEL_STANDARD
} from '@/constants';

export default defineComponent({
  name: 'ModelSelector',
  components: {
    ElSelect,
    ElOption
  },
  props: {
    modelValue: {
      type: String,
      default: undefined
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      options: [
        {
          value: SORA_MODEL_STANDARD,
          label: 'sora-2'
        },
        {
          value: SORA_MODEL_PRO,
          label: 'sora-2-pro'
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.sora?.config?.model;
      },
      set(val: string) {
        const currentConfig = this.$store.state.sora?.config || {};
        const nextConfig = {
          ...currentConfig,
          model: val
        } as Record<string, any>;

        if (val === SORA_MODEL_STANDARD) {
          nextConfig.duration = SORA_DEFAULT_DURATION;
          nextConfig.size = SORA_DEFAULT_SIZE;
        } else if (val === SORA_MODEL_PRO) {
          nextConfig.duration = nextConfig.duration || SORA_DEFAULT_DURATION;
          nextConfig.size = nextConfig.size || SORA_DEFAULT_SIZE;
        }

        this.$store.commit('sora/setConfig', nextConfig);
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = SORA_DEFAULT_MODEL;
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

  .title {
    font-size: 14px;
    margin: 0;
    width: 30%;
  }
  .value {
    width: 120px;
  }
}
</style>
