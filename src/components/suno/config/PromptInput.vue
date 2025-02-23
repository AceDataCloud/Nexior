<template>
  <div class="field">
    <div class="box">
      <div class="title-info">
        <h2 class="title font-bold">{{ $t('suno.name.prompt') }}</h2>
        <info-icon :content="$t('suno.description.prompt')" class="info" />
      </div>
      <div class="instrumental">
        <el-switch v-model="instrumental" class="value mr-2" />
        <h2 class="title inline-block">{{ $t('suno.name.instrumental') }}</h2>
      </div>
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
import { ElInput, ElSwitch } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';

export const DEFAULT_PROMPT = '';

export default defineComponent({
  name: 'PromptInput',
  components: {
    ElInput,
    ElSwitch,
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
    },
    instrumental: {
      get() {
        return this.$store.state.suno?.config?.instrumental;
      },
      set(val) {
        console.debug('set instrumental', val);
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          instrumental: val
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
    justify-content: space-between;
    position: relative;
    .title-info {
      display: flex;
      align-items: center;
    }
    .instrumental {
      right: 10px;
      z-index: 1000;
    }
    .title {
      font-size: 14px;
      margin-bottom: 10px;
    }
  }
}
</style>
