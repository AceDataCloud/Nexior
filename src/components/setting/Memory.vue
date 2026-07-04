<template>
  <div class="settings-list memory-setting">
    <p class="hint muted">{{ $t('common.settings.memoryIntro') }}</p>

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
import { ElButton, ElEmpty, ElMessage, ElMessageBox, vLoading } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { memoriesOperator, type IMemoryEntry } from '@/operators/memories';
import type { ICredential } from '@/models';

export default defineComponent({
  name: 'MemorySetting',
  components: { ElButton, ElEmpty, FontAwesomeIcon },
  directives: { loading: vLoading },
  data() {
    return {
      loading: false,
      clearing: false,
      removingId: null as string | null,
      entries: [] as IMemoryEntry[]
    };
  },
  computed: {
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
      immediate: true,
      handler(value?: string) {
        if (value) {
          this.fetch();
        }
      }
    }
  },
  methods: {
    async fetch() {
      if (!this.token) return;
      this.loading = true;
      try {
        this.entries = await memoriesOperator.list(this.token);
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
  .memory-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .memory-content {
      flex: 1;
      word-break: break-word;
    }

    .row-icon {
      opacity: 0.6;
    }
  }
}
</style>
