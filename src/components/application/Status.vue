<template>
  <div class="element">
    <div v-if="initializing && application === undefined">
      <el-skeleton :rows="1" class="text-center">
        <template #template>
          <el-skeleton-item variant="p" class="shimmer" />
        </template>
      </el-skeleton>
    </div>
    <div v-else-if="application" class="status">
      <el-dropdown @command="onSelectApplication">
        <span class="el-dropdown-link">
          <application-info :application="application" />
          <el-icon v-if="applications && applications.length > 0" class="el-icon--right ml-0">
            <arrow-down />
          </el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu v-if="applications && applications.length > 0">
            <el-dropdown-item v-for="(app, index) in applications" :key="index" :command="app">
              <application-info :application="app" :show-type="true" :show-id="true" />
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <span class="actions">
        <el-button round size="small" type="primary" class="mr-1" @click="onBuyMore(application)">{{
          $t('common.button.buyMore')
        }}</el-button>
        <api-price
          v-if="showPrice && application?.service?.apis?.[0]?.price"
          class="price inline-block"
          :price="application?.service?.apis?.[0]?.price"
        />
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
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { applicationOperator, credentialOperator } from '@/operators';
import {
  ElButton,
  ElMessage,
  ElSkeleton,
  ElSkeletonItem,
  ElDropdown,
  ElDropdownItem,
  ElIcon,
  ElDropdownMenu
} from 'element-plus';
import ApplicationConfirm from '@/components/application/Confirm.vue';
import { IApplicationType, IApplication, IApplicationDetailResponse, IService } from '@/models';
import { ERROR_CODE_DUPLICATION } from '@/constants/errorCode';
import { ROUTE_CONSOLE_APPLICATION_SUBSCRIBE } from '@/router';
import ApiPrice from '@/components/api/Price.vue';
import { ArrowDown } from '@element-plus/icons-vue';
import ApplicationInfo from './Info.vue';

export interface IData {
  confirming: boolean;
  applicationType: typeof IApplicationType;
}

export default defineComponent({
  name: 'ApplicationStatus',
  components: {
    ElButton,
    ApplicationInfo,
    ApplicationConfirm,
    ElSkeleton,
    ElSkeletonItem,
    ApiPrice,
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    ArrowDown,
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
