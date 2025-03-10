<template>
  <div>
    <div class="flex justify-between">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('kling.name.cfgScale') }}</span>
        <info-icon :content="$t('kling.description.cfgScale')" />
      </div>
      <div class="flex justify-end items-center">
        <el-input-number v-model="value" size="small" controls-position="right" />
      </div>
    </div>
    <div class="w-full">
      <el-slider v-model="value" :min="0" :max="1" :step="0.1" />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSlider, ElInputNumber } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { KLING_DEFAULT_CFG_SCALE } from '@/constants';

export default defineComponent({
  name: 'CfgScaleSelector',
  components: {
    ElSlider,
    InfoIcon,
    ElInputNumber
  },
  computed: {
    value: {
      get() {
        return this.$store.state?.kling?.config?.cfg_scale;
      },
      set(val) {
        console.debug('set cfg_scale', val);
        this.$store.commit('kling/setConfig', {
          ...this.$store.state?.kling?.config,
          cfg_scale: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = KLING_DEFAULT_CFG_SCALE;
    }
  }
});
</script>
