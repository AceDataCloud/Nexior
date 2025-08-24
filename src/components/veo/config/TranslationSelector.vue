<template>
  <div class="relative">
    <div class="flex justify-between">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('veo.name.translation') }}</span>
        <info-icon :content="$t('veo.description.translation')" />
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
import { VEO_DEFAULT_TRANSLATION } from '@/constants';
import InfoIcon from '@/components/common/InfoIcon.vue';

export default defineComponent({
  name: 'TranslationSelector',
  components: {
    ElSwitch,
    InfoIcon
  },
  computed: {
    value: {
      get() {
        return this.$store.state.veo?.config?.translation;
      },
      set(val: boolean) {
        console.debug('set translation', val);
        this.$store.commit('veo/setConfig', {
          ...this.$store.state.veo?.config,
          translation: val
        });
      }
    }
  },
  mounted() {
    if (this.value === undefined) {
      this.value = VEO_DEFAULT_TRANSLATION;
    }
  }
});
</script>
