<template>
  <div>
    <h2 class="title">{{ $t('midjourney.name.prompt') }}</h2>
    <el-input
      v-model="value"
      :rows="3"
      class="prompt"
      type="textarea"
      :placeholder="$t('midjourney.placeholder.prompt')"
    />
    <p class="description">
      {{ $t('midjourney.description.prompt') }}
    </p>
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
.description {
  font-size: 12px;
  margin-top: 10px;
  color: var(--el-text-color-regular);
}
</style>

<style lang="scss">
.prompt {
  border: none;
  textarea {
    border-radius: 15px !important;
    resize: none;
    font-size: 14px;
    padding: 10px 15px;
  }
}
</style>
