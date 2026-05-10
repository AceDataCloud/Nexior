<template>
  <prompt-textarea v-model="value" :title="$t('qrart.name.prompt')" :placeholder="$t('qrart.placeholder.prompt')" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PromptTextarea from '@/components/common/PromptTextarea.vue';

export const DEFAULT_PROMPT = '';

export default defineComponent({
  name: 'PromptInput',
  components: {
    PromptTextarea
  },
  computed: {
    value: {
      get() {
        return this.$store.state.qrart?.config?.prompt;
      },
      set(val: string) {
        this.$store.commit('qrart/setConfig', {
          ...this.$store.state.qrart?.config,
          prompt: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = DEFAULT_PROMPT;
    }
  }
});
</script>
