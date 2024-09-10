<template>
  <div class="field">
    <div class="box">
      <h2 class="title">{{ $t('suno.name.prompt') }}</h2>
      <info-icon :content="$t('suno.description.prompt')" class="info" />
    </div>
    <el-input
      v-model="prompt"
      :rows="3"
      type="textarea"
      class="prompt"
      :placeholder="$t('suno.placeholder.prompt')"
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
        return this.$store.state.suno?.config?.prompt;
      },
      set(val) {
        console.debug('set prompt', val);
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
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
      margin-bottom: 10px;
    }
  }
}
</style>
