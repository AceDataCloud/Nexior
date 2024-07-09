<template>
  <div class="field">
    <h2 class="title">{{ $t('suno.name.prompt') }}</h2>
    <info-icon :content="$t('suno.description.qrw')" class="info" />
    <el-input v-model="value" :rows="3" type="textarea" class="prompt" :placeholder="$t('suno.placeholder.prompt')" />
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
    value: {
      get() {
        return this.$store.state.qrart?.config?.prompt;
      },
      set(val) {
        console.debug('set prompt', val);
        this.$store.commit('qrart/setConfig', {
          ...this.$store.state.qrart?.config,
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
  .title {
    font-size: 14px;
    margin: 0;
    width: 30%;
    margin-bottom: 10px;
  }
}
</style>
