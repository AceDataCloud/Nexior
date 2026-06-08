<template>
  <el-dialog
    :model-value="visible"
    :title="$t('codingBridge.directory.title')"
    width="520px"
    append-to-body
    @update:model-value="onVisibleChange"
    @open="onOpen"
  >
    <div class="flex flex-col gap-2">
      <!-- Current path + parent navigation -->
      <div class="flex items-center gap-2 min-w-0">
        <el-button
          size="small"
          circle
          :disabled="!listing || !listing.parent || loading"
          :title="$t('codingBridge.directory.up')"
          @click="goParent"
        >
          <font-awesome-icon icon="fa-solid fa-arrow-up" />
        </el-button>
        <span class="text-xs text-[var(--app-text-subtle)] truncate flex-1" dir="ltr">
          {{ listing ? listing.path : '…' }}
        </span>
        <el-button
          size="small"
          circle
          :disabled="loading"
          :title="$t('codingBridge.directory.refresh')"
          @click="refresh"
        >
          <font-awesome-icon icon="fa-solid fa-rotate-right" :spin="loading" />
        </el-button>
      </div>

      <!-- Listing -->
      <div
        class="h-72 overflow-y-auto border border-[var(--app-border-subtle)] rounded-md divide-y divide-[var(--app-border-subtle)]"
      >
        <div
          v-if="loading && !listing"
          class="h-full flex items-center justify-center text-sm text-[var(--app-text-subtle)]"
        >
          {{ $t('codingBridge.directory.loading') }}
        </div>
        <div
          v-else-if="listing && listing.error"
          class="h-full flex items-center justify-center text-sm text-[var(--el-color-danger)]"
        >
          {{ listing.error }}
        </div>
        <template v-else>
          <button
            v-for="entry in directories"
            :key="entry.path"
            type="button"
            class="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--app-content-hover-bg)]"
            @click="openDir(entry.path)"
          >
            <font-awesome-icon icon="fa-solid fa-folder" class="text-[var(--el-color-warning)]" />
            <span class="truncate" dir="ltr">{{ entry.name }}</span>
          </button>
          <div
            v-for="entry in files"
            :key="entry.path"
            class="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--app-text-subtle)]"
          >
            <font-awesome-icon icon="fa-solid fa-file" />
            <span class="truncate" dir="ltr">{{ entry.name }}</span>
          </div>
          <div
            v-if="isEmpty"
            class="h-full flex items-center justify-center text-sm text-[var(--app-text-subtle)] py-8"
          >
            {{ $t('codingBridge.directory.empty') }}
          </div>
        </template>
      </div>
      <p v-if="listing && listing.truncated" class="text-[11px] text-[var(--app-text-subtle)] px-1">
        {{ $t('codingBridge.directory.truncated') }}
      </p>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <el-button round @click="onVisibleChange(false)">{{ $t('common.button.cancel') }}</el-button>
        <el-button type="primary" round :disabled="!listing || !!listing.error" @click="chooseCurrent">
          {{ $t('codingBridge.directory.choose') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDialog, ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ICodingBridgeDirEntry, ICodingBridgeDirListing } from '@/models';

export default defineComponent({
  name: 'CodingBridgeDirectoryDialog',
  components: {
    ElDialog,
    ElButton,
    FontAwesomeIcon
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    // Initial directory to open at; empty browses the node's home directory.
    initialPath: {
      type: String,
      default: ''
    }
  },
  emits: ['update:visible', 'select'],
  computed: {
    listing(): ICodingBridgeDirListing | undefined {
      return this.$store.state.codingBridge?.directory;
    },
    loading(): boolean {
      return this.$store.state.codingBridge?.directoryLoading === true;
    },
    directories(): ICodingBridgeDirEntry[] {
      return (this.listing?.entries ?? []).filter((entry) => entry.type === 'dir');
    },
    files(): ICodingBridgeDirEntry[] {
      return (this.listing?.entries ?? []).filter((entry) => entry.type === 'file');
    },
    isEmpty(): boolean {
      return !!this.listing && !this.listing.error && (this.listing.entries ?? []).length === 0;
    }
  },
  methods: {
    onOpen() {
      this.$store.dispatch('codingBridge/browseDir', this.initialPath || undefined);
    },
    onVisibleChange(value: boolean) {
      this.$emit('update:visible', value);
      if (!value) {
        this.$store.dispatch('codingBridge/clearDirectory');
      }
    },
    openDir(path: string) {
      this.$store.dispatch('codingBridge/browseDir', path);
    },
    goParent() {
      if (this.listing?.parent) {
        this.$store.dispatch('codingBridge/browseDir', this.listing.parent);
      }
    },
    refresh() {
      this.$store.dispatch('codingBridge/browseDir', this.listing?.path || this.initialPath || undefined);
    },
    chooseCurrent() {
      if (this.listing && !this.listing.error) {
        this.$emit('select', this.listing.path);
        this.onVisibleChange(false);
      }
    }
  }
});
</script>
