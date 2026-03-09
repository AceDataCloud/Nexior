<template>
  <div class="field">
    <div class="flex items-center mb-1">
      <span class="text-sm font-bold">{{ $t('suno.name.songDescription') }}</span>
      <info-icon :content="$t('suno.description.prompt')" />
    </div>
    <el-input v-model="prompt" :rows="4" type="textarea" :placeholder="$t('suno.placeholder.prompt')" />
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
        return this.$store.state.suno?.config?.prompt;
      },
      set(val: string) {
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
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
