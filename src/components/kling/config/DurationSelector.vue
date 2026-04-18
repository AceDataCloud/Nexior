<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('kling.name.duration') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('kling.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { KLING_DEFAULT_DURATION, KLING_V3_MODELS } from '@/constants';

const STANDARD_OPTIONS = [
  { value: 5, label: '5秒' },
  { value: 10, label: '10秒' }
];

const V3_OPTIONS = [
  { value: 3, label: '3秒' },
  { value: 5, label: '5秒' },
  { value: 8, label: '8秒' },
  { value: 10, label: '10秒' },
  { value: 12, label: '12秒' },
  { value: 15, label: '15秒' }
];

export default defineComponent({
  name: 'DurationSelector',
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
  computed: {
    selectedModel() {
      return this.$store.state.kling?.config?.model || '';
    },
    isV3Model() {
      return KLING_V3_MODELS.includes(this.selectedModel);
    },
    options() {
      return this.isV3Model ? V3_OPTIONS : STANDARD_OPTIONS;
    },
    value: {
      get() {
        return this.$store.state.kling?.config?.duration;
      },
      set(val: string) {
        this.$store.commit('kling/setConfig', {
          ...this.$store.state.kling.config,
          duration: val
        });
      }
    }
  },
  watch: {
    isV3Model(newVal: boolean) {
      const current = this.value;
      const validValues = (newVal ? V3_OPTIONS : STANDARD_OPTIONS).map((o) => o.value);
      if (!validValues.includes(current)) {
        this.value = KLING_DEFAULT_DURATION;
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = KLING_DEFAULT_DURATION;
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
    width: 80px;
  }
}
</style>
