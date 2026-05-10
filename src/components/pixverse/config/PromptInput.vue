<template>
  <prompt-textarea
    v-model="prompt"
    :title="$t('pixverse.name.prompt')"
    :info="$t('pixverse.description.prompt')"
    :placeholder="$t('pixverse.placeholder.prompt')"
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
        return this.$store.state.pixverse?.config?.prompt;
      },
      set(val: string) {
        this.$store.commit('pixverse/setConfig', {
          ...this.$store.state.pixverse?.config,
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
