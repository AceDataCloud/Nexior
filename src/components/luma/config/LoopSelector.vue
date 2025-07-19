<template>
  <div class="relative">
    <div class="flex justify-between">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('luma.name.loop') }}</span>
        <info-icon :content="$t('luma.description.loop')" />
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
import { LUMA_DEFAULT_LOOP } from '@/constants';
import InfoIcon from '@/components/common/InfoIcon.vue';

export default defineComponent({
  name: 'LoopSelector',
  components: {
    ElSwitch,
    InfoIcon
  },
  computed: {
    value: {
      get() {
        return this.$store.state.luma?.config?.loop;
      },
      set(val) {
        console.debug('set loop', val);
        this.$store.commit('luma/setConfig', {
          ...this.$store.state.luma?.config,
          loop: val
        });
      }
    }
  },
  mounted() {
    if (this.value === undefined) {
      this.value = LUMA_DEFAULT_LOOP;
    }
  }
});
</script>
