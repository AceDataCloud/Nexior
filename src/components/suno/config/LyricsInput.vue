<template>
  <div class="field">
    <div class="title-container">
      <h2 class="title">{{ $t('suno.name.lyrics') }}</h2>
      <info-icon :content="$t('suno.description.lyrics')" class="info" />
      <el-switch v-model="instrumental" class="info" active-text="有歌词" inactive-text="无歌词" />
    </div>
    <el-input
      v-model="lyrics"
      :rows="3"
      type="textarea"
      class="lyrics"
      :placeholder="$t('suno.placeholder.lyrics')"
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
    lyrics: {
      get() {
        return this.$store.state.suno?.config?.lyrics;
      },
      set(val) {
        console.debug('set lyrics', val);
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          lyrics: val
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
    .info {
      flex: 1;
    }
  }
}
</style>
