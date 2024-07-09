<template>
  <div class="field">
    <h2 class="title">{{ $t('qrart.name.steps') }}</h2>
    <el-slider v-model="value" :min="10" :max="20" :step="1" class="value" />
    <info-icon :content="$t('qrart.description.steps')" class="info" />
  </div>
</template>

<script>
import { ElSlider } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { QRART_DEFAULT_STEPS } from '@/constants';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'StepsSelector',
  components: {
    ElSlider,
    InfoIcon
  },
  computed: {
    value: {
      get() {
        return this.$store.state.qrart?.config?.steps || QRART_DEFAULT_STEPS;
      },
      set(val) {
        console.debug('set steps', val);
        this.$store.commit('qrart/setConfig', {
          ...this.$store.state.qrart?.config,
          steps: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      console.debug('set default steps', QRART_DEFAULT_STEPS);
      this.value = QRART_DEFAULT_STEPS;
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
