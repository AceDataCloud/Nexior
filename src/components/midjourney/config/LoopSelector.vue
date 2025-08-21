<template>
  <div class="relative">
    <div class="flex justify-between">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('midjourney.name.loop') }}</span>
        <info-icon :content="$t('midjourney.description.loop')" />
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
import { MIDJOURNEY_DEFAULT_LOOP } from '@/constants';
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
        return this.$store.state.midjourney?.config?.loop;
      },
      set(val: boolean) {
        console.debug('set loop', val);
        this.$store.commit('midjourney/setConfig', {
          ...this.$store.state.midjourney?.config,
          loop: val
        });
      }
    }
  },
  mounted() {
    if (this.value === undefined) {
      this.value = MIDJOURNEY_DEFAULT_LOOP;
    }
  }
});
</script>
