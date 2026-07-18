<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('hailuo.name.model') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('hailuo.placeholder.select')" clearable>
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
        <span class="float-left">{{ item.label }}</span>
      </el-option>
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { HAILUO_DEFAULT_MODEL } from '@/constants';

export default defineComponent({
  name: 'ModelSelector',
  components: {
    ElSelect,
    ElOption
  },
  data() {
    return {};
  },
  computed: {
    options() {
      return [
        {
          value: 'minimax-t2v',
          label: this.$t('hailuo.button.model1')
        },
        {
          value: 'minimax-i2v',
          label: this.$t('hailuo.button.model2')
        },
        {
          value: 'minimax-i2v-director',
          label: this.$t('hailuo.button.model3')
        }
      ];
    },
    value: {
      get() {
        return this.$store.state.hailuo?.config?.model;
      },
      set(val: string) {
        this.$store.commit('hailuo/setConfig', {
          ...this.$store.state.hailuo?.config,
          model: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = HAILUO_DEFAULT_MODEL;
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 160px;
  gap: 8px;
  align-items: center;

  .title {
    font-size: 14px;
    margin: 0;
    min-width: 0;
  }
  .value {
    width: 100%;
  }
}
</style>
