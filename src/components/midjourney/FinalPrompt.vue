<template>
  <div class="mb-4">
    <h2 class="title">{{ $t('midjourney.field.finalPrompt') }}</h2>
    <el-alert :title="modelValue" :closable="false" class="pt-3" />
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
  margin-bottom: 10px;
  width: 30%;
}
.prompt {
  color: #333;
  font-size: 16px;
  flex: 1;
}
</style>
