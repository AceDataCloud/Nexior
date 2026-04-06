<template>
  <div class="field">
    <div class="flex items-center mb-1">
      <span class="text-sm font-bold">{{ $t('producer.name.songDescription') }}</span>
      <info-icon :content="$t('producer.description.prompt')" />
    </div>
    <el-input v-model="prompt" :rows="4" type="textarea" :placeholder="$t('producer.placeholder.prompt')" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';

export const DEFAULT_PROMPT = '';

export default defineComponent({
  name: 'PromptInput',
  components: {
    ElInput,
    InfoIcon
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
