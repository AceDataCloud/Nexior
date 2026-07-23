<template>
  <prompt-textarea
    v-model="prompt"
    :title="$t('seedance.name.prompt')"
    :info="$t('seedance.description.prompt')"
    :placeholder="$t('seedance.placeholder.prompt')"
    :min-rows="5"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PromptTextarea from '@/components/common/PromptTextarea.vue';

export const DEFAULT_PROMPT = '';

export default defineComponent({
  name: 'SeedancePromptInput',
  components: {
    PromptTextarea
  },
  computed: {
    prompt: {
      get() {
        return this.$store.state.seedance?.config?.prompt;
      },
      set(val: string) {
        this.$store.commit('seedance/setConfig', {
          ...this.$store.state.seedance?.config,
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
