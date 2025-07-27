<template>
  <div class="relative">
    <div class="flex justify-between">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('luma.name.custom') }}</span>
        <info-icon :content="$t('luma.description.custom')" />
      </div>
      <div class="flex justify-end items-center">
        <el-switch v-model="value" class="value" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSwitch } from 'element-plus';
import { LUMA_DEFAULT_CUSTOM } from '@/constants';
import InfoIcon from '@/components/common/InfoIcon.vue';

export default defineComponent({
  name: 'CustomSelector',
  components: {
    ElSwitch,
    InfoIcon
  },
  computed: {
    value: {
      get() {
        return this.$store.state.luma?.config?.custom;
      },
      set(val: boolean) {
        console.debug('set custom', val);
        this.$store.commit('luma/setConfig', {
          ...this.$store.state.luma?.config,
          custom: val
        });
      }
    }
  },
  mounted() {
    if (this.value === undefined) {
      this.value = LUMA_DEFAULT_CUSTOM;
    }
  }
});
</script>
