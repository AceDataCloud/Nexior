<template>
  <el-dialog v-model="editing" :title="title" width="520px" class="edit-dialog">
    <div class="edit-body">
      <div v-if="working.length === 0" class="empty">
        <span class="empty-text">{{ $t('site.message.editUsersEmpty') }}</span>
      </div>
      <ul v-else class="chip-list">
        <li v-for="id in working" :key="id" class="chip-item">
          <user-chip :user-id="id" />
          <el-icon class="chip-remove" :title="removeLabel" @click="onRemove(id)">
            <close />
          </el-icon>
        </li>
      </ul>
      <el-divider class="divider">{{ $t('site.title.addUser') }}</el-divider>
      <user-picker :exclude-ids="working" @select="onAdd" />
      <p class="tip">{{ $t('site.message.editUserHint') }}</p>
      <p v-if="errorMessage" class="error">
        <el-icon class="error-icon"><warning-filled /></el-icon>
        {{ errorMessage }}
      </p>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button round @click="onCancel">{{ $t('common.button.cancel') }}</el-button>
        <el-button round type="primary" :disabled="!canConfirm" @click="onConfirm">
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
import { defineComponent, type PropType } from 'vue';
import { ElDialog, ElButton, ElIcon, ElDivider } from 'element-plus';
import { Edit, Close, WarningFilled } from '@element-plus/icons-vue';
import UserChip from '@/components/site/UserChip.vue';
import UserPicker from '@/components/site/UserPicker.vue';
import type { IUserPublic } from '@/models';

export default defineComponent({
  name: 'EditUsers',
  components: {
    ElDialog,
    ElButton,
    ElIcon,
    ElDivider,
    Edit,
    Close,
    WarningFilled,
    UserChip,
    UserPicker
  },
  props: {
    modelValue: {
      type: Array as PropType<string[]>,
      default: () => []
    },
    title: {
      type: String,
      required: true
    },
    min: {
      type: Number,
      default: 0
    },
    minErrorMessage: {
      type: String,
      default: ''
    },
    removeLabel: {
      type: String,
      default: ''
    }
  },
  emits: ['confirm', 'cancel'],
  data() {
    return {
      editing: false,
      working: [] as string[],
      errorMessage: ''
    };
  },
  computed: {
    canConfirm(): boolean {
      return this.working.length >= this.min;
    }
  },
  methods: {
    onOpen() {
      this.editing = true;
      this.working = [...this.modelValue];
      this.errorMessage = '';
    },
    onAdd(user: IUserPublic) {
      if (!user?.id) return;
      if (this.working.includes(user.id)) return;
      this.working = [...this.working, user.id];
      this.errorMessage = '';
    },
    onRemove(id: string) {
      if (this.working.length <= this.min) {
        this.errorMessage = this.minErrorMessage;
        return;
      }
      this.working = this.working.filter((x) => x !== id);
    },
    onCancel() {
      this.editing = false;
      this.$emit('cancel');
    },
    onConfirm() {
      if (!this.canConfirm) {
        this.errorMessage = this.minErrorMessage;
        return;
      }
      this.$emit('confirm', this.working);
      this.editing = false;
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
  gap: 8px;
  width: 100%;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 8px;
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  background: var(--el-fill-color-light);

  .empty-text {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
}

.chip-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chip-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-blank);

  .chip-remove {
    cursor: pointer;
    color: var(--el-text-color-secondary);
    font-size: 14px;

    &:hover {
      color: var(--el-color-danger);
    }
  }
}

.divider {
  margin: 4px 0;
}

.tip {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.error {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 12px;
  color: var(--el-color-danger);

  .error-icon {
    font-size: 14px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
  width: 100%;
}
</style>
