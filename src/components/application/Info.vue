<template>
  <div>
    <div class="flex flex-col min-w-0">
      <el-icon class="check"><check /></el-icon>
      <div v-if="showId" class="flex justify-start items-start gap-2 mb-2 w-full min-w-0">
        <div class="icon !mb-0 flex-shrink-0">
          <font-awesome-icon icon="fa-solid fa-wallet" />
        </div>
        <div class="min-w-0 flex-1">
          <span class="text-[var(--el-text-color-regular)] text-[12px] leading-[20px]">
            {{ $t('application.field.id') }}
          </span>
          <span class="flex items-center gap-1 min-w-0">
            <span class="text-[var(--el-text-color-regular)] text-[12px] break-all min-w-0">
              {{ application.id }}
            </span>
            <copy-to-clipboard v-if="application.id" :content="application.id" class="inline-block flex-shrink-0" />
          </span>
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
        {{ $t('application.button.usage') }}
      </el-button>
      <el-button type="primary" round size="small" @click.stop="$emit('buy', application)">
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
  justify-content: space-between;
  align-items: center;
  position: relative;
  &.active {
    .check {
      visibility: visible;
    }
  }
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
