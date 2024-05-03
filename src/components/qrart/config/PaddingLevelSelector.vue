<template>
  <div class="field">
    <h2 class="title">{{ $t('qrart.name.paddingLevel') }}</h2>
    <el-select v-model="value" clearable class="value" :placeholder="$t('qrart.placeholder.paddingLevel')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script>
import { QRART_DEFAULT_PADDING_LEVEL } from '@/constants';
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';

export default defineComponent({
  name: 'PaddingLevelSelector',
  components: {
    ElSelect,
    ElOption
  },
  data() {
    return {
      options: [
        {
          value: 0,
          label: 0
        },
        {
          value: 5,
          label: 5
        },
        {
          value: 10,
          label: 10
        },
        {
          value: 10,
          label: 10
        },
        {
          value: 15,
          label: 15
        },
        {
          value: 20,
          label: 20
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.qrart?.config?.padding_level;
      },
      set(val) {
        console.debug('set padding_level', val);
        this.$store.commit('qrart/setConfig', {
          ...this.$store.state.qrart?.config,
          padding_level: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = QRART_DEFAULT_PADDING_LEVEL;
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
