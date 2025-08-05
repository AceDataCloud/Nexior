<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('pika.name.model') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('pika.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { KLING_DEFAULT_MODEL } from '@/constants';

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
          value: 'kling-v1',
          label: 'v1'
        },
        {
          value: 'kling-v1-5',
          label: 'v1.5'
        },
        {
          value: 'kling-v1-6',
          label: 'v1.6'
        },
        {
          value: 'kling-v2-master',
          label: 'v2-Master'
        },
        {
          value: 'kling-v2-1',
          label: 'v2.1'
        },
        {
          value: 'kling-v2-1-master',
          label: 'v2.1-Master'
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.kling?.config?.model;
      },
      set(val: string) {
        this.$store.commit('kling/setConfig', {
          ...this.$store.state.kling.config,
          model: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = KLING_DEFAULT_MODEL;
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
