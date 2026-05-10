<template>
  <prompt-textarea
    v-model="prompt"
    :title="$t('luma.name.prompt')"
    :info="$t('luma.description.prompt')"
    :placeholder="$t('luma.placeholder.prompt')"
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
        return this.$store.state.luma?.config?.prompt;
      },
      set(val: string) {
        this.$store.commit('luma/setConfig', {
          ...this.$store.state.luma?.config,
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
