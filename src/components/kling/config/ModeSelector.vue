<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('kling.name.mode') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('kling.placeholder.select')" :clearable="true">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
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
          label: this.$t('kling.name.modeStd')
        },
        {
          value: 'pro',
          label: this.$t('kling.name.modePro')
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.kling?.config?.mode;
      },
      set(val: string) {
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
