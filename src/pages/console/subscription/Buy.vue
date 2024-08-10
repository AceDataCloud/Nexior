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
          <el-card shadow="hover" class="card">
            <el-row>
              <el-col :span="16" :offset="4">
                <el-skeleton v-if="loading" />
                <el-row v-else :gutter="15" class="subscriptions">
                  <el-col
                    v-for="(item, index) in subscriptions"
                    :key="index"
                    :xs="24"
                    :md="24 / (subscriptions?.length || 4)"
                  >
                    <el-card
                      shadow="hover"
                      :class="{ subscription: true, active: subscription?.name === item.name }"
                      @click="subscription = item"
                    >
                      <h4 class="name">{{ item.label }}</h4>
                      <h2 class="price">
                        {{ getPriceString({ value: item.price }) }}
                      </h2>
                      <div class="benefits">
                        <div v-for="(benefit, benefitIndex) in item.benefits" :key="benefitIndex" class="benefit">
                          <font-awesome-icon icon="fa-solid fa-check" class="icon icon-check" />
                          <span> {{ benefit }}</span>
                        </div>
                      </div>
                      <div class="operations">
                        <el-button class="btn btn-subscribe" type="primary" round @click="onCreateOrder(item)">{{
                          $t('common.button.buy')
                        }}</el-button>
                      </div>
                    </el-card>
                  </el-col>
                </el-row>
              </el-col>
            </el-row>
          </el-card>
        </el-col>
      </el-row>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IService, IApplication, IApplicationType, IOrderDetailResponse, IPackageType, IPackage } from '@/models';
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
import { getPriceString } from '@/utils';
import { CHAT_SERVICE_ID } from '@/constants/chat';
import { MIDJOURNEY_SERVICE_ID } from '@/constants/midjourney';
import { SUNO_SERVICE_ID } from '@/constants/suno';
import { QRART_SERVICE_ID } from '@/constants/qrart';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ROUTE_CONSOLE_ORDER_DETAIL } from '@/router';

interface ISubscription {
  name: string;
  label: string;
  price?: number;
  duration: number;
  benefits?: string[];
}

interface IData {
  applications: IApplication[];
  services: IService[];
  loading: boolean;
  creating: boolean;
  subscription: ISubscription | undefined;
}

export default defineComponent({
  name: 'ConsoleSubscriptionBuy',
  components: {
    ElSkeleton,
    ElRow,
    ElCol,
    ElCard,
    FontAwesomeIcon,
    // ElForm,
    // ElFormItem,
    ElButton
    // Price
  },
  data(): IData {
    return {
      applications: [],
      services: [],
      loading: false,
      creating: false,
      subscription: undefined
    };
  },
  computed: {
    subscriptions(): ISubscription[] {
      const items: ISubscription[] = [
        {
          name: 'WEEK',
          label: '周会员',
          duration: 7 * 24 * 60 * 60,
          benefits: ['Best AI-generated image quality', 'Fully featured web app', 'Faceswap and more']
        },
        {
          name: 'MONTH',
          label: '月会员',
          duration: 30 * 24 * 60 * 60,
          benefits: ['Best AI-generated image quality', 'Fully featured web app', 'Faceswap and more']
        },
        {
          name: 'QUARTER',
          label: '季会员',
          duration: 90 * 24 * 60 * 60,
          benefits: ['Best AI-generated image quality', 'Fully featured web app', 'Faceswap and more']
        },
        {
          name: 'YEAR',
          label: '年会员',
          duration: 365 * 24 * 60 * 60,
          benefits: ['Best AI-generated image quality', 'Fully featured web app', 'Faceswap and more']
        }
      ];
      for (const item of items) {
        const pkgs = this.getPackages(item.duration);
        if (pkgs) {
          item.price = pkgs.reduce((acc, pkg) => acc + pkg.price, 0);
        }
      }
      return items;
    },
    serviceIds(): string[] {
      return [CHAT_SERVICE_ID, MIDJOURNEY_SERVICE_ID, SUNO_SERVICE_ID, QRART_SERVICE_ID];
    },
    applicationIds(): string[] {
      // eslint-disable-next-line vue/no-side-effects-in-computed-properties
      const sortedApplications = this.applications.sort(
        (a, b) => this.serviceIds.indexOf(a.service_id!) - this.serviceIds.indexOf(b.service_id!)
      );
      return sortedApplications.map((application) => application.id) as string[];
    }
  },
  async mounted() {
    this.loading = true;
    await this.onFetchServices();
    await this.onFetchApplications();
    await this.onCreateApplications();
    this.loading = false;
    this.subscription = this.subscriptions[1];
  },
  methods: {
    getPriceString,
    getPackages(duration: number): IPackage[] {
      let result = [];
      // eslint-disable-next-line vue/no-side-effects-in-computed-properties
      const sortedServices = this.services.sort(
        (a, b) => this.serviceIds.indexOf(a.id) - this.serviceIds.indexOf(b.id)
      );
      for (const service of sortedServices) {
        const packages = service.packages;
        const target = packages?.find((p) => p.type === IPackageType.PERIOD && p.duration === duration);
        if (target) {
          result.push(target);
        }
      }
      return result;
    },
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
    },
    onCreateOrder(subscription: ISubscription) {
      this.subscription = subscription;
      this.creating = true;
      orderOperator
        .create({
          application_ids: this.applicationIds,
          package_ids: this.getPackages(subscription.duration).map((p) => p.id)
        })
        .then(({ data: data }: { data: IOrderDetailResponse }) => {
          this.creating = false;
          this.$router.push({
            name: ROUTE_CONSOLE_ORDER_DETAIL,
            params: {
              id: data.id
            }
          });
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

  .card {
    padding: 50px 0 100px 0;
  }

  .name {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 10px;
    color: var(--el-color-primary);
  }

  .price {
    font-size: 35px;
    font-weight: bold;
  }

  .subscriptions {
    .subscription {
      border: 1px solid var(--el-border-color) !important;
      .benefits {
        .benefit {
          margin-bottom: 10px;
          .icon {
            color: var(--el-color-primary);
            margin-right: 5px;
          }
        }
      }
      &.active,
      &:hover {
        border-color: var(--el-color-primary) !important;
      }
      .operations {
        .btn {
          width: 100%;
          margin-top: 20px;
        }
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
