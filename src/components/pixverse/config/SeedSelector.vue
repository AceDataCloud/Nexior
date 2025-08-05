<template>
  <div>
    <div class="flex justify-between">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('pixverse.name.seed') }}</span>
        <info-icon :content="$t('pixverse.description.seed')" />
      </div>
      <div class="flex justify-end items-center">
        <el-input-number v-model="value" controls-position="right" />
      </div>
    </div>
    <div class="w-full">
      <el-slider v-model="value" :min="0" :max="1000" :step="1" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSlider, ElInputNumber } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';

export default defineComponent({
  name: 'SeedSelector',
  components: {
    ElSlider,
    InfoIcon,
    ElInputNumber
  },
  computed: {
    value: {
      get() {
        return this.$store.state?.pixverse?.config?.seed;
      },
      set(val: string) {
        console.debug('set seed', val);
        this.$store.commit('pixverse/setConfig', {
          ...this.$store.state?.pixverse?.config,
          seed: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = undefined;
    }
  }
});
</script>
