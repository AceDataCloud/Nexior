<template>
  <el-dialog v-model="editing" :title="title" width="400px">
    <el-tag
      v-for="(item, itemKey) in value"
      :key="itemKey"
      closable
      round
      class="mr-2 mb-2"
      :disable-transitions="false"
      @close="onClose(item)"
    >
      {{ item }}
    </el-tag>
    <el-input
      v-if="inputVisible"
      ref="input"
      v-model="inputValue"
      class="block"
      size="small"
      @keyup.enter="onInputConfirm"
      @blur="onInputConfirm"
    />
    <el-button v-else round class="block" size="small" @click="onNewItem"> + </el-button>
    <span class="block tip">{{ tip }}</span>
    <template #footer>
      <span class="dialog-footer">
        <el-button round @click="onCancel">{{ $t('common.button.cancel') }}</el-button>
        <el-button round type="primary" @click="onConfirm">{{ $t('common.button.confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>
  <span class="edit" @click="editing = true">
    <el-icon class="icon">
      <edit />
    </el-icon>
  </span>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDialog, ElInput, ElButton, ElIcon, ElTag, ElMessage } from 'element-plus';
import { Edit } from '@element-plus/icons-vue';

export default defineComponent({
  name: 'EditText',
  components: {
    ElDialog,
    ElInput,
    ElButton,
    ElIcon,
    ElTag,
    Edit
  },
  props: {
    modelValue: {
      type: Array,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    placeholder: {
      type: String,
      required: true
    },
    tip: {
      type: String,
      default: undefined
    },
    min: {
      type: Number,
      default: undefined
    },
    minErrorMessage: {
      type: String,
      default: undefined
    }
  },
  emits: ['confirm', 'cancel'],
  data() {
    return {
      inputVisible: false,
      inputValue: '',
      editing: false,
      value: JSON.parse(JSON.stringify(this.modelValue))
    };
  },
  methods: {
    onCancel() {
      this.editing = false;
    },
    onConfirm() {
      if (this.min !== undefined && this.value.length < this.min) {
        ElMessage.error(this.minErrorMessage);
        return;
      }
      this.$emit('confirm', this.value);
      this.editing = false;
    },
    onClose(item: any) {
      this.value.splice(this.value.indexOf(item), 1);
    },
    onInputConfirm() {
      const inputValue = this.inputValue;
      if (inputValue) {
        this.value.push(inputValue);
      }
      this.inputVisible = false;
      this.inputValue = '';
    },
    onNewItem() {
      this.inputVisible = true;
      this.$nextTick(() => {
        // @ts-ignore
        this.$refs.input.focus();
      });
    }
  }
});
</script>

<style lang="scss">
.edit {
  cursor: pointer;
  margin-left: 5px;
  position: relative;
  top: 2px;
  .icon {
    font-size: 14px;
  }
}
.tip {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
