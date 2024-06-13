<template>
  <div>
    <h2 class="title">{{ $t('midjourney.name.ignore') }}</h2>
    <el-input
      v-model="value"
      :rows="1"
      class="ignore"
      type="textarea"
      :placeholder="$t('midjourney.placeholder.ignore')"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElInput } from 'element-plus';

export default defineComponent({
  name: 'PromptInput',
  components: {
    ElInput
  },
  props: {
    modelValue: {
      type: String,
      default: undefined
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      value: this.modelValue
    };
  },
  watch: {
    modelValue(val) {
      if (val !== this.value) {
        this.value = val;
      }
    },
    value(val) {
      this.$emit('update:modelValue', val);
    }
  },
  mounted() {}
});
</script>

<style lang="scss" scoped>
.title {
  font-size: 14px;
  margin-bottom: 10px;
}
.field {
  display: flex;
  flex-direction: row;
  align-items: center;

  .value {
    flex: 1;
  }
}
</style>

<style lang="scss">
.ignore {
  border: none;
  textarea {
    font-size: 14px;
    border-radius: 15px !important;
    border: none;
    resize: none;
    padding: 10px 15px;
  }
}
</style>
