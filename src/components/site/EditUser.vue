<template>
  <el-dialog v-model="editing" :title="title" width="480px" class="edit-dialog">
    <div class="edit-body">
      <user-picker @select="onSelect" />
      <div v-if="resolved" class="preview">
        <user-chip :user-id="resolved.id" />
      </div>
      <p v-else class="tip">{{ $t('site.message.editUserHint') }}</p>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button round @click="onCancel">{{ $t('common.button.cancel') }}</el-button>
        <el-button v-if="modelValue" round type="warning" @click="onClearValue">
          {{ $t('common.button.delete') }}
        </el-button>
        <el-button round type="primary" :disabled="!resolved" @click="onConfirm">
          {{ $t('common.button.confirm') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
  <span class="edit" @click="onOpen">
    <el-icon class="icon">
      <edit />
    </el-icon>
  </span>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDialog, ElButton, ElIcon } from 'element-plus';
import { Edit } from '@element-plus/icons-vue';
import UserChip from '@/components/site/UserChip.vue';
import UserPicker from '@/components/site/UserPicker.vue';
import type { IUserPublic } from '@/models';

export default defineComponent({
  name: 'EditUser',
  components: {
    ElDialog,
    ElButton,
    ElIcon,
    Edit,
    UserChip,
    UserPicker
  },
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      required: true
    }
  },
  emits: ['confirm', 'cancel'],
  data() {
    return {
      editing: false,
      resolved: null as IUserPublic | null
    };
  },
  methods: {
    onOpen() {
      this.editing = true;
      this.resolved = null;
    },
    onSelect(user: IUserPublic) {
      this.resolved = user;
    },
    onCancel() {
      this.editing = false;
      this.$emit('cancel');
    },
    onClearValue() {
      this.$emit('confirm', '');
      this.editing = false;
    },
    onConfirm() {
      if (this.resolved?.id) {
        this.$emit('confirm', this.resolved.id);
        this.editing = false;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.edit {
  cursor: pointer;
  margin-left: 5px;
  position: relative;
  top: 2px;

  .icon {
    font-size: 14px;
  }
}

.edit-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.tip {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.preview {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding: 8px 10px;
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  background: var(--el-fill-color-light);
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
  width: 100%;
}
</style>
