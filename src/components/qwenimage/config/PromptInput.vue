<template>
  <prompt-textarea
    v-model="prompt"
    :title="$t('qwenimage.name.prompt')"
    :info="$t('qwenimage.description.prompt')"
    :placeholder="$t('qwenimage.placeholder.prompt')"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PromptTextarea from '@/components/common/PromptTextarea.vue';

export const DEFAULT_PROMPT = '';

export default defineComponent({
  name: 'QwenImagePromptInput',
  components: {
    PromptTextarea
  },
  computed: {
    prompt: {
      get() {
        return this.$store.state.qwenimage?.config?.prompt;
      },
      set(val: string) {
        this.$store.commit('qwenimage/setConfig', {
          ...this.$store.state.qwenimage?.config,
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
