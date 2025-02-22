<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('flux.name.model') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('flux.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { FLUX_DEFAULT_MODEL } from '@/constants';

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
          value: 'flux',
          label: 'flux'
        },
        {
          value: 'flux-schnell',
          label: 'flux-schnell'
        },
        {
          value: 'flux-dev',
          label: 'flux-dev'
        },
        {
          value: 'flux-pro',
          label: 'flux-pro'
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.flux?.config?.model;
      },
      set(val) {
        this.$store.commit('flux/setConfig', {
          ...this.$store.state.flux.config,
          model: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = FLUX_DEFAULT_MODEL;
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
