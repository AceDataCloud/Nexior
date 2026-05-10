<template>
  <prompt-textarea
    v-model="prompt"
    :title="$t('pika.name.prompt')"
    :info="$t('pika.description.prompt')"
    :placeholder="$t('pika.placeholder.prompt')"
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
        return this.$store.state.pika?.config?.prompt;
      },
      set(val: string) {
        this.$store.commit('pika/setConfig', {
          ...this.$store.state.pika?.config,
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
