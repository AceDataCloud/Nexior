<template>
  <prompt-textarea
    v-model="prompt"
    :title="$t('flux.name.prompt')"
    :info="$t('flux.description.prompt')"
    :placeholder="$t('flux.placeholder.prompt')"
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
        return this.$store.state.flux?.config?.prompt;
      },
      set(val: string) {
        this.$store.commit('flux/setConfig', {
          ...this.$store.state.flux?.config,
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
