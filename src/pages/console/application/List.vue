<template>
  <el-row class="application-list">
    <el-col :span="24">
      <el-row>
        <el-col :span="24">
          <h2 class="title">{{ $t('common.title.allApplications') }}</h2>
        </el-col>
      </el-row>
      <el-row :gutter="15" class="mb-3">
        <el-col :md="12" :xs="24">
          <el-card shadow="hover" class="relative min-h-[180px] mb-2" :body-style="{ padding: '18px 20px' }">
            <el-skeleton v-if="loading" />
            <div v-else class="summary-card">
              <div class="icon-wrapper">
                <font-awesome-icon icon="fa-solid fa-cubes-stacked" />
              </div>
              <p class="label">
                {{ $t('application.title.count') }}
              </p>
              <p class="value">{{ individualApplicationsTotal }}</p>
              <p class="description">
                {{ $t('application.message.countDescription') }}
              </p>
            </div>
          </el-card>
        </el-col>
        <el-col v-if="showGlobalPayment && globalApplications?.length > 0" :md="12" :xs="24">
          <el-card shadow="hover" class="relative min-h-[180px] mb-2" :body-style="{ padding: '18px 20px' }">
            <el-skeleton v-if="loading" />
            <div v-else class="flex flex-row justify-between align-center">
              <div class="summary-card">
                <div class="flex justify-start items-center gap-2 mb-2 w-full">
                  <div class="icon-wrapper !mb-0">
                    <font-awesome-icon icon="fa-solid fa-wallet" />
                  </div>
                  <span class="text-[var(--el-text-color-regular)] text-[14px] truncate">
                    {{ $t('application.field.id') }}: {{ globalApplications?.[0]?.id }}
                    <copy-to-clipboard
                      v-if="globalApplications?.[0]?.id"
                      :content="globalApplications?.[0]?.id"
                      class="inline-block"
                    />
                  </span>
                </div>
                <p class="label">{{ $t('application.title.globalBalance') }}</p>
                <p class="value">
                  {{ globalApplications?.[0]?.remaining_amount?.toFixed(6) || '0.000000' }}
                  {{ $t('service.unit.credits') }}
                </p>
                <p class="description">
                  {{ $t('application.message.globalBalanceDescription') }}
                </p>
              </div>
              <div class="flex flex-col items-end gap-2">
                <el-button class="!m-0 !px-2" size="small" round @click="onGoUsage(globalApplications?.[0])">
                  <font-awesome-icon icon="fa-solid fa-chart-line" class="mr-1 text-[12px]" />
                  {{ $t('application.button.usage') }}
                </el-button>
                <el-button
                  v-if="showGlobalPayment"
                  class="!m-0 !px-2"
                  type="primary"
                  round
                  size="small"
                  @click="onBuyMore(globalApplications?.[0])"
                >
                  <font-awesome-icon icon="fa-solid fa-coins" class="mr-1 text-[12px]" />
                  {{ $t('application.button.buyMore') }}
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-card shadow="hover" class="applications-table-card hidden sm:block">
            <el-table
              v-loading="loading"
              :data="individualApplications"
              stripe
              class="applications-table !min-h-[calc(100vh-420px)]"
              table-layout="fixed"
              :empty-text="$t('common.message.noData')"
            >
              <el-table-column prop="id" :label="$t('application.field.id')" width="200px" class-name="text-center">
                <template #default="scope">
                  <span>{{ scope.row.id }}</span>
                  <span class="copy">
                    <copy-to-clipboard :content="scope?.row?.id" class="inline-block" />
                  </span>
                </template>
              </el-table-column>
              <el-table-column
                :label="$t('application.field.type')"
                width="90px"
                class-name="hidden sm:table-cell"
                label-class-name="hidden sm:table-cell"
              >
                <template #default="scope">
                  <el-tag v-if="scope.row?.type === 'Period'" type="success" effect="dark" round>
                    {{ $t('application.type.period') }}
                  </el-tag>
                  <el-tag v-else-if="scope.row?.type === 'Usage'" effect="dark" round>
                    {{ $t('application.type.usage') }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column :label="$t('application.field.name')" width="180px">
                <template #default="scope">
                  <span>{{ scope.row?.service?.title }}</span>
                  <el-tag v-if="scope.row?.role === 'grantee'" type="info" size="small" round class="ml-2">
                    {{ $t('application.badge.shared') }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column
                prop="remaining_amount"
                :label="$t('application.field.remainingAmount')"
                width="150px"
                class-name="text-center"
              >
                <template #default="scope">
                  <span>{{ getRemainingAmount(scope.row) }}</span>
                </template>
              </el-table-column>
              <el-table-column
                prop="used_amount"
                :label="$t('application.field.usedAmount')"
                width="150px"
                class-name="hidden sm:table-cell text-center"
                label-class-name="hidden sm:table-cell"
              >
                <template #default="scope">
                  <span>{{ getUsedAmount(scope.row) }}</span>
                </template>
              </el-table-column>
              <el-table-column
                prop="allow_consume_global"
                :label="$t('application.field.allowConsumeGlobal')"
                width="120px"
                class-name="hidden sm:table-cell text-center"
                label-class-name="hidden sm:table-cell"
              >
                <template #default="scope">
                  <el-switch
                    v-if="scope.row.service?.type === serviceType.API"
                    v-model="scope.row.allow_consume_global"
                    :active-value="true"
                    :inactive-value="false"
                    @change="updateAllowConsumeGlobal(scope.row, $event)"
                  />
                </template>
              </el-table-column>
              <el-table-column
                :label="$t('application.field.expiredAt')"
                width="180px"
                class-name="hidden sm:table-cell"
                label-class-name="hidden sm:table-cell"
              >
                <template #default="scope">
                  <span v-if="scope.row.expired_at" class="expired-at">{{ $dayjs.format(scope.row.expired_at) }}</span>
                </template>
              </el-table-column>
              <el-table-column fixed="right" width="200px">
                <template #default="scope">
                  <div class="flex flex-wrap items-center justify-end gap-1">
                    <el-button class="!m-0 !px-2" size="small" round @click="onGoUsage(scope?.row)">
                      <font-awesome-icon icon="fa-solid fa-chart-line" class="mr-1 text-[12px]" />
                      {{ $t('application.button.usage') }}
                    </el-button>
                    <el-button
                      v-if="rowCanPay(scope?.row)"
                      class="!m-0 !px-2"
                      type="primary"
                      round
                      size="small"
                      @click="onBuyMore(scope?.row)"
                    >
                      <font-awesome-icon icon="fa-solid fa-coins" class="mr-1 text-[12px]" />
                      {{ $t('application.button.buyMore') }}
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
          <div class="application-cards block sm:hidden">
            <el-skeleton v-if="loading" :rows="4" animated />
            <template v-else>
              <el-empty v-if="!individualApplications?.length" :description="$t('common.message.noData')" />
              <el-card
                v-for="app in individualApplications"
                v-else
                :key="app.id"
                shadow="hover"
                class="application-card mb-2"
                :body-style="{ padding: '14px 16px' }"
              >
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="application-card__name">{{ app?.service?.title }}</span>
                  <el-tag v-if="app?.type === 'Period'" type="success" effect="dark" size="small" round>
                    {{ $t('application.type.period') }}
                  </el-tag>
                  <el-tag v-else-if="app?.type === 'Usage'" effect="dark" size="small" round>
                    {{ $t('application.type.usage') }}
                  </el-tag>
                  <el-tag v-if="app?.role === 'grantee'" type="info" size="small" round>
                    {{ $t('application.badge.shared') }}
                  </el-tag>
                </div>
                <div class="application-card__id">
                  <span class="truncate">{{ $t('application.field.id') }}: {{ app.id }}</span>
                  <copy-to-clipboard :content="app.id" class="inline-block shrink-0" />
                </div>
                <div class="application-card__row">
                  <span class="label">{{ $t('application.field.remainingAmount') }}</span>
                  <span class="value">{{ getRemainingAmount(app) }}</span>
                </div>
                <div v-if="app?.expired_at" class="application-card__row">
                  <span class="label">{{ $t('application.field.expiredAt') }}</span>
                  <span class="value">{{ $dayjs.format(app.expired_at) }}</span>
                </div>
                <div v-if="app.service?.type === serviceType.API" class="application-card__row">
                  <span class="label">{{ $t('application.field.allowConsumeGlobal') }}</span>
                  <el-switch
                    v-model="app.allow_consume_global"
                    :active-value="true"
                    :inactive-value="false"
                    @change="updateAllowConsumeGlobal(app, $event)"
                  />
                </div>
                <div class="flex items-center justify-end gap-2 mt-3">
                  <el-button class="!m-0 !px-3" size="small" round @click="onGoUsage(app)">
                    <font-awesome-icon icon="fa-solid fa-chart-line" class="mr-1 text-[12px]" />
                    {{ $t('application.button.usage') }}
                  </el-button>
                  <el-button
                    v-if="rowCanPay(app)"
                    class="!m-0 !px-3"
                    type="primary"
                    round
                    size="small"
                    @click="onBuyMore(app)"
                  >
                    <font-awesome-icon icon="fa-solid fa-coins" class="mr-1 text-[12px]" />
                    {{ $t('application.button.buyMore') }}
                  </el-button>
                </div>
              </el-card>
            </template>
          </div>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <div class="pagination">
            <pagination
              :current-page="page"
              :page-size="limit"
              :total="individualApplicationsTotal"
              @change="onPageChange"
            >
            </pagination>
          </div>
        </el-col>
      </el-row>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { applicationOperator } from '@/operators';
import Pagination from '@/components/common/Pagination.vue';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import {
  ElTable,
  ElRow,
  ElCol,
  ElTableColumn,
  ElCard,
  ElButton,
  ElTag,
  ElSkeleton,
  ElSwitch,
  ElEmpty,
  ElMessage
} from 'element-plus';
import { ROUTE_CONSOLE_APPLICATION_EXTRA, ROUTE_CONSOLE_USAGE_LIST } from '@/router/constants';
import { isIOS } from '@/utils';
import {
  IApplication,
  IApplicationListResponse,
  IApplicationScope,
  IApplicationType,
  ICredentialType,
  IService,
  IServiceType
} from '@/models';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

interface IData {
  individualApplications: IApplication[];
  globalApplications: IApplication[];
  loading: boolean;
  individualApplicationsTotal: number | undefined;
  globalApplicationsTotal: number | undefined;
  limit: number;
  buying: boolean;
  form: {
    amount: number | undefined;
  };
  active: {
    service: IService | undefined;
    application: IApplication | undefined;
  };
  credentialType: typeof ICredentialType;
  serviceType: typeof IServiceType;
}

export default defineComponent({
  name: 'ConsoleApplicationList',
  components: {
    Pagination,
    CopyToClipboard,
    ElTable,
    ElRow,
    ElButton,
    ElCol,
    ElTag,
    ElSkeleton,
    ElSwitch,
    ElEmpty,
    ElTableColumn,
    ElCard,
    FontAwesomeIcon
  },
  data(): IData {
    return {
      credentialType: ICredentialType,
      serviceType: IServiceType,
      individualApplications: [],
      globalApplications: [],
      individualApplicationsTotal: undefined,
      globalApplicationsTotal: undefined,
      loading: false,
      buying: false,
      limit: 10,
      form: {
        amount: 1
      },
      active: {
        service: undefined,
        application: undefined
      }
    };
  },
  computed: {
    redirect() {
      return this.$route.query?.redirect;
    },
    page() {
      return parseInt(this.$route.query.page?.toString() || '1');
    },
    // The global 积分 wallet IS buyable on iOS via Apple IAP (it always has
    // the mapped consumable packages), so its top-up entry is shown on every
    // surface. The card itself is still gated on having a global application.
    showGlobalPayment(): boolean {
      return true;
    }
  },
  watch: {
    page: {
      handler() {
        this.onFetchData();
      }
    }
  },
  mounted() {
    this.onInitializeGlobalApplication();
    this.onFetchData();
  },
  methods: {
    // A per-service app row shows "Buy More" on every surface, but on iOS
    // only when it has an Apple-buyable package (apple_product_id mapped).
    rowCanPay(application: IApplication): boolean {
      if (!isIOS()) {
        return true;
      }
      return ((application as any)?.packages || []).some((p: any) => p?.metadata?.apple_product_id);
    },
    updateAllowConsumeGlobal(application: IApplication, value: any) {
      if (!application || !application.id) {
        return;
      }
      applicationOperator
        .updateAllConsumeGlobal(application.id, { ...application, allow_consume_global: !!value })
        .then(() => {
          ElMessage.success(this.$t('application.message.updateSuccessfully').toString());
        })
        .catch(() => {
          ElMessage.error(this.$t('application.message.updateFailed').toString());
        });
    },
    onGoUsage(application: IApplication) {
      this.$router.push({
        name: ROUTE_CONSOLE_USAGE_LIST,
        query: {
          application_id: application.id,
          type: application?.service?.type
        }
      });
    },
    onBuyMore(application: IApplication | undefined) {
      if (!application?.id) return;
      this.$router.push({
        name: ROUTE_CONSOLE_APPLICATION_EXTRA,
        params: {
          id: application.id
        }
      });
    },
    onPageChange(page: number) {
      this.$router.push({
        name: this.$route.name?.toString(),
        query: {
          ...this.$route.query,
          page: page
        }
      });
    },
    onFetchApplications(scope: IApplicationScope = IApplicationScope.INDIVIDUAL) {
      return new Promise((resolve, reject) => {
        applicationOperator
          .getAll({
            limit: this.limit,
            ...(scope === IApplicationScope.INDIVIDUAL
              ? {
                  offset: (this.page - 1) * this.limit
                }
              : {}),
            user_id: this.$store.getters.user.id,
            ordering: '-created_at',
            type: IApplicationType.USAGE,
            scope: scope
          })
          .then(({ data }: { data: IApplicationListResponse }) => {
            if (scope === IApplicationScope.INDIVIDUAL) {
              this.individualApplications = data.items;
              this.individualApplicationsTotal = data.count;
            } else {
              this.globalApplications = data.items;
              this.globalApplicationsTotal = data.count;
            }
            resolve(data);
          })
          .catch((error) => {
            ElMessage.error(this.$t('application.message.fetchFailed').toString());
            reject(error);
          });
      });
    },
    onFetchData() {
      this.loading = true;
      Promise.all([
        this.onFetchApplications(IApplicationScope.INDIVIDUAL),
        this.onFetchApplications(IApplicationScope.GLOBAL)
      ])
        .then(() => {
          this.loading = false;
        })
        .catch(() => {
          this.loading = false;
        });
    },
    onInitializeGlobalApplication() {
      applicationOperator
        .create({
          type: IApplicationType.USAGE,
          scope: IApplicationScope.GLOBAL,
          user_id: this.$store.getters.user.id
        })
        .finally(() => {
          this.onFetchApplications(IApplicationScope.GLOBAL);
        });
    },
    getRemainingAmount(application: IApplication) {
      if (application.remaining_amount === undefined || application.remaining_amount === null) {
        return '';
      }
      const unit = this.$t(`service.unit.${application?.service?.unit || 'credit'}s`);
      return `${application.remaining_amount?.toFixed(6)} ${unit}`;
    },
    getUsedAmount(application: IApplication) {
      if (application.used_amount === undefined || application.used_amount === null) {
        return '';
      }
      const unit = this.$t(`service.unit.${application?.service?.unit || 'credit'}s`);
      return `${application.used_amount?.toFixed(6)} ${unit}`;
    }
  }
});
</script>

<style lang="scss" scoped>
.summary-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
  .icon-wrapper {
    height: 40px;
    width: 40px;
    line-height: 40px;
    border-radius: 50%;
    background-color: var(--el-bg-color-page);
    text-align: center;
    margin-bottom: 6px;
    color: var(--el-color-primary);
    flex-shrink: 0;
  }
  .label {
    color: var(--el-text-color-regular);
    font-size: 14px;
    margin: 0;
    line-height: 20px;
  }
  .value {
    font-weight: 600;
    font-size: 30px;
    margin: 0;
    line-height: 36px;
    word-break: break-all;
  }
  .description {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    margin: 4px 0 0 0;
  }
}

.application-list {
  width: 100%;
  margin: 0;
}

// Tablet/desktop table can exceed the viewport — let it scroll horizontally
// instead of squashing columns.
.applications-table-card {
  :deep(.el-card__body) {
    overflow-x: auto;
  }
}

.application-card {
  &__name {
    font-weight: 600;
    font-size: 15px;
    color: var(--el-text-color-primary);
    word-break: break-word;
  }
  &__id {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 6px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    .truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 8px;
    .label {
      color: var(--el-text-color-regular);
      font-size: 13px;
      flex-shrink: 0;
    }
    .value {
      color: var(--el-text-color-primary);
      font-size: 14px;
      font-weight: 500;
      text-align: right;
      word-break: break-all;
    }
  }
}

@media screen and (max-width: 767px) {
  .application-list {
    display: block;
  }

  .summary-card {
    .value {
      font-size: 24px;
      line-height: 30px;
    }
  }
}
</style>
