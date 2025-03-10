<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('kling.name.mode') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('kling.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { KLING_DEFAULT_MODE } from '@/constants';

export default defineComponent({
  name: 'ModeSelector',
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
          value: 'std',
          label: '标准'
        },
        {
          value: 'pro',
          label: '高速'
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.kling?.config?.mode;
      },
      set(val) {
        this.$store.commit('kling/setConfig', {
          ...this.$store.state.kling.config,
          mode: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = KLING_DEFAULT_MODE;
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
