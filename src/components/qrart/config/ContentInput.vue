<template>
  <div class="field">
    <h2 class="title">{{ $t('qrart.name.content') }}</h2>
    <el-input v-model="value" size="small" class="content" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElInput } from 'element-plus';

export const DEFAULT_content = '';

export default defineComponent({
  name: 'contentInput',
  components: {
    ElInput
  },
  data() {
    return {};
  },
  computed: {
    value: {
      get() {
        return this.$store.state.qrart.config?.content;
      },
      set(val) {
        console.debug('set content', val);
        this.$store.commit('qrart/setConfig', {
          ...this.$store.state.qrart.config,
          content: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = DEFAULT_content;
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: row;
  align-items: center;

  .title {
    font-size: 14px;
    margin: 0;
    width: 30%;
  }
  .value {
    flex: 1;
  }
}
</style>
