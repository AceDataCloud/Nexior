<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('flux.name.task') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('flux.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { FLUX_DEFAULT_ACTION } from '@/constants';

export default defineComponent({
  name: 'ActionSelector',
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
          value: 'generate',
          label: this.$t('flux.name.generate')
        },
        {
          value: 'edits',
          label: this.$t('flux.name.edits')
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.flux?.config?.action;
      },
      set(val: string) {
        this.$store.commit('flux/setConfig', {
          ...this.$store.state.flux.config,
          action: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = FLUX_DEFAULT_ACTION;
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
    width: 160px;
  }
}
</style>
