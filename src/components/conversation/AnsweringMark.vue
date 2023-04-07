<template>
  <div class="box"></div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'MessageContent',
  data() {
    return {};
  },
  computed: {
    conversationId() {
      return this.$route.params?.id?.toString();
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
.box {
  width: 5px;
  height: 20px;
  margin-top: 3px;
  background-color: black;
  animation: blink 1s infinite;
}
</style>
