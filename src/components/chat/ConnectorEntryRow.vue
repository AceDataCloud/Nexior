<template>
  <div class="connector-entry-row" :class="{ 'is-connected': entry.status === 'connected' }">
    <div class="entry-icon" aria-hidden="true">
      <img v-if="iconUrl" :src="iconUrl" class="icon-logo" :alt="displayName" @error="onLogoError" />
      <font-awesome-icon
        v-else-if="entry.status === 'connected'"
        icon="fa-solid fa-circle-check"
        class="icon-connected"
      />
      <font-awesome-icon v-else icon="fa-solid fa-plug" class="icon-unconnected" />
    </div>
    <div class="entry-text">
      <div class="entry-name">{{ displayName }}</div>
      <div v-if="secondaryText" class="entry-context">{{ secondaryText }}</div>
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
import type { IConnectorCatalogSummary } from './connectorCatalogCache';

export default defineComponent({
  name: 'ConnectorEntryRow',
  components: { ElButton, FontAwesomeIcon },
  props: {
    entry: {
      type: Object as PropType<IConsentRequestEntry>,
      required: true
    },
    /** Catalog row resolved by the parent via `connectorCatalogCache`.
     *  When `null` the row falls back to the plug-icon + slug display
     *  used before PR-3b (e.g. while the fetch is in flight or after a
     *  cache miss). */
    catalog: {
      type: Object as PropType<IConnectorCatalogSummary | null>,
      default: null
    },
    /** When true, hide the action button (resolved card / no-op state). */
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['authorize'],
  data() {
    return {
      // Flips to `true` if `<img>` errors so the template falls back to
      // the FA icon — common case is a stale `icon_url` (404 / CORS).
      logoError: false
    };
  },
  computed: {
    /** Slug-derived label used when the catalog row hasn't arrived yet.
     *  Strips the `acedatacloud/` namespace so first-party connectors
     *  read as `suno` / `producer` instead of the full identifier. */
    fallbackName(): string {
      const slug = this.entry.connector ?? '';
      if (slug.startsWith('acedatacloud/')) {
        return slug.slice('acedatacloud/'.length);
      }
      return slug;
    },
    displayName(): string {
      return this.catalog?.name?.trim() || this.fallbackName;
    },
    iconUrl(): string {
      if (this.logoError) return '';
      return this.catalog?.icon_url || '';
    },
    /** Two-line layout: the model-supplied `context` wins because it's
     *  hand-written for THIS conversation. When absent, fall back to
     *  the catalog's `short_description` so the row still has a useful
     *  subtitle. */
    secondaryText(): string {
      if (this.entry.context && this.entry.context.trim()) {
        return this.entry.context;
      }
      return this.catalog?.short_description || '';
    }
  },
  watch: {
    'catalog.icon_url'() {
      // Catalog refresh — re-allow the image to render in case the
      // previous load errored on a stale URL.
      this.logoError = false;
    }
  },
  methods: {
    onAuthorize() {
      this.$emit('authorize', this.entry);
    },
    onLogoError() {
      this.logoError = true;
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
  background: #fff;
  border: 1px solid rgba(17, 24, 39, 0.08);
  font-size: 14px;
  overflow: hidden;
}

.icon-logo {
  width: 72%;
  height: 72%;
  object-fit: contain;
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
