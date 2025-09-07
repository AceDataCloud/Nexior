<template>
  <el-alert
    v-if="show"
    :title="content"
    type="success"
    center
    :closable="false"
    show-icon
    class="alert-success-info fixed top-[110px] left-1/2 -translate-x-1/2 z-[100] w-[10%]"
  >
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
    show(val) {
      if (val) {
        setTimeout(() => {
          this.$emit('update:show', false);
        }, 2000);
      }
    }
  }
});
</script>

