<template>
  <div class="field">
    <div class="title-container">
      <h2 class="title">{{ $t('suno.name.prompt') }}</h2>
      <info-icon :content="$t('suno.description.prompt')" class="info" />
      <el-switch
        v-model="instrumental"
        class="ml-2"
        inline-prompt
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
        active-text="有歌词"
        inactive-text="无歌词"
      />
    </div>
    <el-input
      v-model="prompt"
      :rows="3"
      type="textarea"
      class="prompt"
      :placeholder="$t('suno.placeholder.prompt')"
      :maxlength="300"
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
  .title-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    .title {
      font-size: 14px;
      margin-bottom: 10px;
    }
    .right-aligned-switch {
      float: left;
    }
  }
}
</style>
