<template>
  <prompt-textarea
    v-model="prompt"
    :title="$t('kling.name.prompt')"
    :info="$t('kling.description.prompt')"
    :placeholder="$t('kling.placeholder.prompt')"
  >
    <template #actions>
      <el-button text size="small" class="inspiration-btn" @click="$emit('open-inspiration')">
        <idea-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('kling.inspiration.openButton') }}
      </el-button>
    </template>
    <template #before>
      <inspiration-pills />
    </template>
  </prompt-textarea>
</template>

<script lang="ts">
import { IdeaIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import PromptTextarea from '@/components/common/PromptTextarea.vue';
import InspirationPills from '../inspiration/InspirationPills.vue';

export const DEFAULT_PROMPT = '';

export default defineComponent({
  name: 'PromptInput',
  components: {
    IdeaIcon,
    ElButton,
    PromptTextarea,
    InspirationPills
  },
  emits: ['open-inspiration'],
  computed: {
    prompt: {
      get() {
        return this.$store.state.kling?.config?.prompt;
      },
      set(val: string) {
        this.$store.commit('kling/setConfig', {
          ...this.$store.state.kling?.config,
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

<style lang="scss" scoped>
.inspiration-btn {
  font-size: 12px;
  color: var(--el-color-primary);
  padding: 0 6px;
  height: 24px;
}
</style>
