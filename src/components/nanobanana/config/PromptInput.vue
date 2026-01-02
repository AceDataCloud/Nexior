<template>
  <div class="field">
    <div class="box">
      <h2 class="title font-bold">{{ $t('nanobanana.name.prompt') }}</h2>
      <info-icon :content="$t('nanobanana.description.prompt')" class="info" />
    </div>
    <el-input
      v-model="prompt"
      :rows="3"
      type="textarea"
      class="prompt"
      :placeholder="$t('nanobanana.placeholder.prompt')"
    />
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
        return this.$store.state.nanobanana?.config?.prompt;
      },
      set(val: string) {
        console.debug('set prompt', val);
        this.$store.commit('nanobanana/setConfig', {
          ...this.$store.state.nanobanana?.config,
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
    .title {
      font-size: 14px;
      margin-bottom: 10px;
    }
  }
  .info {
    margin-left: auto;
  }
  .prompt {
    resize: none;
  }
}
</style>
