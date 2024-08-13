<template>
  <div class="field">
    <div class="box">
      <h2 class="title">{{ $t('suno.name.lyrics') }}</h2>
      <info-icon :content="$t('suno.description.lyrics')" class="info" />
    </div>
    <el-input
      v-if="config?.action !== 'extend'"
      v-model="lyric"
      :rows="3"
      type="textarea"
      class="lyrics"
      :placeholder="$t('suno.placeholder.lyrics')"
      :maxlength="3000"
      show-word-limit
    />
    <el-input
      v-else
      v-model="lyric"
      :rows="3"
      type="textarea"
      class="lyrics"
      :placeholder="$t('suno.placeholder.extend.lyrics')"
      :maxlength="3000"
      show-word-limit
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElInput } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';

export const DEFAULT_LYRIC = '';

export default defineComponent({
  name: 'LyricInput',
  components: {
    ElInput,
    InfoIcon
  },
  data() {
    return {};
  },
  computed: {
    lyric: {
      get() {
        return this.$store.state.suno?.config?.lyric;
      },
      set(val) {
        console.debug('set lyric', val);
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          lyric: val
        });
      }
    },
    config() {
      return this.$store.state.suno?.config;
    }
  },
  mounted() {
    if (!this.value) {
      this.value = DEFAULT_LYRIC;
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
