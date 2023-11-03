<template>
  <div class="field">
    <h2 class="title">图片权重</h2>
    <el-slider v-model="value" :min="0" :max="2" :step="0.1" class="value" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSlider } from 'element-plus';
const DEFAULT_IW = 1;

export default defineComponent({
  name: 'ImageWeightSelector',
  components: {
    ElSlider
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
      value: this.modelValue
    };
  },
  watch: {
    modelValue(val) {
      if (val !== this.value) {
        this.value = val;
      }
    },
    value(val) {
      this.$emit('update:modelValue', val);
    }
  },
  mounted() {
    if (!this.value) {
      this.value = DEFAULT_IW;
    }
    this.$emit('update:modelValue', this.value);
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: row;
  align-items: center;

  .title {
    font-size: 14px;
    margin-bottom: 0;
    width: 30%;
  }
  .value {
    flex: 1;
  }
}
</style>
