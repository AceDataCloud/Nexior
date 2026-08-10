<template>
  <el-dropdown-item v-if="bridge" class="py-2" :disabled="busy" @click="onCheck">
    <refresh-icon
      class="mr-2"
      :class="{ 'animate-spin': busy }"
      :size="'1em' as any"
      aria-hidden="true"
      focusable="false"
    />
    {{ label }}
  </el-dropdown-item>
</template>

<script lang="ts">
import { RefreshIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElDropdownItem, ElMessage, ElMessageBox } from 'element-plus';
import { desktopBridge, type UpdaterState } from '@/utils/desktop';

export default defineComponent({
  name: 'UpdateMenuItem',
  components: { ElDropdownItem, RefreshIcon },
  data() {
    return {
      state: null as UpdaterState | null,
      offState: null as (() => void) | null,
      promptedVersion: null as string | null,
      manualCheck: false
    };
  },
  computed: {
    bridge() {
      return desktopBridge()?.updater;
    },
    busy() {
      return ['checking', 'available', 'downloading'].includes(this.state?.phase ?? '');
    },
    label() {
      if (this.state?.phase === 'checking') return this.$t('common.update.checking');
      if (this.state?.phase === 'available')
        return this.$t('common.update.available', { version: this.state.availableVersion });
      if (this.state?.phase === 'downloading') {
        return this.$t('common.update.downloading', { percent: this.state.percent ?? 0 });
      }
      if (this.state?.phase === 'downloaded')
        return this.$t('common.update.ready', { version: this.state.availableVersion });
      return this.$t('common.update.check');
    }
  },
  async mounted() {
    if (!this.bridge) return;
    this.offState = this.bridge.onState(this.onState);
    this.onState(await this.bridge.getState());
  },
  unmounted() {
    this.offState?.();
  },
  methods: {
    async onCheck() {
      if (!this.bridge) return;
      if (this.state?.phase === 'downloaded') {
        await this.promptInstall(this.state);
        return;
      }
      this.manualCheck = true;
      this.onState(await this.bridge.check());
    },
    onState(state: UpdaterState) {
      this.state = state;
      if (state.phase === 'downloaded') {
        void this.promptInstall(state);
      } else if (this.manualCheck && state.phase === 'up-to-date') {
        ElMessage.success(this.$t('common.update.upToDate', { version: state.currentVersion }).toString());
        this.manualCheck = false;
      } else if (this.manualCheck && state.phase === 'unsupported') {
        ElMessage.info(this.$t('common.update.unsupported').toString());
        this.manualCheck = false;
      } else if (this.manualCheck && state.phase === 'error') {
        ElMessage.error(this.errorMessage(state.errorCode));
        this.manualCheck = false;
      }
    },
    errorMessage(code: UpdaterState['errorCode']) {
      if (code === 'feed_unavailable') return this.$t('common.update.feedUnavailable').toString();
      if (code === 'network_error') return this.$t('common.update.networkError').toString();
      return this.$t('common.update.failed').toString();
    },
    async promptInstall(state: UpdaterState) {
      if (!this.bridge || this.promptedVersion === state.availableVersion) return;
      this.promptedVersion = state.availableVersion ?? state.currentVersion;
      try {
        await ElMessageBox.confirm(
          this.$t('common.update.installMessage', { version: state.availableVersion }).toString(),
          this.$t('common.update.installTitle').toString(),
          {
            confirmButtonText: this.$t('common.update.restartInstall').toString(),
            cancelButtonText: this.$t('common.update.later').toString(),
            type: 'info'
          }
        );
        await this.bridge.install();
      } catch {
        // The downloaded update stays ready; clicking the menu item asks again.
        this.promptedVersion = null;
      }
    }
  }
});
</script>
