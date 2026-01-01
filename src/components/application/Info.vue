<template>
  <div>
    <div class="flex flex-col min-w-0">
      <el-icon class="check"><check /></el-icon>
      <div v-if="showId" class="app-id-row">
        <div class="icon !mb-0 flex-shrink-0">
          <font-awesome-icon icon="fa-solid fa-wallet" />
        </div>
        <div class="app-id-line">
          <span class="app-id-label">{{ $t('application.field.id') }}:</span>
          <span class="app-id-value">{{ application.id }}</span>
          <copy-to-clipboard v-if="application.id" :content="application.id" class="copy-small" />
        </div>
      </div>
      <div v-else class="icon">
        <font-awesome-icon icon="fa-solid fa-wallet" />
      </div>
      <div class="text-left">
        <p class="description">
          <span v-if="!application.service">{{ $t('application.title.globalBalance') }}</span>
          <span v-else>{{ $t('application.title.applicationBalance', { service: application.service?.title }) }}</span>
        </p>
        <p class="value">
          {{ application?.remaining_amount?.toFixed(2) }}
          {{ $t(`service.unit.` + (application?.service?.unit || 'credit') + 's') }}
        </p>
        <p class="description2">
          <span v-if="application.type === 'Period'">
            {{ $t('application.field.expiredAt') }}: {{ $dayjs.format(application.expired_at) }}
          </span>
          <span v-else>
            {{ $t('application.message.neverExpire') }}
          </span>
        </p>
      </div>
    </div>
    <div class="actions">
      <el-button size="small" round @click.stop="$emit('usage', application)">
        <font-awesome-icon icon="fa-solid fa-chart-line" class="mr-1 text-[11px]" />
        {{ $t('application.button.usage') }}
      </el-button>
      <el-button type="primary" round size="small" @click.stop="$emit('buy', application)">
        <font-awesome-icon icon="fa-solid fa-coins" class="mr-1 text-[11px]" />
        {{ $t('application.button.buyMore') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { IApplication } from '@/models';
import { defineComponent } from 'vue';
import { ElButton, ElIcon } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { Check } from '@element-plus/icons-vue';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';

export default defineComponent({
  name: 'ApplicationInfo',
  components: {
    FontAwesomeIcon,
    ElButton,
    Check,
    ElIcon,
    CopyToClipboard
  },
  props: {
    application: {
      type: Object as () => IApplication,
      required: true
    },
    showType: {
      type: Boolean,
      default: false
    },
    showId: {
      type: Boolean,
      default: false
    }
  },
  emits: ['buy', 'usage']
});
</script>

<style lang="scss" scoped>
.item {
  cursor: pointer;
  padding: 20px;
  width: 100%;
  background-color: var(--el-bg-color);
  border-radius: 15px;
  border: 1px solid var(--el-border-color-lighter);
  display: flex;
  gap: 16px;
  justify-content: space-between;
  align-items: center;
  position: relative;
  box-sizing: border-box;
  &.active {
    .check {
      visibility: visible;
    }
  }
}

.app-id-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  width: 100%;
  min-width: 0;
}

.app-id-line {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 18px;
}

.app-id-label {
  white-space: nowrap;
}

.app-id-value {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  // text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-small {
  display: inline-flex;
  align-items: center;
  color: inherit;
}

.copy-small :deep(.icon-copy),
.copy-small :deep(.icon-check) {
  margin-left: 0;
  font-size: 11px;
}

.actions {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.check {
  color: var(--el-color-white);
  font-size: 20px;
  background-color: var(--el-color-primary);
  border-radius: 50%;
  padding: 5px;
  position: absolute;
  top: 10px;
  right: 10px;
  visibility: hidden;
}

.icon {
  height: 40px;
  width: 40px;
  line-height: 40px;
  border-radius: 50%;
  background-color: var(--el-bg-color-page);
  text-align: center;
  margin-bottom: 10px;
  color: var(--el-color-primary);
}

.value {
  font-weight: 600;
  font-size: 30px;
}
.description {
  color: var(--el-text-color-regular);
  font-size: 14px;
}
.description2 {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin-top: 5px;
}
</style>
