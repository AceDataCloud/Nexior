<template>
  <el-alert v-if="show" :title="content" type="success" center :closable="false" show-icon class="alert-success-info">
  </el-alert>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElAlert } from 'element-plus';

export default defineComponent({
  name: 'SuccessInfo',
  components: {
    ElAlert
  },
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
  emits: ['update:show'],
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
.alert-success-info {
  position: fixed;
  top: 110px;
  left: 50%;
  transform: translate(-50%, 0);
  z-index: 100;
  width: 10%;
}
</style>
