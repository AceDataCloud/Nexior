<template>
  <prompt-textarea
    v-model="prompt"
    :title="$t('midjourney.name.prompt')"
    :info="$t('midjourney.description.prompt')"
    :placeholder="$t('midjourney.placeholder.prompt')"
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
        return this.$store.state.midjourney?.config.prompt;
      },
      set(val: string) {
        this.$store.commit('midjourney/setConfig', {
          ...this.$store.state.midjourney?.config,
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
