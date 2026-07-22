<template>
  <prompt-textarea
    v-model="prompt"
    :title="$t('seedance.name.prompt')"
    :info="$t('seedance.description.prompt')"
    :placeholder="$t('seedance.placeholder.prompt')"
    :min-rows="5"
  >
    <template v-if="talking" #after>
      <div class="talking-hint">
        <p class="hint-text">{{ $t('seedance.description.talkingPrompt') }}</p>
        <el-button size="small" round class="insert-btn" @click="onInsertTemplate">
          {{ $t('seedance.button.insertTemplate') }}
        </el-button>
      </div>
    </template>
  </prompt-textarea>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import PromptTextarea from '@/components/common/PromptTextarea.vue';

export const DEFAULT_PROMPT = '';

export default defineComponent({
  name: 'SeedancePromptInput',
  components: {
    PromptTextarea,
    ElButton
  },
  computed: {
    talking(): boolean {
      return this.$store.state.seedance?.config?.talking ?? false;
    },
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
  },
  methods: {
    onInsertTemplate() {
      const template = this.$t('seedance.template.talkingLine') as string;
      const current = this.prompt || '';
      this.prompt = current ? `${current.replace(/\s*$/, '')}\n${template}` : template;
    }
  }
});
</script>

<style lang="scss" scoped>
.talking-hint {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;

  .hint-text {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin: 0;
    line-height: 1.4;
  }

  .insert-btn {
    flex-shrink: 0;
  }
}
</style>
