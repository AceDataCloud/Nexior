<template>
  <div class="field">
    <div class="box">
      <span class="text-sm font-bold">{{ $t('midjourney.name.prompt') }}</span>
      <info-icon :content="$t('midjourney.description.prompt')" class="info" />
    </div>
    <el-input
      v-model="prompt"
      :rows="3"
      resize="none"
      type="textarea"
      class="prompt"
      :placeholder="$t('midjourney.placeholder.prompt')"
      :maxlength="200"
      show-word-limit
    />
  </div>
</template>

<script>
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
  data() {
    return {};
  },
  computed: {
    prompt: {
      get() {
        return this.$store.state.midjourney?.config.prompt;
      },
      set(val) {
        console.debug('set prompt', val);
        this.$store.commit('midjourney/setConfig', {
          ...this.$store.state.midjourney?.config,
          prompt: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = DEFAULT_PROMPT;
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
    position: relative;
    .title {
      font-size: 14px;
    }
  }
}
</style>
