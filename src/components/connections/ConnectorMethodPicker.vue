<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="min(480px, 94vw)"
    append-to-body
    destroy-on-close
    @close="onClose"
  >
    <p class="picker-intro">{{ $t('connection.method.heading') }}</p>
    <el-tabs v-model="selectedId" class="picker-tabs">
      <el-tab-pane v-for="method in methods" :key="method.id" :name="method.id">
        <template #label>
          <span class="picker-tab-label">
            {{ methodLabel(method) }}
            <span v-if="method.recommended" class="picker-recommended">
              {{ $t('connection.method.recommended') }}
            </span>
          </span>
        </template>
        <p v-if="methodDesc(method)" class="picker-pane-desc">{{ methodDesc(method) }}</p>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button @click="onClose">{{ $t('common.button.cancel') }}</el-button>
      <el-button type="primary" :disabled="!selectedId" @click="onConfirm">
        {{ $t('common.button.confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ElDialog, ElTabs, ElTabPane, ElButton } from 'element-plus';
import {
  IConnectorConnectionMethod,
  IConnectorCatalogItem,
  getConnectorMethods,
  resolveConnectorMethod
} from '@/operators/connection';

interface IData {
  visible: boolean;
  selectedId: string;
}

export default defineComponent({
  name: 'ConnectorMethodPicker',
  components: { ElDialog, ElTabs, ElTabPane, ElButton },
  props: {
    modelValue: { type: Boolean as PropType<boolean>, default: false },
    /** The connector whose connection methods we're choosing between. The
     *  parent only opens this picker when there is more than one method. */
    item: { type: Object as PropType<IConnectorCatalogItem | null>, default: null }
  },
  emits: ['update:modelValue', 'select'],
  data(): IData {
    return {
      visible: this.modelValue,
      selectedId: ''
    };
  },
  computed: {
    methods(): IConnectorConnectionMethod[] {
      return getConnectorMethods(this.item);
    },
    dialogTitle(): string {
      const name = this.item?.name || '';
      return this.$t('connection.method.dialogTitle', { name }) as string;
    }
  },
  watch: {
    modelValue(v: boolean) {
      this.visible = v;
      if (v) {
        // Preselect the recommended method (falls back to the first).
        this.selectedId = resolveConnectorMethod(this.item)?.id || '';
      }
    },
    visible(v: boolean) {
      this.$emit('update:modelValue', v);
    }
  },
  methods: {
    methodLabel(method: IConnectorConnectionMethod): string {
      if (method.label) return method.label;
      return method.id;
    },
    methodDesc(method: IConnectorConnectionMethod): string {
      return method.description || '';
    },
    onConfirm() {
      const method = this.methods.find((m) => m.id === this.selectedId);
      if (!method || !this.item) return;
      this.$emit('select', { item: this.item, method });
      this.visible = false;
    },
    onClose() {
      this.visible = false;
    }
  }
});
</script>

<style lang="scss" scoped>
.picker-intro {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.picker-tabs {
  width: 100%;

  :deep(.el-tabs__header) {
    margin-bottom: 16px;
  }

  :deep(.el-tabs__item) {
    font-size: 14px;
  }
}

.picker-tab-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.picker-recommended {
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 10px;
}

.picker-pane-desc {
  margin: 0;
  min-height: 40px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
</style>
