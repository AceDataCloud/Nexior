<template>
  <div class="node-list flex flex-col h-full bg-[var(--app-sidebar-bg)] border-r border-[var(--app-border-subtle)]">
    <div class="flex items-center justify-between px-4 py-3 border-b border-[var(--app-border-subtle)]">
      <div class="flex items-center gap-2 font-medium">
        <font-awesome-icon icon="fa-solid fa-laptop-code" />
        <span>{{ $t('codingBridge.nodeList.title') }}</span>
      </div>
      <div class="flex items-center gap-1">
        <notification-toggle />
        <el-button circle size="small" :title="$t('codingBridge.nodeList.refresh')" @click="onRefresh">
          <font-awesome-icon icon="fa-solid fa-rotate-right" />
        </el-button>
        <el-button type="primary" circle size="small" :title="$t('codingBridge.nodeList.pair')" @click="$emit('pair')">
          <font-awesome-icon icon="fa-solid fa-plus" />
        </el-button>
      </div>
    </div>

    <div class="flex items-center gap-2 px-4 py-2 text-xs border-b border-[var(--app-border-subtle)]">
      <span class="inline-block w-2 h-2 rounded-full" :class="connectionDotClass" />
      <span class="text-[var(--app-text-subtle)]">{{ connectionLabel }}</span>
    </div>

    <div class="flex-1 overflow-y-auto">
      <div v-if="!nodes.length" class="p-6 text-center text-sm text-[var(--app-text-subtle)]">
        <p class="mb-3">{{ $t('codingBridge.nodeList.empty') }}</p>
        <el-button type="primary" round size="small" @click="$emit('pair')">
          <font-awesome-icon icon="fa-solid fa-plus" class="mr-1" />
          {{ $t('codingBridge.nodeList.pairFirst') }}
        </el-button>
      </div>
      <ul v-else class="list-none m-0 p-0">
        <li
          v-for="node in nodes"
          :key="node.node_id"
          class="group flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-[var(--app-border-subtle)] hover:bg-[var(--app-content-bg)]"
          :class="{ 'bg-[var(--app-content-bg)]': node.node_id === currentNodeId }"
          @click="onSelect(node.node_id)"
        >
          <font-awesome-icon icon="fa-solid fa-desktop" class="text-[var(--app-text-subtle)]" />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="truncate font-medium">{{ node.name }}</span>
              <span
                class="inline-block w-2 h-2 rounded-full flex-none"
                :class="node.status === 'online' ? 'bg-[var(--el-color-success)]' : 'bg-[var(--app-text-subtle)]'"
                :title="node.status === 'online' ? $t('codingBridge.status.online') : $t('codingBridge.status.offline')"
              />
            </div>
            <div class="text-xs text-[var(--app-text-subtle)] truncate">
              {{ node.status === 'online' ? $t('codingBridge.status.online') : $t('codingBridge.status.offline') }}
            </div>
          </div>
          <el-button
            class="opacity-0 group-hover:opacity-100"
            text
            circle
            size="small"
            :title="$t('codingBridge.nodeList.remove')"
            @click.stop="onDelete(node)"
          >
            <font-awesome-icon icon="fa-solid fa-trash" />
          </el-button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElMessage, ElMessageBox } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ICodingBridgeConnectionStatus, ICodingBridgeNode } from '@/models';
import NotificationToggle from './NotificationToggle.vue';

export default defineComponent({
  name: 'CodingBridgeNodeList',
  components: {
    ElButton,
    FontAwesomeIcon,
    NotificationToggle
  },
  emits: ['pair'],
  computed: {
    nodes(): ICodingBridgeNode[] {
      return this.$store.state.codingBridge?.nodes ?? [];
    },
    currentNodeId(): string | undefined {
      return this.$store.state.codingBridge?.currentNodeId;
    },
    connection(): ICodingBridgeConnectionStatus {
      return this.$store.state.codingBridge?.connection ?? 'disconnected';
    },
    connectionLabel(): string {
      return this.$t(`codingBridge.connection.${this.connection}`) as string;
    },
    connectionDotClass(): string {
      switch (this.connection) {
        case 'connected':
          return 'bg-[var(--el-color-success)]';
        case 'connecting':
          return 'bg-[var(--el-color-warning)]';
        case 'error':
          return 'bg-[var(--el-color-danger)]';
        default:
          return 'bg-[var(--app-text-subtle)]';
      }
    }
  },
  methods: {
    onSelect(nodeId: string) {
      this.$store.dispatch('codingBridge/selectNode', nodeId);
    },
    onRefresh() {
      this.$store.dispatch('codingBridge/getNodes');
    },
    async onDelete(node: ICodingBridgeNode) {
      try {
        await ElMessageBox.confirm(
          this.$t('codingBridge.nodeList.removeConfirm', { name: node.name }) as string,
          this.$t('codingBridge.nodeList.remove') as string,
          {
            confirmButtonText: this.$t('codingBridge.nodeList.remove') as string,
            cancelButtonText: this.$t('common.button.cancel') as string,
            type: 'warning'
          }
        );
      } catch {
        return;
      }
      try {
        await this.$store.dispatch('codingBridge/deleteNode', node.node_id);
        ElMessage.success(this.$t('codingBridge.nodeList.removeSuccess') as string);
      } catch {
        ElMessage.error(this.$t('codingBridge.nodeList.removeFailed') as string);
      }
    }
  }
});
</script>
