<template>
  <div>
    <div class="flex justify-between">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('midjourney.name.weird') }}</span>
        <info-icon :content="$t('midjourney.description.weird')" />
      </div>
      <div class="flex justify-end items-center">
        <el-input-number v-model="value" size="small" controls-position="right" />
      </div>
    </div>
    <div class="w-full">
      <el-slider v-model="value" :min="0" :max="1000" :step="1" />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSlider, ElInputNumber } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { MIDJOURNEY_DEFAULT_WIRED } from '@/constants';

export default defineComponent({
  name: 'WeirdSelector',
  components: {
    ElSlider,
    ElInputNumber,
    InfoIcon
  },
  computed: {
    value: {
      get() {
        return this.$store.state.midjourney.config.weird;
      },
      set(val) {
        this.$store.commit('midjourney/setConfig', {
          ...this.$store.state.midjourney.config,
          weird: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = MIDJOURNEY_DEFAULT_WIRED;
    }
  }
});
</script>
