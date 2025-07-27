<template>
  <div class="field">
    <div class="title-container">
      <h2 class="title font-bold">{{ $t('suno.name.title') }}</h2>
      <info-icon :content="$t('suno.description.title')" class="info" />
    </div>
    <el-input
      v-model="title"
      :rows="3"
      type="textarea"
      class="title"
      :placeholder="$t('suno.placeholder.title')"
      :maxlength="80"
      show-word-limit
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';

export const DEFAULT_PROMPT = '';

export default defineComponent({
  name: 'TitleInput',
  components: {
    ElInput,
    InfoIcon
  },
  data() {
    return {};
  },
  computed: {
    title: {
      get() {
        return this.$store.state.suno?.config?.title;
      },
      set(val: string) {
        console.debug('set title', val);
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          title: val
        });
      }
    },
    instrumental: {
      get() {
        return this.$store.state.suno?.config?.instrumental;
      },
      set(val: boolean) {
        console.debug('set instrumental', val);
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          instrumental: val
        });
      }
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
