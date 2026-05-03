<template>
  <div class="relative">
    <div class="flex justify-between items-center">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('kling.name.keepOriginalSound') }}</span>
        <info-icon :content="$t('kling.description.keepOriginalSound')" />
      </div>
      <el-switch v-model="value" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSwitch } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';

export default defineComponent({
  name: 'KeepOriginalSoundSelector',
  components: {
    ElSwitch,
    InfoIcon
  },
  computed: {
    value: {
      get(): boolean {
        // Default `yes` per API spec.
        return (this.$store.state.kling?.motionConfig?.keep_original_sound ?? 'yes') === 'yes';
      },
      set(val: boolean) {
        this.$store.commit('kling/setMotionConfig', {
          ...this.$store.state.kling?.motionConfig,
          keep_original_sound: val ? 'yes' : 'no'
        });
      }
    }
  }
});
</script>
