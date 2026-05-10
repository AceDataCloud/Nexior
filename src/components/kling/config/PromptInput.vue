<template>
  <prompt-textarea
    v-model="prompt"
    :title="$t('kling.name.prompt')"
    :info="$t('kling.description.prompt')"
    :placeholder="$t('kling.placeholder.prompt')"
  >
    <template #actions>
      <el-button text size="small" class="inspiration-btn" @click="$emit('open-inspiration')">
        <font-awesome-icon icon="fa-regular fa-lightbulb" class="mr-1" />
        {{ $t('kling.inspiration.openButton') }}
      </el-button>
    </template>
    <template #before>
      <inspiration-pills />
    </template>
  </prompt-textarea>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import PromptTextarea from '@/components/common/PromptTextarea.vue';
import InspirationPills from '../inspiration/InspirationPills.vue';

export const DEFAULT_PROMPT = '';

export default defineComponent({
  name: 'PromptInput',
  components: {
    ElButton,
    FontAwesomeIcon,
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
