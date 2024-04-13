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
      {{ $t('common.message.usedAmount') }}: {{ application?.used_amount?.toFixed(6) }}
      {{ $t(`service.unit.` + application?.service?.unit + 's') }}
      {{ $t('common.message.remainingAmount') }}:
      {{ application?.remaining_amount?.toFixed(6) }}
      {{ $t(`service.unit.` + application?.service?.unit + 's') }}
    </span>
    <span class="actions">
      <el-button round size="small" type="primary" @click="onBuyMore(application)">{{
        $t('common.button.buyMore')
      }}</el-button>
    </span>
  </div>
  <div v-if="needApply && service" class="text-center info">
    <span class="mr-2">{{ $t('chat.message.notApplied') }}</span>
    <span>
      <el-button round type="primary" class="btn btn-apply" size="small" @click="confirming = true">
        {{ $t('common.button.apply') }}
      </el-button>
    </span>
    <span class="ml-1">{{ $t('chat.message.tryForFree') }}</span>
    <application-confirm
      v-if="service && authenticated"
      v-model.visible="confirming"
      :service="service"
      @apply="onApply"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { applicationOperator, credentialOperator } from '@/operators';
import { ElButton, ElMessage, ElSkeleton, ElSkeletonItem } from 'element-plus';
import ApplicationConfirm from '@/components/application/Confirm.vue';
import { IApplicationType, IApplication, IApplicationDetailResponse, IService } from '@/models';
import { ERROR_CODE_DUPLICATION } from '@/constants/errorCode';
import { ROUTE_CONSOLE_APPLICATION_BUY } from '@/router';

export interface IData {
  confirming: boolean;
  applicationType: typeof IApplicationType;
}

export default defineComponent({
  name: 'ApplicationStatus',
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
    service: {
      type: Object as () => IService | undefined,
      required: true
    },
    needApply: {
      type: Boolean,
      default: false
    }
  },
  emits: ['apply', 'refresh', 'applied', 'update:application'],
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
          credentialOperator
            .create({
              application_id: data.id
            })
            .then(() => {
              setTimeout(() => {
                this.$emit('refresh');
              }, 2000);
              this.confirming = false;
            })
            .finally(() => {
              this.$emit('applied');
            });
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
