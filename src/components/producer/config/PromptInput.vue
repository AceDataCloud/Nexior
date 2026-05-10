<template>
  <prompt-textarea
    v-model="prompt"
    :title="$t('producer.name.songDescription')"
    :info="$t('producer.description.prompt')"
    :placeholder="$t('producer.placeholder.prompt')"
    :min-rows="5"
    :max-rows="14"
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
        return this.$store.state.producer?.config?.prompt;
      },
      set(val: string) {
        this.$store.commit('producer/setConfig', {
          ...this.$store.state.producer?.config,
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
