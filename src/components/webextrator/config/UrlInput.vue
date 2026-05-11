<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('webextrator.name.url') }}</h2>
    <el-input
      v-model="url"
      type="textarea"
      :rows="2"
      class="prompt"
      :placeholder="$t('webextrator.placeholder.url')"
      @keydown.enter.exact.prevent="onEnter"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput } from 'element-plus';

export default defineComponent({
  name: 'UrlInput',
  components: {
    ElInput
  },
  emits: ['submit'],
  computed: {
    url: {
      get(): string {
        return this.$store.state.webextrator?.config?.url || '';
      },
      set(val: string) {
        this.$store.commit('webextrator/setConfig', {
          ...this.$store.state.webextrator?.config,
          url: val
        });
      }
    }
  },
  methods: {
    onEnter() {
      this.$emit('submit');
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  .title {
    font-size: 14px;
    margin-bottom: 8px;
  }
  .prompt {
    resize: none;
  }
}
</style>
