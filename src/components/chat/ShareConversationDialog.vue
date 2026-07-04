<template>
  <el-dialog v-model="visible" width="460px" :title="$t('chat.share.dialogTitle')" :close-on-click-modal="true">
    <p class="share-desc">{{ $t('chat.share.description') }}</p>

    <div v-if="localShareId" class="share-linked">
      <div class="share-url-row">
        <el-input v-model="shareUrl" readonly class="share-url" @focus="selectAll" />
        <el-button type="primary" @click="onCopy">
          {{ copied ? $t('chat.share.copied') : $t('chat.share.copy') }}
        </el-button>
      </div>
      <el-button link type="danger" class="share-disable" :loading="disabling" @click="onDisable">
        <font-awesome-icon icon="fa-solid fa-link-slash" class="mr-1" />
        {{ $t('chat.share.disable') }}
      </el-button>
    </div>

    <div v-else class="share-create">
      <el-button type="primary" round :loading="creating" @click="onCreate">
        <font-awesome-icon icon="fa-solid fa-link" class="mr-1" />
        {{ $t('chat.share.createLink') }}
      </el-button>
    </div>

    <template #footer>
      <el-button @click="visible = false">{{ $t('common.button.close') }}</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDialog, ElInput, ElButton, ElMessage } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import copy from 'copy-to-clipboard';
import { chatOperator } from '@/operators';

export default defineComponent({
  name: 'ShareConversationDialog',
  components: {
    ElDialog,
    ElInput,
    ElButton,
    FontAwesomeIcon
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    conversationId: {
      type: String,
      default: undefined
    },
    shareId: {
      type: String,
      default: undefined
    }
  },
  emits: ['update:modelValue', 'update:shareId'],
  data() {
    return {
      localShareId: this.shareId,
      creating: false,
      disabling: false,
      copied: false
    };
  },
  computed: {
    visible: {
      get(): boolean {
        return this.modelValue;
      },
      set(value: boolean) {
        this.$emit('update:modelValue', value);
      }
    },
    token(): string | undefined {
      return this.$store.state.chat?.credential?.token;
    },
    shareUrl(): string {
      if (!this.localShareId) return '';
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      return `${origin}/share/${this.localShareId}`;
    }
  },
  watch: {
    shareId(value?: string) {
      this.localShareId = value;
    },
    modelValue(open: boolean) {
      // Re-sync from the prop each time the dialog opens so it reflects the
      // conversation's current share state.
      if (open) {
        this.localShareId = this.shareId;
        this.copied = false;
      }
    }
  },
  methods: {
    selectAll(event: FocusEvent) {
      (event.target as HTMLInputElement)?.select?.();
    },
    async onCreate() {
      if (!this.token) {
        ElMessage.error(this.$t('chat.share.needLogin'));
        return;
      }
      if (!this.conversationId) {
        ElMessage.error(this.$t('chat.share.noConversation'));
        return;
      }
      this.creating = true;
      try {
        const { data } = await chatOperator.shareConversation(this.conversationId, { token: this.token });
        const newId = data?.share_id;
        if (!newId) throw new Error('missing share_id');
        this.localShareId = newId;
        this.$emit('update:shareId', newId);
      } catch (e) {
        console.error('shareConversation failed', e);
        ElMessage.error(this.$t('chat.share.createFailed'));
      } finally {
        this.creating = false;
      }
    },
    onCopy() {
      if (!this.shareUrl) return;
      copy(this.shareUrl, { debug: false });
      this.copied = true;
      ElMessage.success(this.$t('chat.share.copied'));
      setTimeout(() => {
        this.copied = false;
      }, 2500);
    },
    async onDisable() {
      if (!this.token || !this.conversationId) {
        this.localShareId = undefined;
        this.$emit('update:shareId', undefined);
        return;
      }
      this.disabling = true;
      try {
        await chatOperator.unshareConversation(this.conversationId, { token: this.token });
        this.localShareId = undefined;
        this.$emit('update:shareId', undefined);
        ElMessage.success(this.$t('chat.share.disabled'));
      } catch (e) {
        console.error('unshareConversation failed', e);
        ElMessage.error(this.$t('chat.share.disableFailed'));
      } finally {
        this.disabling = false;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.share-desc {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.6;
  margin: 0 0 16px;
}
.share-url-row {
  display: flex;
  gap: 8px;
  align-items: center;

  .share-url {
    flex: 1;
  }
}
.share-disable {
  margin-top: 14px;
}
.share-create {
  display: flex;
  justify-content: center;
  padding: 8px 0 4px;
}
</style>
