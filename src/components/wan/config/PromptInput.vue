<template>
  <prompt-textarea
    v-model="prompt"
    :title="$t('wan.name.prompt')"
    :info="$t('wan.description.prompt')"
    :placeholder="$t('wan.placeholder.prompt')"
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
        return this.$store.state.wan?.config?.prompt;
      },
      set(val: string) {
        this.$store.commit('wan/setConfig', {
          ...this.$store.state.wan?.config,
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
