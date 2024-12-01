<template>
  <div class="field">
    <div class="title-container">
      <h2 class="title">{{ $t('suno.name.style') }}</h2>
      <info-icon :content="$t('suno.description.style')" class="info" />
    </div>
    <el-input
      v-model="style"
      :rows="3"
      type="textarea"
      class="style"
      :placeholder="$t('suno.placeholder.style')"
      :maxlength="200"
      show-word-limit
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElInput } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';

export default defineComponent({
  name: 'StyleInput',
  components: {
    ElInput,
    InfoIcon
  },
  data() {
    return {};
  },
  computed: {
    style: {
      get() {
        return this.$store.state.suno?.config?.style;
      },
      set(val) {
        console.debug('set style', val);
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          style: val
        });
      }
    },
    config() {
      return this.$store.state.suno?.config;
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
