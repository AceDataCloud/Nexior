<template>
  <div class="mark"></div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'AnsweringMark',
  data() {
    return {};
  },
  computed: {
    conversationId() {
      return this.$route.params?.conversationId?.toString();
    }
  }
});
</script>

<style lang="scss">
@keyframes blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
.mark {
  width: 2px;
  height: 16px;
  margin-top: 3px;
  background-color: var(--el-text-color-primary);
  animation: blink 1s infinite;
}
</style>
