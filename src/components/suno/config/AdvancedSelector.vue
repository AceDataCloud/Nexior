<template>
  <div class="field">
    <h2 class="title">{{ $t('suno.name.advanced') }}</h2>
    <el-switch v-model="value" class="value" />
    <info-icon :content="$t('suno.description.qrw')" class="info" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSwitch } from 'element-plus';
import { SUNO_DEFAULT_ADVANCED } from '@/constants';
import InfoIcon from '@/components/common/InfoIcon.vue';

export default defineComponent({
  name: 'AdvancedSelector',
  components: {
    ElSwitch,
    InfoIcon
  },
  computed: {
    value: {
      get() {
        return this.$store.state.suno?.config?.advanced;
      },
      set(val) {
        console.debug('set advanced', val);
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          advanced: val
        });
      }
    }
  },
  mounted() {
    if (this.value === undefined) {
      this.value = SUNO_DEFAULT_ADVANCED;
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
