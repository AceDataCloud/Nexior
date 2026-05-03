<template>
  <div class="field">
    <div class="box">
      <h2 class="title font-bold">{{ $t('kling.name.motionPrompt') }}</h2>
      <info-icon :content="$t('kling.description.motionPrompt')" class="info" />
    </div>
    <el-input
      v-model="prompt"
      :rows="3"
      type="textarea"
      class="prompt"
      :placeholder="$t('kling.placeholder.motionPrompt')"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';

export default defineComponent({
  name: 'MotionPromptInput',
  components: {
    ElInput,
    InfoIcon
  },
  computed: {
    prompt: {
      get(): string {
        return this.$store.state.kling?.motionConfig?.prompt || '';
      },
      set(val: string) {
        this.$store.commit('kling/setMotionConfig', {
          ...this.$store.state.kling?.motionConfig,
          prompt: val
        });
      }
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
  .info {
    margin-left: auto;
  }
}
</style>
