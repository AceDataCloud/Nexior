<template>
  <div class="relative">
    <div class="flex justify-between">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('luma.name.enhancement') }}</span>
        <info-icon :content="$t('luma.description.enhancement')" />
      </div>
      <div class="flex justify-end items-center">
        <el-switch v-model="value" class="value" />
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSwitch } from 'element-plus';
import { LUMA_DEFAULT_ENHANCEMENT } from '@/constants';
import InfoIcon from '@/components/common/InfoIcon.vue';
export default defineComponent({
  name: 'EnhancementSelector',
  components: {
    ElSwitch,
    InfoIcon
  },
  computed: {
    value: {
      get() {
        return this.$store.state.luma?.config?.enhancement;
      },
      set(val) {
        console.debug('set enhancement', val);
        this.$store.commit('luma/setConfig', {
          ...this.$store.state.luma?.config,
          enhancement: val
        });
      }
    }
  },
  mounted() {
    if (this.value === undefined) {
      this.value = LUMA_DEFAULT_ENHANCEMENT;
    }
  }
});
</script>
