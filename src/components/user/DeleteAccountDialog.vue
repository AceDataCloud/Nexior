<template>
  <el-dialog
    :model-value="visible"
    :title="$t('common.nav.deleteAccount')"
    width="90%"
    align-center
    class="delete-account-dialog"
    @update:model-value="$emit('update:visible', $event)"
    @closed="onClosed"
  >
    <el-alert
      :title="$t('common.message.deleteAccountWarning')"
      type="error"
      :closable="false"
      show-icon
      class="mb-3"
    />
    <p class="delete-consequences">{{ $t('common.message.deleteAccountConsequences') }}</p>
    <p class="delete-type-prompt">{{ $t('common.message.deleteAccountTypePrompt') }}</p>
    <p class="delete-username">{{ user.username }}</p>
    <el-input
      v-model="deleteConfirmText"
      :placeholder="$t('common.message.deleteAccountPlaceholder')"
      autocomplete="off"
    />
    <template #footer>
      <el-button round @click="$emit('update:visible', false)">
        {{ $t('common.button.cancel') }}
      </el-button>
      <el-button
        type="danger"
        round
        :disabled="!deleteConfirmMatched"
        :loading="deleting"
        @click="confirmDeleteAccount"
      >
        {{ $t('common.button.deletePermanently') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElMessage, ElDialog, ElInput, ElButton, ElAlert } from 'element-plus';
import { ROUTE_INDEX } from '@/router';
import { userOperator } from '@/operators';

export default defineComponent({
  name: 'DeleteAccountDialog',
  components: {
    ElDialog,
    ElInput,
    ElButton,
    ElAlert
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:visible'],
  data() {
    return {
      deleteConfirmText: '',
      deleting: false
    };
  },
  computed: {
    user() {
      return this.$store.getters.user;
    },
    // Require the user to type their exact username to unlock the
    // irreversible delete — a locale-independent guard against misclicks.
    deleteConfirmMatched(): boolean {
      const username = this.$store.getters.user?.username;
      return !!username && this.deleteConfirmText.trim() === username;
    }
  },
  methods: {
    async confirmDeleteAccount() {
      if (!this.deleteConfirmMatched || this.deleting) {
        return;
      }
      this.deleting = true;
      try {
        await userOperator.deleteMe();
        this.deleting = false;
        this.$emit('update:visible', false);
        ElMessage.success(this.$t('common.message.deleteAccountSuccess').toString());
        await this.$store.dispatch('logout');
        this.$router.push({ name: ROUTE_INDEX });
      } catch {
        this.deleting = false;
        ElMessage.error(this.$t('common.message.deleteAccountFailed').toString());
      }
    },
    onClosed() {
      this.deleteConfirmText = '';
    }
  }
});
</script>

<style lang="scss" scoped>
.delete-account-dialog {
  .mb-3 {
    margin-bottom: 12px;
  }
  .delete-consequences {
    margin: 12px 0;
    font-size: 13px;
    line-height: 1.6;
    color: var(--el-text-color-regular);
  }
  .delete-type-prompt {
    margin: 12px 0 4px;
    font-size: 13px;
  }
  .delete-username {
    margin: 0 0 10px;
    font-weight: 700;
    font-size: 15px;
    word-break: break-all;
    color: var(--el-color-danger);
  }
}
</style>
