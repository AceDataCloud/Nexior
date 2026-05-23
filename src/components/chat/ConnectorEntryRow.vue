<template>
  <div class="connector-entry-row" :class="{ 'is-connected': entry.status === 'connected' }">
    <div class="entry-icon" aria-hidden="true">
      <font-awesome-icon v-if="entry.status === 'connected'" icon="fa-solid fa-circle-check" class="icon-connected" />
      <font-awesome-icon v-else icon="fa-solid fa-plug" class="icon-unconnected" />
    </div>
    <div class="entry-text">
      <div class="entry-name">{{ displayName }}</div>
      <div v-if="entry.context" class="entry-context">{{ entry.context }}</div>
    </div>
    <div class="entry-action">
      <span v-if="entry.status === 'connected'" class="status-pill connected">
        {{ $t('chat.consent.statusConnected') }}
      </span>
      <el-button v-else-if="entry.install_url" type="primary" size="small" :disabled="disabled" @click="onAuthorize">
        {{ $t('chat.consent.authorize') }}
      </el-button>
      <span v-else class="status-pill unconnected">
        {{ $t('chat.consent.statusUnconnected') }}
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import type { IConsentRequestEntry } from '@/models';

export default defineComponent({
  name: 'ConnectorEntryRow',
  components: { ElButton, FontAwesomeIcon },
  props: {
    entry: {
      type: Object as PropType<IConsentRequestEntry>,
      required: true
    },
    /** When true, hide the action button (resolved card / no-op state). */
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['authorize'],
  computed: {
    /**
     * Catalog ids look like `acedatacloud/suno` or `notion`. Strip the
     * `acedatacloud/` namespace so the bare service name (`suno`) is the
     * primary label; fall back to the raw slug for third-party rows.
     */
    displayName(): string {
      const slug = this.entry.connector ?? '';
      if (slug.startsWith('acedatacloud/')) {
        return slug.slice('acedatacloud/'.length);
      }
      return slug;
    }
  },
  methods: {
    onAuthorize() {
      this.$emit('authorize', this.entry);
    }
  }
});
</script>

<style lang="scss" scoped>
.connector-entry-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  transition: background 160ms ease;

  &.is-connected {
    background: var(--el-color-success-light-9);
    border-color: var(--el-color-success-light-7);
  }
}

.entry-icon {
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--el-bg-color);
  font-size: 14px;
}

.icon-connected {
  color: var(--el-color-success);
}

.icon-unconnected {
  color: var(--el-color-info);
}

.entry-text {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.entry-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-context {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-action {
  flex: 0 0 auto;
}

.status-pill {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
}

.status-pill.connected {
  background: var(--el-color-success-light-8);
  color: var(--el-color-success);
}

.status-pill.unconnected {
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
}
</style>
