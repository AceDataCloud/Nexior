<template>
  <div>
    <div class="flex justify-between">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('flux.name.quality') }}</span>
        <info-icon :content="$t('flux.description.quality')" />
      </div>
      <div class="flex justify-end items-center">
        <el-input-number v-model="value" size="small" controls-position="right" />
      </div>
    </div>
    <div class="w-full">
      <el-slider v-model="value" :min="1" :max="100" :step="1" />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSlider, ElInputNumber } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { FLUX_DEFAULT_QUALITY } from '@/constants';

export default defineComponent({
  name: 'QualitySelector',
  components: {
    ElSlider,
    InfoIcon,
    ElInputNumber
  },
  computed: {
    value: {
      get() {
        return this.$store.state.flux.config.quality;
      },
      set(val) {
        console.debug('set quality', val);
        this.$store.commit('flux/setConfig', {
          ...this.$store.state.flux.config,
          quality: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = FLUX_DEFAULT_QUALITY;
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
