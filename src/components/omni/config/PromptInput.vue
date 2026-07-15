<template>
  <prompt-textarea
    v-model="prompt"
    :title="$t('omni.name.prompt')"
    :info="$t('omni.description.prompt')"
    :placeholder="$t('omni.placeholder.prompt')"
    :min-rows="5"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PromptTextarea from '@/components/common/PromptTextarea.vue';

export const DEFAULT_PROMPT = '';

export default defineComponent({
  name: 'OmniPromptInput',
  components: {
    PromptTextarea
  },
  computed: {
    prompt: {
      get() {
        return this.$store.state.omni?.config?.prompt;
      },
      set(val: string) {
        this.$store.commit('omni/setConfig', {
          ...this.$store.state.omni?.config,
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
