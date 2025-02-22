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

<script>
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
        }
      ];
    },
    value: {
      get() {
        return this.$store.state.hailuo?.config?.model;
      },
      set(val) {
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
  display: flex;
  flex-direction: row;
  align-items: center;

  .title {
    font-size: 14px;
    margin: 0;
    width: 30%;
  }
  .value {
    flex: 1;
  }
}
</style>
