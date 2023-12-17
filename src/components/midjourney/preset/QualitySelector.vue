<template>
  <div class="field">
    <h2 class="title">{{ $t('midjourney.name.quality') }}</h2>
    <el-radio-group v-model="value">
      <el-radio-button v-for="item in options" :key="item.value" :label="item.value">
        {{ item.label }}
      </el-radio-button>
    </el-radio-group>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElRadioButton, ElRadioGroup } from 'element-plus';

export const DEFAULT_QUALITY = '.5';

export default defineComponent({
  name: 'QualitySelector',
  components: {
    ElRadioButton,
    ElRadioGroup
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
      value: this.modelValue,
      active: 0,
      options: [
        {
          label: '低',
          value: '.25'
        },
        {
          label: '中',
          value: '.5'
        },
        {
          label: '高',
          value: '1'
        }
      ]
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
      this.value = DEFAULT_QUALITY;
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
