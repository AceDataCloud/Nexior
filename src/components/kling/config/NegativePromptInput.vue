<template>
  <div class="field">
    <div class="box">
      <h2 class="title font-bold">{{ $t('kling.name.negativePrompt') }}</h2>
      <info-icon :content="$t('kling.description.negativePrompt')" class="info" />
    </div>
    <el-input
      v-model="prompt"
      :rows="3"
      type="textarea"
      class="prompt"
      :placeholder="$t('kling.placeholder.negativePrompt')"
      :maxlength="200"
      show-word-limit
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElInput } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';

export const DEFAULT_NEGATIVE_PROMPT = '';

export default defineComponent({
  name: 'NegativePromptInput',
  components: {
    ElInput,
    InfoIcon
  },
  computed: {
    prompt: {
      get() {
        return this.$store.state.kling?.config?.negative_prompt;
      },
      set(val) {
        console.debug('set prompt', val);
        this.$store.commit('kling/setConfig', {
          ...this.$store.state.kling?.config,
          negative_prompt: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = DEFAULT_NEGATIVE_PROMPT;
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
    justify-content: space-between; // Add this line to move the icon to the right
    position: relative;
    .title {
      font-size: 14px;
      margin-bottom: 10px;
    }
  }
  .info {
    margin-left: auto; // Ensure the icon stays on the right
  }
}
</style>
