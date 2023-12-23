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
      <el-button size="small" type="primary" @click="onBuy">{{ $t('common.button.buyMore') }}</el-button>
    </span>
  </div>
  <div v-else class="text-center info">
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
import { IApplication, IApplicationDetailResponse, applicationOperator } from '@/operators';
import { ElButton, ElMessage, ElSkeleton, ElSkeletonItem } from 'element-plus';
import ApplicationConfirm from '@/components/application/Confirm.vue';
import { IApplicationType } from '@/operators';
import { apiOperator } from '@/operators/api/operator';
import { IApiDetailResponse, IApi } from '@/operators/api';
import { ERROR_CODE_DUPLICATION } from '@/constants/errorCode';

export interface IData {
  confirming: boolean;
  applicationType: typeof IApplicationType;
  api: IApi | undefined;
}

export default defineComponent({
  name: 'ApiStatus',
  components: { ElButton, ApplicationConfirm, ElSkeleton, ElSkeletonItem },
  props: {
    application: {
      type: Object as () => IApplication | undefined,
      required: true
    },
    apiId: {
      type: String,
      required: true
    },
    initializing: {
      type: Boolean,
      default: false
    }
  },
  emits: ['apply', 'refresh'],
  data(): IData {
    return {
      confirming: false,
      applicationType: IApplicationType,
      api: undefined
    };
  },
  computed: {},
  watch: {
    apiId() {
      this.onFetchApi();
    }
  },
  mounted() {
    this.onFetchApi();
  },
  methods: {
    onFetchApi() {
      apiOperator.get(this.apiId).then(({ data: data }: { data: IApiDetailResponse }) => {
        this.api = data;
      });
    },
    onBuy() {
      const url = `https://data.zhishuyun.com/console/applications/${this.application?.id}/buy`;
      window.open(url, '_blank');
    },
    onApply() {
      applicationOperator
        .create({
          type: IApplicationType.API,
          api_id: this.apiId
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
