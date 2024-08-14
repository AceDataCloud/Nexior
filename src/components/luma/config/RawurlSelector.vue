<template>
  <div class="field">
    <h2 class="title">{{ $t('qrart.name.rawurl') }}</h2>
    <el-switch v-model="value" class="value" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSwitch } from 'element-plus';

export default defineComponent({
  name: 'RawurlSelector',
  components: {
    ElSwitch
  },
  computed: {
    value: {
      get() {
        return this.$store.state.qrart?.config?.rawurl;
      },
      set(val) {
        console.debug('set rawurl', val);
        this.$store.commit('qrart/setConfig', {
          ...this.$store.state.qrart?.config,
          rawurl: val
        });
      }
    }
  },
  mounted() {
    if (this.value === undefined) {
      this.value = QRART_DEFAULT_RAWURL;
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
