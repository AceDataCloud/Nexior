<template>
  <div class="field">
    <div class="box">
      <h2 class="title font-bold">{{ $t('kling.name.prompt') }}</h2>
      <div class="actions">
        <el-button text size="small" class="inspiration-btn" @click="$emit('open-inspiration')">
          <font-awesome-icon icon="fa-regular fa-lightbulb" class="mr-1" />
          {{ $t('kling.inspiration.openButton') }}
        </el-button>
        <info-icon :content="$t('kling.description.prompt')" class="info" />
      </div>
    </div>
    <inspiration-pills />
    <el-input v-model="prompt" :rows="3" type="textarea" class="prompt" :placeholder="$t('kling.placeholder.prompt')" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput, ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import InfoIcon from '@/components/common/InfoIcon.vue';
import InspirationPills from '../inspiration/InspirationPills.vue';

export const DEFAULT_PROMPT = '';

export default defineComponent({
  name: 'PromptInput',
  components: {
    ElInput,
    ElButton,
    FontAwesomeIcon,
    InfoIcon,
    InspirationPills
  },
  emits: ['open-inspiration'],
  computed: {
    prompt: {
      get() {
        return this.$store.state.kling?.config?.prompt;
      },
      set(val: string) {
        console.debug('set prompt', val);
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
.field {
  .box {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    position: relative;
    margin-bottom: 6px;

    .title {
      font-size: 14px;
      margin: 0;
    }
    .actions {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .inspiration-btn {
      font-size: 12px;
      color: var(--el-color-primary);
      padding: 0 6px;
      height: 24px;
    }
  }
  .info {
    margin-left: 4px;
  }
}
</style>
