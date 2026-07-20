<template>
  <el-button
    v-if="supported"
    circle
    size="small"
    :type="enabled ? 'primary' : 'default'"
    :title="enabled ? $t('codingBridge.notify.disable') : $t('codingBridge.notify.enable')"
    :disabled="busy"
    :aria-label="enabled ? $t('codingBridge.notify.disable') : $t('codingBridge.notify.enable')"
    @click="onToggle"
  >
    <!-- Swap the notification icon for a spinner while busy because Element Plus's
          built-in loading spinner renders cramped inside a small circle button. -->
    <loading-icon v-if="busy" class="adc-icon-spin" :size="'1em' as any" aria-hidden="true" focusable="false" />
    <notification-icon v-else-if="enabled" :size="'1em' as any" aria-hidden="true" focusable="false" />
    <notification-off-icon v-else :size="'1em' as any" aria-hidden="true" focusable="false" />
  </el-button>
</template>

<script lang="ts">
import { LoadingIcon, NotificationIcon, NotificationOffIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElButton, ElMessage } from 'element-plus';
import { notifyPermission, webNotificationsSupported } from '@/utils/codingBridgeNotify';
import { isNative } from '@/utils/surface';

export default defineComponent({
  name: 'CodingBridgeNotificationToggle',
  components: {
    LoadingIcon,
    NotificationIcon,
    NotificationOffIcon,
    ElButton
  },
  data() {
    return {
      enabled: false,
      busy: false
    };
  },
  computed: {
    supported(): boolean {
      // Native always supports notifications; web needs the Notification API.
      return isNative() || webNotificationsSupported();
    }
  },
  mounted() {
    // Reflect a prior grant so the bell shows the right state on load.
    this.enabled = !isNative() && notifyPermission() === 'granted';
  },
  methods: {
    async onToggle() {
      this.busy = true;
      try {
        if (this.enabled) {
          await this.$store.dispatch('codingBridge/disableNotifications');
          this.enabled = false;
          ElMessage.success(this.$t('codingBridge.notify.disabled') as string);
          return;
        }
        const result = await this.$store.dispatch('codingBridge/enableNotifications');
        if (result === 'enabled') {
          this.enabled = true;
          ElMessage.success(this.$t('codingBridge.notify.enabled') as string);
        } else if (result === 'denied') {
          ElMessage.warning(this.$t('codingBridge.notify.denied') as string);
        } else {
          ElMessage.warning(this.$t('codingBridge.notify.unsupported') as string);
        }
      } catch {
        ElMessage.error(this.$t('codingBridge.notify.failed') as string);
      } finally {
        this.busy = false;
      }
    }
  }
});
</script>
