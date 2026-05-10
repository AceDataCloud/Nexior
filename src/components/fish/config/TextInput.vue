<template>
  <prompt-textarea
    v-model="text"
    :title="$t('fish.name.text')"
    :info="$t('fish.description.text')"
    :placeholder="$t('fish.placeholder.text')"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PromptTextarea from '@/components/common/PromptTextarea.vue';

export default defineComponent({
  name: 'FishTextInput',
  components: {
    PromptTextarea
  },
  computed: {
    text: {
      get(): string | undefined {
        return this.$store.state.fish?.config?.text;
      },
      set(val: string) {
        this.$store.commit('fish/setConfig', {
          ...this.$store.state.fish?.config,
          text: val
        });
      }
    }
  }
});
</script>
