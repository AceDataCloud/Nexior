<template>
  <div class="field">
    <h2 class="title">{{ $t('midjourney.name.version') }}</h2>
    <el-select v-model="value" class="value" placeholder="Select">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
const DEFAULT_VERSION = '5.2';

export default defineComponent({
  name: 'VersionSelector',
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
      value: this.modelValue,
      active: 0,
      options: [
        {
          value: '6.0',
          label: '6.0'
        },
        {
          value: '5.2',
          label: '5.2'
        },
        {
          value: '5.1',
          label: '5.1'
        },
        {
          value: '5.0',
          label: '5'
        },
        {
          value: '4',
          label: '4'
        },
        {
          value: '3',
          label: '3'
        },
        {
          value: '2',
          label: '2'
        },
        {
          value: '1',
          label: '1'
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
      this.value = DEFAULT_VERSION;
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
