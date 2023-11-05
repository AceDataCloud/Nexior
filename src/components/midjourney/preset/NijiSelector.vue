<template>
  <div class="field">
    <h2 class="title">{{ $t('midjourney.name.niji') }}</h2>
    <el-switch v-model="value" class="value" />
    <info-icon :content="$t('midjourney.description.niji')" class="info" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSwitch } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';

const DEFAULT_NIJI = false;

export default defineComponent({
  name: 'RawSelector',
  components: {
    ElSwitch,
    InfoIcon
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
      this.value = DEFAULT_NIJI;
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
