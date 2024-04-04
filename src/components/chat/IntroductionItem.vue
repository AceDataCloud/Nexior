<template>
  <div class="introduction-item">
    {{ content }}
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ConversationIntroductionItem',
  props: {
    content: {
      type: String,
      required: true
    }
  },
  data() {
    return {};
  },
  computed: {}
});
</script>

<style lang="scss" scoped>
.introduction-item {
  font-size: 14px;
  background-color: var(--el-fill-color-extra-light);
  color: var(--el-text-color-primary);
  border: 1px solid var(--el-border-color-lighter);
  padding: 10px 20px;
  border-radius: 20px;
}
</style>
