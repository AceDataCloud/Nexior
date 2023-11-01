<template>
  <div class="mb-4">
    <h2 class="title">最终绘图指令</h2>
    <el-alert :title="modelValue" :closable="false" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElAlert } from 'element-plus';
export default defineComponent({
  name: 'FinalPrompt',
  components: {
    ElAlert
  },
  props: {
    modelValue: {
      type: String,
      default: undefined
    }
  },
  data() {},
  mounted() {}
});
</script>

<style lang="scss" scoped>
.title {
  font-size: 14px;
  margin-bottom: 0;
  width: 30%;
}
.prompt {
  color: #333;
  font-size: 16px;
  flex: 1;
}
</style>
