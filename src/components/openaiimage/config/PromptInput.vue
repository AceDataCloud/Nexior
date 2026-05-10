<template>
  <prompt-textarea
    v-model="prompt"
    :title="$t('openaiimage.name.prompt')"
    :info="$t('openaiimage.description.prompt')"
    :placeholder="$t('openaiimage.placeholder.prompt')"
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
        return this.$store.state.openaiimage?.config?.prompt;
      },
      set(val: string) {
        this.$store.commit('openaiimage/setConfig', {
          ...this.$store.state.openaiimage?.config,
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
