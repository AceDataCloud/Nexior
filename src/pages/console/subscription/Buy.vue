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
            <el-row v-show="false">
              <el-col class="text-center">
                <el-radio-group v-if="applicationId" v-model="type" size="large" class="mb-4" @change="onChangeType">
                  <el-radio-button label="Period">
                    {{ $t('application.type.period') }}
                  </el-radio-button>
                  <el-radio-button label="Usage">
                    {{ $t('application.type.usage') }}
                  </el-radio-button>
                </el-radio-group>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="16" :offset="4">
                <p class="introduction">
                  {{ $t('console.subscription.introduction') }}
                </p>
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
                      <h4 class="name">
                        {{ item.label }}
                        <el-tag v-if="item.tag" type="warning">{{ item.tag }}</el-tag>
                      </h4>
                      <h2 class="price">
                        {{ getPriceString({ value: item.price }) }}
                      </h2>
                      <p class="description">{{ item.description }}</p>
                      <div class="benefits">
                        <div v-for="(benefit, benefitIndex) in item.benefits" :key="benefitIndex" class="benefit">
                          <font-awesome-icon v-if="benefit.enabled" icon="fa-solid fa-check" class="icon icon-check" />
                          <font-awesome-icon v-else icon="fa-solid fa-xmark" class="icon icon-xmark" />
                          <span> {{ benefit.content }}</span>
                        </div>
                      </div>
                      <div class="operations">
                        <el-button
                          class="btn btn-subscribe"
                          :type="subscription?.name === item?.name ? 'primary' : ''"
                          round
                          @click="onCreateOrder(item)"
                          >{{ $t('common.button.buy') }}</el-button
                        >
                      </div>
                    </el-card>
                  </el-col>
                </el-row>
                <div v-if="!loading" class="extra">
                  <span>{{ $t('console.message.doNotWantSubscribe') }}</span>
                  <el-button type="primary" class="btn btn-extra" round size="small" @click="onBuyExtra">
                    {{ $t('console.message.buyExtra') }}
                  </el-button>
                </div>
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
  ElButton,
  ElTag,
  ElRadioGroup,
  ElRadioButton
} from 'element-plus';
import { applicationOperator, orderOperator, serviceOperator } from '@/operators';
import { getPriceString } from '@/utils';
import { CHAT_SERVICE_ID } from '@/constants/chat';
import { MIDJOURNEY_SERVICE_ID } from '@/constants/midjourney';
import { SUNO_SERVICE_ID } from '@/constants/suno';
import { QRART_SERVICE_ID } from '@/constants/qrart';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ROUTE_CONSOLE_APPLICATION_EXTRA, ROUTE_CONSOLE_ORDER_DETAIL } from '@/router';

interface ISubscription {
  name: string;
  label: string;
  tag?: string;
  price?: number;
  duration: number;
  benefits?: { enabled: boolean; content: string }[];
  description?: string;
}

interface IData {
  applications: IApplication[];
  services: IService[];
  type: string;
  loading: boolean;
  creating: boolean;
  subscription: ISubscription | undefined;
}

export default defineComponent({
  name: 'ConsoleSubscriptionBuy',
  components: {
    ElSkeleton,
    ElRow,
    ElTag,
    ElCol,
    ElRadioGroup,
    ElRadioButton,
    ElCard,
    FontAwesomeIcon,
    ElButton
  },
  data(): IData {
    return {
      applications: [],
      type: 'Period',
      services: [],
      loading: false,
      creating: false,
      subscription: undefined
    };
  },
  computed: {
    applicationId() {
      return this.$route.params?.id?.toString();
    },
    subscriptions(): ISubscription[] {
      const items: ISubscription[] = [
        {
          name: 'WEEK',
          label: this.$t('console.subscription.weekly'),
          description: this.$t('console.subscription.weekly.description'),
          duration: 7 * 24 * 60 * 60
        },
        {
          name: 'MONTH',
          label: this.$t('console.subscription.monthly'),
          description: this.$t('console.subscription.monthly.description'),
          duration: 30 * 24 * 60 * 60
        },
        {
          name: 'YEAR',
          tag: this.$t('console.button.suggested'),
          label: this.$t('console.subscription.yearly'),
          description: this.$t('console.subscription.yearly.description'),
          duration: 365 * 24 * 60 * 60
        }
      ];
      for (const item of items) {
        const pkgs = this.getPackages(item.duration);
        if (pkgs) {
          item.price = pkgs.reduce((acc, pkg) => acc + pkg.price, 0);
        }
        for (const pkg of pkgs) {
          if (!item.benefits) {
            item.benefits = [];
          }
          item.benefits.push({
            enabled: true,
            content: `${pkg?.service?.title} - ${pkg.amount} ` + this.$t('service.unit.' + pkg?.service?.unit + 's')
          });
        }
        item.benefits?.push({ enabled: item.name !== 'WEEK', content: this.$t('console.message.benefit1') });
        item.benefits?.push({ enabled: item.name !== 'WEEK', content: this.$t('console.message.benefit2') });
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
    this.subscription = this.subscriptions[2];
  },
  methods: {
    getPriceString,
    onBuyExtra() {
      this.$router.push({
        name: ROUTE_CONSOLE_APPLICATION_EXTRA,
        params: {
          id: this.applicationId
        }
      });
    },
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
          result.push({ ...target, service });
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
    onChangeType() {
      console.log('onChangeType', this.type);
      this.$router.push({
        name: ROUTE_CONSOLE_APPLICATION_EXTRA,
        params: this.$route.params
      });
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
          package_ids: this.getPackages(subscription.duration).map((p) => p.id),
          description: this.$store.state?.site?.title + ' - ' + subscription.label
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
  overflow: scroll;
  width: calc(100% - 300px);
  background-color: var(--el-bg-color-page);

  .card {
    padding: 50px 0 100px 0;
    cursor: pointer;
  }

  .introduction {
    font-size: 16px;
    margin-bottom: 20px;
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
    margin: 0 auto;
  }

  .description {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin-bottom: 20px;
  }

  .benefits {
    margin-top: 20px;
    .benefit {
      font-size: 14px;
      color: var(--el-text-color-primary);
    }
  }

  .subscriptions {
    margin-bottom: 20px;
    .subscription {
      border: 1px solid var(--el-border-color) !important;
      .benefits {
        .benefit {
          margin-bottom: 10px;
          .icon {
            color: var(--el-color-primary);
            margin-right: 5px;
            width: 15px;
            text-align: center;
          }
        }
      }
      &.active {
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

  .extra {
    font-size: 14px;
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
