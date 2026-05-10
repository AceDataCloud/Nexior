<template>
  <el-dialog v-model="editing" :title="title" width="480px" class="edit-dialog">
    <div class="edit-body">
      <p v-if="tip" class="tip">{{ tip }}</p>
      <div v-if="value.length === 0" class="empty">
        <span class="empty-text">{{ $t('site.message.editUsersEmpty') }}</span>
      </div>
      <ul v-else class="user-list">
        <li v-for="(item, idx) in value" :key="`${item}-${idx}`" class="user-list__item">
          <user-chip :user-id="item" />
          <el-icon class="user-list__remove" @click="onRemove(idx)">
            <close />
          </el-icon>
        </li>
      </ul>

      <el-divider class="user-divider">{{ $t('site.title.addUser') }}</el-divider>

      <el-input
        ref="input"
        v-model="query"
        :placeholder="placeholder"
        clearable
        @input="onQueryChange"
        @clear="onClear"
      />
      <div v-if="query.trim()" class="preview">
        <template v-if="state === 'loading'">
          <span class="preview-empty">{{ $t('common.status.loading') }}</span>
        </template>
        <template v-else-if="state === 'missing'">
          <el-icon class="preview-icon"><warning-filled /></el-icon>
          <span class="preview-empty">{{ $t('site.message.userNotFound') }}</span>
        </template>
        <template v-else-if="resolved">
          <user-chip :user-id="resolved.id" />
          <el-button size="small" round type="primary" :disabled="alreadyAdded" class="preview-add" @click="onAdd">
            {{ alreadyAdded ? $t('site.message.userAlreadyAdded') : $t('site.button.addUser') }}
          </el-button>
        </template>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button round @click="onCancel">{{ $t('common.button.cancel') }}</el-button>
        <el-button round type="primary" @click="onConfirm">{{ $t('common.button.confirm') }}</el-button>
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
import { ElDialog, ElInput, ElButton, ElIcon, ElDivider, ElMessage } from 'element-plus';
import { Edit, Close, WarningFilled } from '@element-plus/icons-vue';
import UserChip from '@/components/site/UserChip.vue';
import { userOperator } from '@/operators';
import type { IUserPublic } from '@/models';
import type { IUserResolveQuery } from '@/operators/user';

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const PHONE_RE = /^\+?[\d\s\-()]{6,}$/;

function classify(input: string): keyof IUserResolveQuery {
  const value = input.trim();
  if (UUID_RE.test(value)) return 'id';
  if (value.includes('@')) return 'email';
  if (PHONE_RE.test(value)) return 'phone';
  return 'username';
}

export default defineComponent({
  name: 'EditUsers',
  components: {
    ElDialog,
    ElInput,
    ElButton,
    ElIcon,
    ElDivider,
    Edit,
    Close,
    WarningFilled,
    UserChip
  },
  props: {
    modelValue: {
      type: Array as PropType<string[]>,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    placeholder: {
      type: String,
      default: ''
    },
    tip: {
      type: String,
      default: ''
    },
    min: {
      type: Number,
      default: undefined
    },
    minErrorMessage: {
      type: String,
      default: ''
    }
  },
  emits: ['confirm', 'cancel'],
  data() {
    return {
      editing: false,
      value: [...(this.modelValue || [])] as string[],
      query: '',
      resolved: null as IUserPublic | null,
      state: 'idle' as 'idle' | 'loading' | 'ready' | 'missing',
      debounceTimer: null as ReturnType<typeof setTimeout> | null,
      requestSeq: 0
    };
  },
  computed: {
    alreadyAdded(): boolean {
      return !!this.resolved?.id && this.value.includes(this.resolved.id);
    }
  },
  methods: {
    onOpen() {
      this.editing = true;
      this.value = [...(this.modelValue || [])];
      this.query = '';
      this.resolved = null;
      this.state = 'idle';
    },
    onRemove(idx: number) {
      this.value.splice(idx, 1);
    },
    onClear() {
      this.resolved = null;
      this.state = 'idle';
    },
    onQueryChange() {
      this.scheduleLookup(400);
    },
    scheduleLookup(delay: number) {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }
      const trimmed = this.query.trim();
      if (!trimmed) {
        this.resolved = null;
        this.state = 'idle';
        return;
      }
      this.state = 'loading';
      this.debounceTimer = setTimeout(() => this.runLookup(trimmed), delay);
    },
    async runLookup(value: string) {
      const seq = ++this.requestSeq;
      const key = classify(value);
      try {
        const res = await userOperator.resolve({ [key]: value } as IUserResolveQuery);
        if (seq !== this.requestSeq) return;
        this.resolved = res.data;
        this.state = 'ready';
      } catch {
        if (seq !== this.requestSeq) return;
        this.resolved = null;
        this.state = 'missing';
      }
    },
    onAdd() {
      if (this.state !== 'ready' || !this.resolved?.id) return;
      if (this.value.includes(this.resolved.id)) return;
      this.value.push(this.resolved.id);
      this.query = '';
      this.resolved = null;
      this.state = 'idle';
    },
    onCancel() {
      this.editing = false;
      this.$emit('cancel');
    },
    onConfirm() {
      if (this.min !== undefined && this.value.length < this.min) {
        if (this.minErrorMessage) ElMessage.error(this.minErrorMessage);
        return;
      }
      this.$emit('confirm', [...this.value]);
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
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .tip {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    margin: 0;
  }

  .empty {
    padding: 12px;
    text-align: center;
    color: var(--el-text-color-secondary);
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    background: var(--el-fill-color-light);
  }

  .empty-text {
    font-size: 12px;
  }

  .user-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .user-list__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    background: var(--el-fill-color-blank);
  }

  .user-list__remove {
    cursor: pointer;
    color: var(--el-text-color-secondary);
    font-size: 14px;
    margin-left: 8px;
    flex-shrink: 0;

    &:hover {
      color: var(--el-color-danger);
    }
  }

  .user-divider {
    margin: 4px 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .preview {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 28px;
    padding: 6px 10px;
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    background: var(--el-fill-color-light);
  }

  .preview-empty {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .preview-icon {
    color: var(--el-color-warning);
    font-size: 14px;
  }

  .preview-add {
    margin-left: auto;
  }
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
  width: 100%;
}
</style>
