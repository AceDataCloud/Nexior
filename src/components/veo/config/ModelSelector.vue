<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('veo.name.model') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('veo.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { VEO_DEFAULT_MODEL } from '@/constants';

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
          value: 'veo2',
          label: 'veo2'
        },
        {
          value: 'veo2-fast',
          label: 'veo2-fast'
        },
        {
          value: 'veo3',
          label: 'veo3'
        },
        {
          value: 'veo3-fast',
          label: 'veo3-fast'
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.veo?.config?.model;
      },
      set(val: string) {
        this.$store.commit('veo/setConfig', {
          ...this.$store.state.veo.config,
          model: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = VEO_DEFAULT_MODEL;
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
    width: 120px;
  }
}
</style>
