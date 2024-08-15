<template>
  <div class="field">
    <h2 class="title">{{ $t('luma.name.loop') }}</h2>
    <el-switch v-model="value" class="value" />
    <info-icon :content="$t('luma.description.loop')" class="info" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSwitch } from 'element-plus';
import { LUMA_DEFAULT_LOOP } from '@/constants';
import InfoIcon from '@/components/common/InfoIcon.vue';
export default defineComponent({
  name: 'LoopSelector',
  components: {
    ElSwitch,
    InfoIcon
  },
  computed: {
    value: {
      get() {
        return this.$store.state.luma?.config?.loop;
      },
      set(val) {
        console.debug('set loop', val);
        this.$store.commit('luma/setConfig', {
          ...this.$store.state.luma?.config,
          loop: val
        });
      }
    }
  },
  mounted() {
    if (this.value === undefined) {
      this.value = LUMA_DEFAULT_LOOP;
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
    margin-left: 60px; // Adjust this value as needed
  }
}
</style>
