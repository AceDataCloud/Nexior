<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('pixverse.name.motion') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('pixverse.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';

export default defineComponent({
  name: 'MotionSelector',
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
          value: 'normal',
          label: '标准'
        },
        {
          value: 'fast',
          label: '快速'
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.pixverse?.config?.motion;
      },
      set(val: string) {
        this.$store.commit('pixverse/setConfig', {
          ...this.$store.state.pixverse.config,
          motion: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = '';
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
