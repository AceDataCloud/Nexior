<template>
  <div>
    <div class="flex justify-between">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('midjourney.name.imageWeight') }}</span>
        <info-icon :content="$t('midjourney.description.imageWeight')" />
      </div>
      <div class="flex justify-end items-center">
        <el-input-number v-model="value" size="small" controls-position="right" />
      </div>
    </div>
    <div class="w-full">
      <el-slider v-model="value" :min="0" :max="2" :step="0.1" />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSlider } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { MIDJOURNEY_DEFAULT_IMAGE_WEIGHT } from '@/constants';

export default defineComponent({
  name: 'ImageWeightSelector',
  components: {
    ElSlider,
    InfoIcon
  },
  computed: {
    value: {
      get() {
        return this.$store.state.midjourney.config.iw;
      },
      set(val) {
        console.debug('set iw', val);
        this.$store.commit('midjourney/setConfig', {
          ...this.$store.state.midjourney.config,
          iw: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = MIDJOURNEY_DEFAULT_IMAGE_WEIGHT;
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
