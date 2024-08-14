<template>
  <div class="field">
    <h2 class="title">{{ $t('qrart.name.prompt') }}</h2>
    <el-input v-model="value" :rows="3" type="textarea" class="prompt" :placeholder="$t('qrart.placeholder.prompt')" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElInput } from 'element-plus';

export const DEFAULT_PROMPT = '';

export default defineComponent({
  name: 'PromptInput',
  components: {
    ElInput
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
