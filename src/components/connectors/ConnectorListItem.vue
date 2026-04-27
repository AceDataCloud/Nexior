<template>
  <div class="row" :class="{ selected }" @click="$emit('click')">
    <div class="icon">
      <font-awesome-icon :icon="item.icon || 'fa-solid fa-plug'" />
    </div>
    <div class="meta">
      <div class="name-row">
        <span class="name">{{ item.name }}</span>
        <el-tag v-if="item.isBuiltin" size="small" type="success" effect="plain" round class="custom-tag">
          {{ $t('connector.badge.builtin') }}
        </el-tag>
        <el-tag v-else-if="item.isCustom" size="small" type="info" effect="plain" round class="custom-tag">
          {{ $t('connector.badge.custom') }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ElTag } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { IConnectorItem } from '@/components/connectors/types';

export default defineComponent({
  name: 'ConnectorListItem',
  components: { ElTag, FontAwesomeIcon },
  props: {
    item: { type: Object as PropType<IConnectorItem>, required: true },
    selected: { type: Boolean, default: false }
  },
  emits: ['click']
});
</script>

<style scoped lang="scss">
.row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  margin: 0 8px;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;

  &:hover {
    background: var(--el-fill-color-light);
  }

  &.selected {
    background: var(--el-fill-color);
  }
}

.icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: var(--el-text-color-primary);
  flex-shrink: 0;
}

.meta {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 6px;

  .name {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .custom-tag {
    font-size: 10px;
    height: 16px;
    padding: 0 4px;
    line-height: 14px;
  }
}
</style>
