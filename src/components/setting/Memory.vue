<template>
  <div class="settings-list memory-setting">
    <p class="hint muted">{{ $t('common.settings.memoryIntro') }}</p>

    <div class="memory-toggle-row">
      <div>
        <div class="toggle-title">{{ $t('common.settings.memoryEnabled') }}</div>
        <div class="hint muted">{{ $t('common.settings.memoryEnabledHint') }}</div>
      </div>
      <el-switch
        :model-value="memoryEnabled"
        :disabled="!memoryReady || updatingMemory"
        :loading="updatingMemory"
        @change="onMemoryEnabledChange"
      />
    </div>

    <p v-if="!token" class="hint muted">{{ $t('common.settings.memoryNeedsChat') }}</p>

    <template v-else>
      <div class="section-head">
        <h3>{{ $t('common.settings.memoryStored') }}</h3>
        <el-button v-if="entries.length" size="small" text type="danger" :loading="clearing" @click="onClearAll">
          {{ $t('common.settings.memoryClearAll') }}
        </el-button>
      </div>

      <div v-loading="loading">
        <el-empty v-if="!loading && !entries.length" :description="$t('common.settings.memoryEmpty')" />
        <ul v-else class="rows">
          <li v-for="entry in entries" :key="entry.id" class="row memory-row">
            <font-awesome-icon icon="fa-regular fa-lightbulb" class="row-icon" />
            <span class="memory-content">{{ entry.content }}</span>
            <el-button size="small" text type="danger" :loading="removingId === entry.id" @click="onRemove(entry)">
              {{ $t('common.settings.memoryForget') }}
            </el-button>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElEmpty, ElMessage, ElMessageBox, ElSwitch, vLoading } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { memoriesOperator, type IMemoryEntry } from '@/operators/memories';
import type { ICredential } from '@/models';
import { ensureStoreModule } from '@/store/lazy';

export default defineComponent({
  name: 'MemorySetting',
  components: { ElButton, ElEmpty, ElSwitch, FontAwesomeIcon },
  directives: { loading: vLoading },
  data() {
    return {
      loading: false,
      clearing: false,
      removingId: null as string | null,
      memoryReady: false,
      updatingMemory: false,
      entries: [] as IMemoryEntry[]
    };
  },
  computed: {
    memoryEnabled(): boolean {
      return this.$store?.state?.chat?.memoryEnabled !== false;
    },
    // Chat-Application credential token. The chat module is lazy-loaded
    // elsewhere; until it resolves the token can be undefined and we keep
    // the list empty (mirrors the BYOK settings tab).
    token(): string | undefined {
      const credential = this.$store?.state?.chat?.credential as ICredential | undefined;
      return credential?.token;
    }
  },
  watch: {
    token: {
      handler(value?: string) {
        if (value) {
          this.fetch();
        } else {
          this.memoryReady = false;
        }
      }
    }
  },
  async created() {
    await ensureStoreModule('chat');
    if (this.token) await this.fetch();
  },
  methods: {
    async onMemoryEnabledChange(value: string | number | boolean) {
      await ensureStoreModule('chat');
      if (!this.token) return;
      const enabled = value === true;
      if (enabled === this.memoryEnabled) return;
      this.updatingMemory = true;
      try {
        const persisted = await memoriesOperator.setEnabled(this.token, enabled);
        this.$store.commit('chat/setMemoryEnabled', persisted);
      } catch (error) {
        console.error('failed to update memory preference', error);
        ElMessage.error(this.$t('common.settings.memoryError'));
      } finally {
        this.updatingMemory = false;
      }
    },
    async fetch() {
      if (!this.token) return;
      this.memoryReady = false;
      this.loading = true;
      try {
        const profile = await memoriesOperator.getProfile(this.token);
        this.entries = profile.items;
        this.$store.commit('chat/setMemoryEnabled', profile.enabled);
        this.memoryReady = true;
      } catch (error) {
        console.error('failed to load memories', error);
      } finally {
        this.loading = false;
      }
    },
    async onRemove(entry: IMemoryEntry) {
      if (!this.token) return;
      this.removingId = entry.id;
      try {
        await memoriesOperator.remove(this.token, entry.id);
        this.entries = this.entries.filter((e) => e.id !== entry.id);
      } catch (error) {
        console.error('failed to forget memory', error);
        ElMessage.error(this.$t('common.settings.memoryError'));
      } finally {
        this.removingId = null;
      }
    },
    async onClearAll() {
      if (!this.token) return;
      try {
        await ElMessageBox.confirm(
          this.$t('common.settings.memoryClearConfirm'),
          this.$t('common.settings.memoryClearAll'),
          {
            type: 'warning',
            confirmButtonText: this.$t('common.settings.memoryClearAll'),
            cancelButtonText: this.$t('common.button.cancel')
          }
        );
      } catch {
        return; // user cancelled
      }
      this.clearing = true;
      try {
        await memoriesOperator.clear(this.token);
        this.entries = [];
      } catch (error) {
        console.error('failed to clear memories', error);
        ElMessage.error(this.$t('common.settings.memoryError'));
      } finally {
        this.clearing = false;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.memory-setting {
  .hint {
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
  }

  .muted {
    color: var(--el-text-color-secondary, #909399);
  }

  .memory-toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 0;
    border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);

    .toggle-title {
      margin-bottom: 2px;
      font-weight: 600;
    }

    :deep(.el-switch) {
      flex-shrink: 0;
    }
  }

  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
    }
  }

  // Bordered card so the list reads as one contained group instead of text
  // running flush against the dialog; rows are separated by hairline dividers.
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
    border: 1px solid var(--el-border-color-lighter, #ebeef5);
    border-radius: 8px;
    overflow: hidden;
  }

  .memory-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 14px;
    border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
    transition: background-color 0.15s ease;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: var(--el-fill-color-light, #f5f7fa);
    }

    .row-icon {
      flex-shrink: 0;
      margin-top: 3px;
      color: var(--el-text-color-secondary, #909399);
    }

    .memory-content {
      flex: 1;
      min-width: 0;
      line-height: 1.6;
      overflow-wrap: break-word;
    }

    :deep(.el-button) {
      flex-shrink: 0;
    }
  }
}
</style>
