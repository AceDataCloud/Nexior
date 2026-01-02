<template>
  <div class="field">
    <div class="box">
      <h2 class="title font-bold">{{ $t('kling.name.prompt') }}</h2>
      <info-icon :content="$t('kling.description.prompt')" class="info" />
    </div>
    <el-input v-model="prompt" :rows="3" type="textarea" class="prompt" :placeholder="$t('kling.placeholder.prompt')" />
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
