<template>
  <div>
    <div class="flex justify-between">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('flux.name.numbers') }}</span>
        <info-icon :content="$t('flux.description.numbers')" />
      </div>
      <div class="flex justify-end items-center">
        <el-input-number v-model="value" size="small" controls-position="right" />
      </div>
    </div>
    <div class="w-full">
      <el-slider v-model="value" :min="1" :max="4" :step="1" />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSlider, ElInputNumber } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { FLUX_DEFAULT_NUMBERS } from '@/constants';

export default defineComponent({
  name: 'NumbersSelector',
  components: {
    ElSlider,
    InfoIcon,
    ElInputNumber
  },
  computed: {
    value: {
      get() {
        return this.$store.state.flux?.config?.numbers;
      },
      set(val) {
        console.debug('set stylize', val);
        this.$store.commit('flux/setConfig', {
          ...this.$store.state.flux?.config,
          numbers: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = FLUX_DEFAULT_NUMBERS;
    }
  }
});
</script>
