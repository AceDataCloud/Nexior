<template>
  <el-dialog
    :model-value="!!request"
    width="480px"
    :title="$t('codingBridge.permission.title')"
    :close-on-click-modal="false"
    :show-close="false"
    center
  >
    <div v-if="request" class="content">
      <p class="text-sm text-[var(--app-text-subtle)] mb-3">
        {{ $t('codingBridge.permission.subtitle') }}
      </p>
      <div class="rounded-md border border-[var(--app-border-subtle)] p-3 mb-3">
        <div class="flex items-center gap-2 font-medium">
          <font-awesome-icon icon="fa-solid fa-code" />
          <span>{{ request.display_name || request.title || request.tool }}</span>
        </div>
        <p v-if="request.description" class="text-xs text-[var(--app-text-subtle)] mt-1">
          {{ request.description }}
        </p>
        <pre
          v-if="hasInput"
          class="mt-2 text-xs overflow-x-auto whitespace-pre-wrap break-words text-[var(--app-text-subtle)] max-h-[200px]"
          >{{ inputText }}</pre
        >
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <el-button round @click="onDeny">
          <font-awesome-icon icon="fa-solid fa-xmark" class="mr-1" />
          {{ $t('codingBridge.permission.deny') }}
        </el-button>
        <el-button type="primary" round @click="onAllow">
          <font-awesome-icon icon="fa-solid fa-check" class="mr-1" />
          {{ $t('codingBridge.permission.allow') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDialog, ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ICodingBridgePermissionRequest } from '@/models';
import { isAskUserQuestionRequest } from './askUserQuestion';

export default defineComponent({
  name: 'CodingBridgePermissionDialog',
  components: {
    ElDialog,
    ElButton,
    FontAwesomeIcon
  },
  computed: {
    request(): ICodingBridgePermissionRequest | undefined {
      // AskUserQuestion requests render as an inline question card in the
      // session view, so the generic allow/deny modal skips them.
      return (this.$store.state.codingBridge?.permissions ?? []).find(
        (item: ICodingBridgePermissionRequest) => !isAskUserQuestionRequest(item)
      );
    },
    hasInput(): boolean {
      return !!this.request?.input && Object.keys(this.request.input).length > 0;
    },
    inputText(): string {
      try {
        return JSON.stringify(this.request?.input, null, 2);
      } catch {
        return String(this.request?.input ?? '');
      }
    }
  },
  methods: {
    onAllow() {
      if (!this.request) {
        return;
      }
      this.$store.dispatch('codingBridge/resolvePermission', {
        request_id: this.request.request_id,
        decision: 'allow'
      });
    },
    onDeny() {
      if (!this.request) {
        return;
      }
      this.$store.dispatch('codingBridge/resolvePermission', {
        request_id: this.request.request_id,
        decision: 'deny'
      });
    }
  }
});
</script>
