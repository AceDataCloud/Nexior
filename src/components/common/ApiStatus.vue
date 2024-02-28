<template>
  <div v-if="initializing && application === undefined">
    <el-skeleton :rows="1" class="text-center">
      <template #template>
        <el-skeleton-item variant="p" class="shimmer" />
      </template>
    </el-skeleton>
  </div>
  <div v-else-if="application" class="status">
    <span class="info">
      {{ $t('common.message.usedCount') }}: {{ application?.used_amount }} {{ $t('common.message.remainingCount') }}:
      {{ application?.remaining_amount }}
    </span>
    <span class="actions">
      <el-button size="small" type="primary" @click="onBuyMore(application)">{{
        $t('common.button.buyMore')
      }}</el-button>
    </span>
  </div>
  <div v-if="needApply && api" class="text-center info">
    <span class="mr-2">{{ $t('chat.message.notApplied') }}</span>
    <span>
      <el-button type="primary" class="btn btn-apply" size="small" @click="confirming = true">
        {{ $t('common.button.apply') }}
      </el-button>
    </span>
    <span class="ml-1">{{ $t('chat.message.tryForFree') }}</span>
    <application-confirm v-model.visible="confirming" :object="api" :type="applicationType.API" @apply="onApply" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { applicationOperator } from '@/operators';
import { ElButton, ElMessage, ElSkeleton, ElSkeletonItem } from 'element-plus';
import ApplicationConfirm from '@/components/application/Confirm.vue';
import { IApplicationType, IApplication, IApplicationDetailResponse } from '@/models';
import { ERROR_CODE_DUPLICATION } from '@/constants/errorCode';
import { ROUTE_CONSOLE_APPLICATION_BUY } from '@/router';

export interface IData {
  confirming: boolean;
  applicationType: typeof IApplicationType;
}

export default defineComponent({
  name: 'ApiStatus',
  components: { ElButton, ApplicationConfirm, ElSkeleton, ElSkeletonItem },
  props: {
    application: {
      type: Object as () => IApplication | undefined,
      required: true
    },
    initializing: {
      type: Boolean,
      default: false
    },
    needApply: {
      type: Boolean,
      default: false
    }
  },
  emits: ['apply', 'refresh'],
  data(): IData {
    return {
      confirming: this.needApply,
      applicationType: IApplicationType
    };
  },
  computed: {
    authenticated() {
      return !!this.$store.state.token.access;
    },
    user() {
      return this.$store.state.user;
    }
  },
  watch: {
    needApply(val) {
      if (val) {
        this.confirming = val;
      }
    }
  },
  methods: {
    onBuyMore(application: IApplication) {
      this.$router.push({
        name: ROUTE_CONSOLE_APPLICATION_BUY,
        params: {
          id: application.id
        }
      });
    },
    onApply() {
      applicationOperator
        .create({
          type: IApplicationType.API,
          service_id: this.service?.id
        })
        .then(({ data: data }: { data: IApplicationDetailResponse }) => {
          ElMessage.success(this.$t('application.message.applySuccessfully'));
          setTimeout(() => {
            this.$emit('refresh');
          }, 2000);
          this.confirming = false;
        })
        .catch((error) => {
          if (error?.response?.data?.code === ERROR_CODE_DUPLICATION) {
            ElMessage.error(this.$t('application.message.alreadyApplied'));
          }
          this.confirming = false;
        });
    }
  }
});
</script>

<style lang="scss" scoped>
.shimmer {
  width: 300px;
  margin: auto;
}
.status {
  display: block;
  width: fit-content;
  margin: auto;
}
.info {
  font-size: 14px;
  color: var(--el-text-color-regular);
  // display: inline-block;
  text-align: center;
}
.actions {
  margin: 0 5px;
  display: inline-block;
  .el-button {
    border-radius: 20px;
  }
}
.btn-apply {
  border-radius: 20px;
}
</style>
