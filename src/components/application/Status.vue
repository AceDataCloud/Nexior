<template>
  <div class="element">
    <el-dialog v-model="showInfo" width="500px">
      <div v-if="initializing && application === undefined">
        <el-skeleton :rows="1" class="text-center">
          <template #template>
            <el-skeleton-item variant="p" class="shimmer" />
          </template>
        </el-skeleton>
      </div>
      <div v-else-if="application" class="status">
        <p class="text-left mb-4">
          {{ $t('application.message.applicationSelection') }}
        </p>
        <div class="applications flex flex-col gap-2 mb-6">
          <div
            v-for="(app, index) in applications"
            :key="index"
            :class="{
              item: true,
              active: application?.id === app.id
            }"
            @click="onSelectApplication(app)"
          >
            <el-icon class="icon"><check /></el-icon>
            <application-info :application="app" :show-type="true" :show-id="true" />
          </div>
        </div>
        <div class="text-center">
          <el-button round type="primary" @click="onBuyMore(application)">{{ $t('common.button.buyMore') }}</el-button>
        </div>
        <span class="actions">
          <api-price
            v-if="showPrice && application?.service?.apis?.[0]?.price"
            class="price inline-block"
            :price="application?.service?.apis?.[0]?.price"
          />
        </span>
      </div>
    </el-dialog>
    <el-tooltip effect="dark" placement="top-start">
      <el-button circle @click="showInfo = true">
        <font-awesome-icon icon="fa-solid fa-wallet" class="icon" />
      </el-button>
    </el-tooltip>
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
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { applicationOperator, credentialOperator } from '@/operators';
import { ElButton, ElMessage, ElSkeleton, ElSkeletonItem, ElIcon, ElDialog } from 'element-plus';
import ApplicationConfirm from '@/components/application/Confirm.vue';
import { IApplicationType, IApplication, IApplicationDetailResponse, IService } from '@/models';
import { ERROR_CODE_DUPLICATION } from '@/constants/errorCode';
import { ROUTE_CONSOLE_APPLICATION_SUBSCRIBE } from '@/router';
import ApiPrice from '@/components/api/Price.vue';
import { Check } from '@element-plus/icons-vue';
import ApplicationInfo from './Info.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export interface IData {
  showInfo: boolean;
  confirming: boolean;
  applicationType: typeof IApplicationType;
}

export default defineComponent({
  name: 'ApplicationStatus',
  components: {
    ElButton,
    Check,
    ElDialog,
    FontAwesomeIcon,
    ApplicationInfo,
    ApplicationConfirm,
    ElSkeleton,
    ElSkeletonItem,
    ApiPrice,
    ElIcon
  },
  props: {
    application: {
      type: Object as () => IApplication | undefined,
      required: true
    },
    applications: {
      type: Array as () => IApplication[] | undefined,
      default: undefined
    },
    initializing: {
      type: Boolean,
      default: false
    },
    showPrice: {
      type: Boolean,
      default: true
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
  emits: ['apply', 'refresh', 'applied', 'update:application', 'select'],
  data(): IData {
    return {
      showInfo: false,
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
        name: ROUTE_CONSOLE_APPLICATION_SUBSCRIBE,
        params: {
          id: application.id
        }
      });
    },
    onCreateCredential(application: IApplication | undefined) {
      credentialOperator
        .create({
          application_id: application?.id,
          host: window.location.origin
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
    },
    onSelectApplication(application: IApplication) {
      this.$emit('select', application);
    },
    onApply() {
      applicationOperator
        .create({
          service_id: this.service?.id
        })
        .then(({ data: data }: { data: IApplicationDetailResponse }) => {
          ElMessage.success(this.$t('application.message.applySuccessfully'));
          this.onCreateCredential(data);
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
.element {
  margin-bottom: 10px;
}
.shimmer {
  width: 300px;
  margin: auto;
}
.status {
  display: block;
  width: fit-content;
  margin: auto;
  .el-icon {
    position: relative;
    top: 0.2em;
  }
  .el-dropdown {
    line-height: 20px;
  }
}

.applications {
  .item {
    cursor: pointer;
    padding: 20px;
    background-color: var(--el-bg-color);
    border-radius: 15px;
    border: 1px solid var(--el-border-color-lighter);
    .icon {
      visibility: hidden;
    }
    &.active {
      .icon {
        visibility: visible;
      }
    }
    &:hover {
      background-color: var(--el-bg-color-page);
    }
    display: flex;
    align-items: center;
    gap: 20px;
    .icon {
      color: var(--el-color-white);
      font-size: 20px;
      background-color: var(--el-color-primary);
      border-radius: 50%;
      padding: 5px;
    }
  }
}

.actions {
  margin: 0 5px;
  display: inline-block;
  @media (max-width: 767px) {
    display: block;
    margin: 5px auto 0 auto;
    width: fit-content;
  }
  .el-button {
    border-radius: 20px;
  }
}
.btn-apply {
  border-radius: 20px;
}
</style>
