<template>
  <div>
    <div class="flex flex-col">
      <el-icon class="check"><check /></el-icon>
      <div class="icon">
        <font-awesome-icon icon="fa-solid fa-wallet" />
      </div>
      <div class="text-left">
        <p class="description">
          <span v-if="!application.service">{{ $t('application.title.globalBalance') }}</span>
          <span v-else>{{ $t('application.title.applicationBalance', { service: application.service?.title }) }}</span>
        </p>
        <p class="value">
          {{ application?.remaining_amount?.toFixed(6) }}
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
    <div class="flex flex-col justify-center align-middle gap-2">
      <div class="flex">
        <el-button size="small" round @click.stop="onGoUsage">
          {{ $t('application.button.usage') }}
        </el-button>
      </div>
      <div class="flex">
        <el-button type="primary" round size="small" @click.stop="onBuyMore">
          {{ $t('application.button.buyMore') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { IApplication } from '@/models';
import { defineComponent } from 'vue';
import { ElButton, ElIcon } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ROUTE_CONSOLE_APPLICATION_EXTRA, ROUTE_CONSOLE_USAGE_LIST } from '@/router';
import { Check } from '@element-plus/icons-vue';

export default defineComponent({
  name: 'ApplicationInfo',
  components: {
    FontAwesomeIcon,
    ElButton,
    Check,
    ElIcon
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
  methods: {
    onGoUsage() {
      this.$router.push({
        name: ROUTE_CONSOLE_USAGE_LIST,
        query: {
          application_id: this.application.id
        }
      });
    },
    onBuyMore() {
      // open in new tab for this url
      const url = this.$router.resolve({
        name: ROUTE_CONSOLE_APPLICATION_EXTRA,
        params: {
          id: this.application.id
        }
      }).href;
      window.open(url, '_blank');
    }
  }
});
</script>

<style lang="scss" scoped>
.item {
  cursor: pointer;
  padding: 20px;
  width: 400px;
  background-color: var(--el-bg-color);
  border-radius: 15px;
  border: 1px solid var(--el-border-color-lighter);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  &.active {
    .check {
      visibility: visible;
    }
  }
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
