<template>
  <el-row class="panel">
    <el-col :span="24">
      <el-row>
        <el-col :span="24">
          <h2 class="title">{{ $t('common.title.buyMore') }}</h2>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-card shadow="hover">
            <el-row>
              <el-col :span="16" :offset="4">
                <el-skeleton v-if="loading" />
                <el-radio-group v-model="subscription" size="large">
                  <el-radio-button v-for="(item, index) in subscriptions" :key="index" :label="item" :value="item">
                    {{ item.label }}
                  </el-radio-button>
                </el-radio-group>
              </el-col>
            </el-row>
            <el-button @click="onCreateOrder">Buy</el-button>
          </el-card>
        </el-col>
      </el-row>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IService, IApplication, IApplicationType, IOrderDetailResponse, IPackageType } from '@/models';
import {
  ElRow,
  ElCol,
  ElCard,
  ElSkeleton,
  ElMessage,
  ElForm,
  ElFormItem,
  ElButton,
  ElDivider,
  ElRadioGroup,
  ElRadioButton
} from 'element-plus';
import { applicationOperator, orderOperator, serviceOperator } from '@/operators';
// import { ROUTE_CONSOLE_ORDER_DETAIL } from '@/router';
// import { applicationOperator, orderOperator } from '@/operators';
// import { getPriceString } from '@/utils';
import { CHAT_SERVICE_ID } from '@/constants/chat';
import { MIDJOURNEY_SERVICE_ID } from '@/constants/midjourney';
import { SUNO_SERVICE_ID } from '@/constants/suno';
import { QRART_SERVICE_ID } from '@/constants/qrart';

interface ISubscription {
  name: string;
  label: string;
  duration: number;
}

interface IData {
  applications: IApplication[];
  services: IService[];
  loading: boolean;
  // form: {
  //   amount: number | undefined;
  //   packageId: string | undefined;
  // };
  creating: boolean;
  subscription: ISubscription | undefined;
  subscriptions: ISubscription[];
}

export default defineComponent({
  name: 'ConsoleSubscriptionBuy',
  components: {
    ElSkeleton,
    ElRow,
    ElCol,
    ElCard,
    // ElForm,
    // ElFormItem,
    ElButton,
    // ElDivider,
    ElRadioGroup,
    ElRadioButton
    // Price
  },
  data(): IData {
    return {
      applications: [],
      services: [],
      loading: false,
      creating: false,
      subscription: undefined,
      subscriptions: [
        {
          name: 'MONTH',
          label: '月会员',
          duration: 30 * 24 * 60 * 60
        },
        {
          name: 'QUARTER',
          label: '季会员',
          duration: 90 * 24 * 60 * 60
        },
        {
          name: 'YEAR',
          label: '年会员',
          duration: 365 * 24 * 60 * 60
        },
        {
          name: 'WEEK',
          label: '周会员',
          duration: 7 * 24 * 60 * 60
        }
      ]
    };
  },
  computed: {
    serviceIds(): string[] {
      return [CHAT_SERVICE_ID, MIDJOURNEY_SERVICE_ID, SUNO_SERVICE_ID, QRART_SERVICE_ID];
    },
    applicationIds(): string[] {
      // eslint-disable-next-line vue/no-side-effects-in-computed-properties
      const sortedApplications = this.applications.sort(
        (a, b) => this.serviceIds.indexOf(a.service_id!) - this.serviceIds.indexOf(b.service_id!)
      );
      return sortedApplications.map((application) => application.id) as string[];
    },
    packageIds() {
      let result = [];
      // eslint-disable-next-line vue/no-side-effects-in-computed-properties
      const sortedServices = this.services.sort(
        (a, b) => this.serviceIds.indexOf(a.id) - this.serviceIds.indexOf(b.id)
      );
      console.log('sortedServices', sortedServices);
      for (const service of sortedServices) {
        const packages = service.packages;
        const target = packages?.find(
          (p) => p.type === IPackageType.PERIOD && p.duration === this.subscription?.duration
        );
        console.log('package', target);
        if (target) {
          result.push(target.id);
        }
      }
      console.log('packageIds', result);
      return result;
    }
  },
  async mounted() {
    this.loading = true;
    await this.onFetchServices();
    await this.onFetchApplications();
    await this.onCreateApplications();
    this.loading = false;
  },
  methods: {
    async onCreateApplications() {
      // check applications id related to service id
      const serviceIdsFromApplications = this.applications.map((application) => application.service_id);
      const serviceIds = this.serviceIds;
      const missingServiceIds = serviceIds.filter((serviceId) => !serviceIdsFromApplications.includes(serviceId));
      console.log('missingServiceIds', missingServiceIds);
      if (missingServiceIds.length > 0) {
        for (const serviceId of missingServiceIds) {
          await applicationOperator.create({
            service_id: serviceId,
            type: IApplicationType.PERIOD
          });
        }
        await this.onFetchApplications();
      }
    },
    async onFetchServices() {
      const { data } = await serviceOperator.getAll({
        id: this.serviceIds
      });
      this.services = data.items;
    },
    async onFetchApplications() {
      const { data } = await applicationOperator.getAll({
        limit: 100,
        offset: 0,
        user_id: this.$store.getters.user.id,
        ordering: '-created_at',
        service_id: this.serviceIds,
        type: IApplicationType.PERIOD
      });
      this.applications = data.items;
      console.log('applications', this.applications);
    },
    onCreateOrder() {
      this.creating = true;
      orderOperator
        .create({
          application_ids: this.applicationIds,
          package_ids: this.packageIds
        })
        .then(({ data: data }: { data: IOrderDetailResponse }) => {
          this.creating = false;
          console.log('order', data);
        })
        .catch(() => {
          ElMessage.error(this.$t('order.message.createFailed'));
          this.creating = false;
        });
    }
  }
});
</script>

<style lang="scss" scoped>
.title {
  font-size: 26px;
  font-weight: bold;
  margin-bottom: 20px;
  color: var(--el-text-color-primary);
}

.panel {
  padding: 30px;
  width: calc(100% - 300px);
  background-color: var(--el-bg-color-page);

  .el-card {
    padding: 50px 0;
    .price {
      font-size: 20px;
      font-weight: bold;
      &.unfree {
        color: #ff5441;
      }
      &.free {
        color: #29c287;
      }
    }
  }
}

.pagination {
  float: right;
}

@media (max-width: 767px) {
  .panel {
    width: 100%;
    height: 100%;
  }
}
</style>
