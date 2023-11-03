<template>
  <div class="field">
    <h2 class="title">自动翻译</h2>
    <el-switch v-model="value" class="ml-2" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSwitch } from 'element-plus';

const DEFAULT_ADVANCED = false;

export default defineComponent({
  name: 'TranslationSelector',
  components: {
    ElSwitch
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
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
    if (this.value === undefined) {
      this.value = DEFAULT_ADVANCED;
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
