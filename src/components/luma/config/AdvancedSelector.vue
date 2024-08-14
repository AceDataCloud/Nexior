<template>
  <div class="field">
    <h2 class="title">{{ $t('qrart.name.advanced') }}</h2>
    <el-switch v-model="value" class="value" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSwitch } from 'element-plus';
import { QRART_DEFAULT_ADVANCED } from '@/constants';

export default defineComponent({
  name: 'AdvancedSelector',
  components: {
    ElSwitch
  },
  computed: {
    value: {
      get() {
        return this.$store.state.qrart?.config?.advanced;
      },
      set(val) {
        console.debug('set advanced', val);
        this.$store.commit('qrart/setConfig', {
          ...this.$store.state.qrart?.config,
          advanced: val
        });
      }
    }
  },
  mounted() {
    if (this.value === undefined) {
      this.value = QRART_DEFAULT_ADVANCED;
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
  .info {
    width: 20px;
  }
}
</style>
