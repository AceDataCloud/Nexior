<template>
  <prompt-textarea
    v-model="prompt"
    :title="$t('veo.name.prompt')"
    :info="$t('veo.description.prompt')"
    :placeholder="$t('veo.placeholder.prompt')"
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
        return this.$store.state.veo?.config?.prompt;
      },
      set(val: string) {
        this.$store.commit('veo/setConfig', {
          ...this.$store.state.veo?.config,
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
