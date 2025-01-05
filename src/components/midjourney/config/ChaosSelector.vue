<template>
  <div>
    <div class="flex justify-between">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('midjourney.name.chaos') }}</span>
        <info-icon :content="$t('midjourney.description.chaos')" />
      </div>
      <div class="flex justify-end items-center">
        <el-input-number v-model="value" size="small" controls-position="right" />
      </div>
    </div>
    <div class="w-full">
      <el-slider v-model="value" :min="0" :max="100" :step="1" />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSlider, ElInputNumber } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';

const DEFAULT_CHAOS = 0;

export default defineComponent({
  name: 'ChaosSelector',
  components: {
    ElSlider,
    InfoIcon,
    ElInputNumber
  },
  computed: {
    value: {
      get() {
        return this.$store.state.midjourney.config.chaos;
      },
      set(val) {
        console.debug('set quality', val);
        this.$store.commit('midjourney/setConfig', {
          ...this.$store.state.midjourney.config,
          chaos: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = DEFAULT_CHAOS;
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
