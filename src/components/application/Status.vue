<template>
  <div class="status">
    <el-dialog v-model="showInfo" width="600px">
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
            <el-button round type="primary" @click.stop="onBuyMore(application)">{{
              $t('common.button.buyMore')
            }}</el-button>
          </div>
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
    <application-confirm v-model.visible="applying" @apply="onApply" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { applicationOperator } from '@/operators';
import { ElButton, ElMessage, ElSkeleton, ElSkeletonItem, ElIcon, ElDialog, ElTooltip } from 'element-plus';
import ApplicationConfirm from '@/components/application/Confirm.vue';
import { IApplicationType, IApplication, IApplicationDetailResponse, IService, IApplicationScope } from '@/models';
import { ERROR_CODE_DUPLICATION } from '@/constants/errorCode';
import { ROUTE_CONSOLE_APPLICATION_SUBSCRIBE } from '@/router';
import ApiPrice from '@/components/api/Price.vue';
import { Check } from '@element-plus/icons-vue';
import ApplicationInfo from './Info.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export interface IData {
  showInfo: boolean;
  applying: boolean;
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
    ElTooltip,
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
    }
  },
  emits: ['apply', 'refresh', 'applied', 'update:application', 'select'],
  data(): IData {
    return {
      showInfo: false,
      applying: false,
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
  mounted() {
    this.onGetGlobalApplications();
  },
  methods: {
    onGetGlobalApplications() {
      this.$store.dispatch('getApplications');
    },
    onBuyMore(application: IApplication) {
      // open in new tab for this url
      const url = this.$router.resolve({
        name: ROUTE_CONSOLE_APPLICATION_SUBSCRIBE,
        params: {
          id: application.id
        }
      }).href;
      window.open(url, '_blank');
    },
    onSelectApplication(application: IApplication) {
      this.$emit('select', application);
    },
    onApply() {
      applicationOperator
        .create({
          type: IApplicationType.USAGE,
          scope: IApplicationScope.GLOBAL,
          user_id: this.user?.id
        })
        .then(({ data: data }: { data: IApplicationDetailResponse }) => {
          ElMessage.success(this.$t('application.message.applySuccessfully'));
          this.$store.dispatch('createCredential');
        })
        .catch((error) => {
          if (error?.response?.data?.code === ERROR_CODE_DUPLICATION) {
            ElMessage.error(this.$t('application.message.alreadyApplied'));
          }
          this.applying = false;
        });
    }
  }
});
</script>

<style lang="scss" scoped>
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
