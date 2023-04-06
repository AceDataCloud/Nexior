<template>
  <el-input
    v-model="value"
    :placeholder="$t('conversation.message.newMessagePlaceholder')"
    @keyup.enter="$emit('send')"
  >
    <template #suffix>
      <font-awesome-icon icon="fa-regular fa-paper-plane" class="icon-send" @click="$emit('send')" />
    </template>
  </el-input>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput, ElButton, ElIcon } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'NewMessageBox',
  components: {
    ElInput,
    ElIcon,
    FontAwesomeIcon
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
      this.$emit('update:modelValue', this.value);
    },
    modelValue(val) {
      if (val !== this.value) {
        this.value = val;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.icon-send {
  cursor: pointer;
}
</style>
