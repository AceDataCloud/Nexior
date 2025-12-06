<template>
  <el-dialog v-model="editing" :title="title" width="400px" class="edit-dialog">
    <div class="edit-body">
      <el-input v-model="value" :placeholder="placeholder" />
    </div>
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
import { ElDialog, ElInput, ElButton, ElIcon } from 'element-plus';
import { Edit } from '@element-plus/icons-vue';

export default defineComponent({
  name: 'EditText',
  components: {
    ElDialog,
    ElInput,
    ElButton,
    ElIcon,
    Edit
  },
  props: {
    modelValue: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    placeholder: {
      type: String,
      required: true
    }
  },
  emits: ['confirm', 'cancel'],
  data() {
    return {
      editing: false,
      value: this.modelValue
    };
  },
  methods: {
    onCancel() {
      this.editing = false;
    },
    onConfirm() {
      this.$emit('confirm', this.value);
      this.editing = false;
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

.edit-dialog {
  .el-dialog__header {
    display: flex;
    justify-content: center;
    position: relative;
    padding-right: 48px;
  }

  .el-dialog__title {
    width: 100%;
    text-align: center;
    font-weight: 600;
  }

  .el-dialog__headerbtn {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
  }

  .el-dialog__body {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
  }

  .edit-body {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .el-input {
    max-width: 320px;
  }

  .dialog-footer {
    display: flex;
    justify-content: center;
    gap: 12px;
    width: 100%;
  }
}
</style>
