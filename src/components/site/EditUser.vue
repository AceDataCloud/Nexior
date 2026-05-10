<template>
  <el-dialog v-model="editing" :title="title" width="440px" class="edit-dialog">
    <div class="edit-body">
      <el-input
        ref="input"
        v-model="query"
        :placeholder="placeholder"
        clearable
        @input="onQueryChange"
        @clear="onClear"
      />
      <p v-if="tip" class="tip">{{ tip }}</p>
      <p v-else class="tip">{{ $t('site.message.editUserHint') }}</p>
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
        </template>
      </div>
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
import { defineComponent } from 'vue';
import { ElDialog, ElInput, ElButton, ElIcon } from 'element-plus';
import { Edit, WarningFilled } from '@element-plus/icons-vue';
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
  name: 'EditUser',
  components: {
    ElDialog,
    ElInput,
    ElButton,
    ElIcon,
    Edit,
    WarningFilled,
    UserChip
  },
  props: {
    modelValue: {
      type: String,
      default: ''
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
    }
  },
  emits: ['confirm', 'cancel'],
  data() {
    return {
      editing: false,
      query: this.modelValue || '',
      resolved: null as IUserPublic | null,
      state: 'idle' as 'idle' | 'loading' | 'ready' | 'missing',
      debounceTimer: null as ReturnType<typeof setTimeout> | null,
      requestSeq: 0
    };
  },
  computed: {
    canConfirm(): boolean {
      const trimmed = this.query.trim();
      if (!trimmed) return true; // allow clearing the field
      return this.state === 'ready' && !!this.resolved?.id;
    }
  },
  methods: {
    onOpen() {
      this.editing = true;
      this.query = this.modelValue || '';
      this.resolved = null;
      this.state = 'idle';
      if (this.query.trim()) {
        this.scheduleLookup(0);
      }
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
    onCancel() {
      this.editing = false;
      this.$emit('cancel');
    },
    onConfirm() {
      const trimmed = this.query.trim();
      if (!trimmed) {
        this.$emit('confirm', '');
        this.editing = false;
        return;
      }
      if (this.state === 'ready' && this.resolved?.id) {
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
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;

  .tip {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    margin: 0;
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
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
  width: 100%;
}
</style>
