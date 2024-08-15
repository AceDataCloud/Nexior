<template>
  <div class="field">
    <h2 class="title">{{ $t('luma.name.enhancement') }}</h2>
    <el-switch v-model="value" class="value" />
    <info-icon :content="$t('luma.description.enhancement')" class="info" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSwitch } from 'element-plus';
import { LUMA_DEFAULT_ENHANCEMENT } from '@/constants';
import InfoIcon from '@/components/common/InfoIcon.vue';
export default defineComponent({
  name: 'EnhancementSelector',
  components: {
    ElSwitch,
    InfoIcon
  },
  computed: {
    value: {
      get() {
        return this.$store.state.luma?.config?.enhancement;
      },
      set(val) {
        console.debug('set enhancement', val);
        this.$store.commit('luma/setConfig', {
          ...this.$store.state.luma?.config,
          enhancement: val
        });
      }
    }
  },
  mounted() {
    if (this.value === undefined) {
      this.value = LUMA_DEFAULT_ENHANCEMENT;
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
