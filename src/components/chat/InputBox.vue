<template>
  <div class="input-box">
    <el-input
      v-model="value"
      :rows="2"
      type="textarea"
      :placeholder="$t('chat.message.newMessagePlaceholder')"
      @keydown.enter.exact.prevent="onSubmit"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput } from 'element-plus';

export default defineComponent({
  name: 'InputBox',
  components: {
    ElInput
  },
  props: {
    modelValue: {
      type: String,
      required: true
    }
  },
  emits: ['update:modelValue', 'submit'],
  data() {
    return {
      value: this.modelValue
    };
  },
  watch: {
    value(val) {
      this.$emit('update:modelValue', val);
    },
    modelValue(val) {
      if (val !== this.value) {
        this.value = val;
      }
    }
  },
  methods: {
    onSubmit() {
      this.$emit('submit', this.value);
    }
  }
});
</script>

<style lang="scss" scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  .top {
    display: flex;
    flex-direction: column;
  }
  .bottom {
    display: flex;
    flex-direction: column;
  }
}
</style>
