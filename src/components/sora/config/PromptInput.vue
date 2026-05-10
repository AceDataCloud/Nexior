<template>
  <prompt-textarea
    v-model="prompt"
    :title="$t('sora.name.prompt')"
    :info="$t('sora.description.prompt')"
    :placeholder="$t('sora.placeholder.prompt')"
  />
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
    prompt: {
      get() {
        return this.$store.state.sora?.config?.prompt;
      },
      set(val: string) {
        this.$store.commit('sora/setConfig', {
          ...this.$store.state.sora?.config,
          prompt: val
        });
      }
    }
  },
  mounted() {
    if (!this.prompt) {
      this.prompt = DEFAULT_PROMPT;
    }
  }
});
</script>
