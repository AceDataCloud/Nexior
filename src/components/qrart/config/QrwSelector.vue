<template>
  <div class="field">
    <h2 class="title">{{ $t('qrart.name.qrw') }}</h2>
    <el-slider v-model="value" :min="1.5" :max="3" :step="0.1" class="value" />
    <info-icon :content="$t('qrart.description.qrw')" class="info" />
  </div>
</template>

<script>
import { ElSlider } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { QRART_DEFAULT_QRW } from '@/constants';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'QrwSelector',
  components: {
    ElSlider,
    InfoIcon
  },
  computed: {
    value: {
      get() {
        return this.$store.state.qrart?.config?.qrw || QRART_DEFAULT_QRW;
      },
      set(val) {
        console.debug('set qrw', val);
        this.$store.commit('qrart/setConfig', {
          ...this.$store.state.qrart?.config,
          qrw: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      console.debug('set default qrw');
      this.value = QRART_DEFAULT_QRW;
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
