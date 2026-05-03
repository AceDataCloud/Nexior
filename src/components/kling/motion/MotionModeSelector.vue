<template>
  <div class="field">
    <div class="header">
      <h2 class="title font-bold">{{ $t('kling.name.mode') }}</h2>
      <info-icon :content="$t('kling.description.motionMode')" />
    </div>
    <el-select v-model="value" class="value" :placeholder="$t('kling.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';

const DEFAULT: 'std' | 'pro' = 'std';

export default defineComponent({
  name: 'MotionModeSelector',
  components: {
    ElSelect,
    ElOption,
    InfoIcon
  },
  computed: {
    options() {
      return [
        { value: 'std', label: this.$t('kling.name.modeStd') },
        { value: 'pro', label: this.$t('kling.name.modePro') }
      ];
    },
    value: {
      get(): 'std' | 'pro' {
        return this.$store.state.kling?.motionConfig?.mode || DEFAULT;
      },
      set(val: 'std' | 'pro') {
        this.$store.commit('kling/setMotionConfig', {
          ...this.$store.state.kling?.motionConfig,
          mode: val
        });
      }
    }
  },
  mounted() {
    if (!this.$store.state.kling?.motionConfig?.mode) {
      this.value = DEFAULT;
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  .header {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 50%;

    .title {
      font-size: 14px;
      margin: 0;
    }
  }
  .value {
    width: 120px;
  }
}
</style>
