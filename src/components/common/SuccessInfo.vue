<template>
  <el-alert v-if="show" :title="content" type="success" center :closable="false" show-icon class="alert-succcess-info">
  </el-alert>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'SuccessInfo',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    content: {
      type: String,
      default: ''
    }
  },
  watch: {
    show(val, oldVal) {
      if (val) {
        setTimeout(() => {
          this.$emit('update:show', false);
        }, 2000);
      }
    }
  }
});
</script>

<style lang="scss">
.alert-succcess-info {
  position: fixed;
  top: 110px;
  left: 50%;
  transform: translate(-50%, 0);
  z-index: 1000;
  width: 10%;
}
</style>
