<template>
  <prompt-textarea
    v-model="prompt"
    :title="$t('hailuo.name.prompt')"
    :info="$t('hailuo.description.prompt')"
    :placeholder="$t('hailuo.placeholder.prompt')"
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
        return this.$store.state.hailuo?.config?.prompt;
      },
      set(val: string) {
        this.$store.commit('hailuo/setConfig', {
          ...this.$store.state.hailuo?.config,
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
