<template>
  <div class="field">
    <h2 class="title">{{ $t('qrart.name.paddingNoise') }}</h2>
    <el-select v-model="value" clearable class="value" :placeholder="$t('qrart.placeholder.paddingNoise')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script>
import { QRART_DEFAULT_PADDING_NOISE } from '@/constants';
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';

export default defineComponent({
  name: 'PaddingNoiseSelector',
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
          value: 0.25,
          label: 0.25
        },
        {
          value: 0.5,
          label: 0.5
        },
        {
          value: 0.75,
          label: 0.75
        },
        {
          value: 1,
          label: 1
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.qrart?.config?.padding_noise;
      },
      set(val) {
        console.debug('set padding_noise', val);
        this.$store.commit('qrart/setConfig', {
          ...this.$store.state.qrart?.config,
          padding_noise: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = QRART_DEFAULT_PADDING_NOISE;
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
