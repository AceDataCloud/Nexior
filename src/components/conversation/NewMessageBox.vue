<template>
  <el-input v-model="value" placeholder="Type something">
    <template #suffix>
      <el-icon class="el-input__icon" @click="$emit('send')">send</el-icon>
    </template>
  </el-input>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput, ElButton, ElIcon } from 'element-plus';
export default defineComponent({
  name: 'NewMessageBox',
  components: {
    ElInput,
    ElIcon
  },
  props: {
    modelValue: {
      type: String,
      required: true
    }
  },
  emits: ['send', 'update:modelValue'],
  data() {
    return {
      value: this.modelValue
    };
  },
  computed: {
    conversationId() {
      return this.$route.params?.id?.toString();
    }
  },
  watch: {
    value(val) {
      console.log('ccc', this.value);
      this.$emit('update:modelValue', this.value);
    }
  }
});
</script>
