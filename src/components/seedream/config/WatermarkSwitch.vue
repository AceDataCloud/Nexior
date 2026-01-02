<template>
  <div class="field flex items-center justify-between">
    <div class="label flex items-center">
      <div class="box flex items-center">
        <h2 class="title font-bold text-[14px] m-0">{{ $t('seedream.name.watermark') }}</h2>
        <info-icon :content="$t('seedream.description.watermark')" class="ml-2" />
      </div>
    </div>
    <el-switch v-model="value" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSwitch } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { SEEDREAM_DEFAULT_WATERMARK } from '@/constants';

export default defineComponent({
  name: 'SeedreamWatermarkSwitch',
  components: {
    ElSwitch,
    InfoIcon
  },
  computed: {
    value: {
      get(): boolean {
        const v = this.$store.state.seedream?.config?.watermark;
        return v === undefined ? SEEDREAM_DEFAULT_WATERMARK : !!v;
      },
      set(val: boolean) {
        this.$store.commit('seedream/setConfig', {
          ...this.$store.state.seedream?.config,
          watermark: val
        });
      }
    }
  }
});
</script>
