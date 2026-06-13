<template>
  <prompt-textarea
    v-model="prompt"
    :title="$t('grokvideo.name.prompt')"
    :info="$t('grokvideo.description.prompt')"
    :placeholder="$t('grokvideo.placeholder.prompt')"
    :min-rows="5"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PromptTextarea from '@/components/common/PromptTextarea.vue';

export const DEFAULT_PROMPT = '';

export default defineComponent({
  name: 'GrokVideoPromptInput',
  components: {
    PromptTextarea
  },
  computed: {
    prompt: {
      get() {
        return this.$store.state.grokvideo?.config?.prompt;
      },
      set(val: string) {
        this.$store.commit('grokvideo/setConfig', {
          ...this.$store.state.grokvideo?.config,
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
