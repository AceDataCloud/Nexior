<template>
  <el-row class="banner">
    <el-col :span="24">
      <el-row>
        <el-col :span="10" :offset="2" class="left">
          <div v-if="loading" class="info">
            <el-skeleton animated>
              <template #template>
                <el-skeleton-item variant="p" class="title-placeholder" />
                <el-skeleton-item variant="p" class="description-placeholder" />
                <el-skeleton-item variant="p" class="price-placeholder" />
                <el-skeleton-item variant="p" class="operations-placeholder" />
              </template>
            </el-skeleton>
          </div>
          <div v-if="service" class="info">
            <h1>
              {{ service.title }}
            </h1>
            <p>
              {{ service.description }}
            </p>
            <div class="price">
              <p v-if="service && service.price && service.price > 0" class="unfree">
                <span class="value">￥{{ service.price }}</span>
                <span class="unit"> / {{ $t(`service.unit.${service.unit}`) }}</span>
                <span class="from">
                  {{ $t('service.message.fromPrice') }}
                </span>
              </p>
              <p v-else class="free">
                {{ $t('service.message.free') }}
              </p>
            </div>
            <div class="operations">
              <el-button type="danger" class="btn-apply" @click="onToApis">
                {{ $t('service.button.apply') }}
              </el-button>
            </div>
          </div>
        </el-col>
        <el-col :span="10" class="right">
          <div class="demo">
            <img src="@/assets/images/illustration.png" />
          </div>
        </el-col>
      </el-row>
    </el-col>
  </el-row>
  <el-row v-if="service && service.introduction" class="introduction">
    <el-col :span="20" :offset="2">
      <el-card shadow="hover" :body-style="{ padding: '50px' }">
        <markdown-renderer :content="service?.introduction" />
      </el-card>
    </el-col>
  </el-row>
  <el-row v-if="service && apis?.length > 0" id="apis" class="apis">
    <el-col :span="20" :offset="2">
      <el-card shadow="hover" :body-style="{ padding: '50px' }">
        <div v-for="(api, apiIndex) in apis" :key="apiIndex">
          <el-row>
            <el-col :span="20">
              <api-info :api="api" />
            </el-col>
            <el-col :span="4" class="operations">
              <el-button v-if="!api.applied" type="primary" @click="onConfirm(api, applicationType.API)">
                {{ $t('common.button.apply') }}
              </el-button>
              <el-button v-else disabled type="primary">
                {{ $t('common.button.applied') }}
              </el-button>
            </el-col>
          </el-row>
          <el-divider v-if="apiIndex < apis.length - 1" />
        </div>
      </el-card>
    </el-col>
  </el-row>
  <el-row v-if="service && proxies?.length > 0" id="proxies" class="proxies">
    <el-col :span="20" :offset="2">
      <el-card shadow="hover" :body-style="{ padding: '50px' }">
        <div v-for="(proxy, proxyIndex) in proxies" :key="proxyIndex">
          <el-row>
            <el-col :span="20">
              <proxy-info :proxy="proxy" />
            </el-col>
            <el-col :span="4" class="operations">
              <el-button v-if="!proxy.applied" type="primary" @click="onConfirm(proxy, applicationType.PROXY)">
                {{ $t('common.button.apply') }}
              </el-button>
              <el-button v-else disabled type="primary">
                {{ $t('common.button.applied') }}
              </el-button>
            </el-col>
          </el-row>
          <el-divider v-if="proxyIndex < apis.length - 1" />
        </div>
      </el-card>
    </el-col>
  </el-row>
  <application-confirm
    v-if="confirm.object && confirm.type"
    v-model.visible="confirming"
    :object="confirm.object"
    :type="confirm.type"
    @apply="onApply(confirm.object!, confirm.type!)"
  />
</template>

<script lang="ts">
import {
  applicationOperator,
  IApplication,
  IApplicationDetailResponse,
  IProxy,
  IProxyListResponse,
  IService,
  IServiceDetailResponse,
  proxyOperator,
  serviceOperator
} from '@/operators';
import { defineComponent } from 'vue';
import { ERROR_CODE_DUPLICATION, ERROR_CODE_UNVERIFIED } from '@/constants';
import { ElMessage } from 'element-plus';
import { apiOperator } from '@/operators/api/operator';
import { IApi, IApiListResponse } from '@/operators/api/models';
import { IApplicationType } from '@/operators/application/models';
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue';
import { ROUTE_CONSOLE_APPLICATION_LIST } from '@/router';
import {
  ElCol,
  ElRow,
  ElButton,
  ElCard,
  ElDivider,
  ElSkeleton,
  ElSkeletonItem,
  ElDialog,
  ElDescriptions,
  ElDescriptionsItem,
  ElCheckbox
} from 'element-plus';
import ApiInfo from '@/components/api/Info.vue';
import ProxyInfo from '@/components/proxy/Info.vue';
import ApplicationConfirm from '@/components/application/Confirm.vue';
import { getVerificationUrl } from '@/utils';

interface IData {
  service: IService | undefined;
  apis: IApi[];
  proxies: IProxy[];
  application: IApplication | undefined;
  loading: boolean;
  loadingApis: boolean;
  loadingProxies: boolean;
  activeTab: string;
  applicationType: typeof IApplicationType;
  confirming: boolean;
  confirm: {
    type: IApplicationType | undefined;
    object: IApi | IProxy | undefined;
  };
}

export default defineComponent({
  name: 'ServiceDetail',
  components: {
    MarkdownRenderer,
    ElCol,
    ElRow,
    ElButton,
    ElCard,
    ElDivider,
    ApiInfo,
    ApplicationConfirm,
    ProxyInfo,
    ElSkeleton,
    ElSkeletonItem
  },
  data(): IData {
    return {
      service: undefined,
      apis: [],
      proxies: [],
      application: undefined,
      loading: false,
      loadingApis: false,
      loadingProxies: false,
      activeTab: 'introduction',
      applicationType: IApplicationType,
      confirming: false,
      confirm: {
        object: undefined,
        type: undefined
      }
    };
  },
  computed: {
    id() {
      return this.$route.params.id.toString();
    }
  },
  async mounted() {
    this.onFetchService();
    this.onFetchApis();
    this.onFetchProxies();
  },
  methods: {
    onShowApiPolicy() {},
    onFetchService() {
      this.loading = true;
      serviceOperator.get(this.id).then(({ data: data }: { data: IServiceDetailResponse }) => {
        this.service = data;
        this.loading = false;
      });
    },
    onFetchApis() {
      this.loadingApis = true;
      apiOperator
        .getAllForService(this.id)
        .then(({ data: data }: { data: IApiListResponse }) => {
          this.apis = data.items;
          this.loadingApis = false;
        })
        .catch(() => {
          this.loadingApis = false;
        });
    },
    onFetchProxies() {
      this.loadingProxies = true;
      proxyOperator
        .getAllForService(this.id)
        .then(({ data: data }: { data: IProxyListResponse }) => {
          this.proxies = data.items;
        })
        .catch(() => {
          this.loadingProxies = false;
        });
    },
    onToApis() {
      window.scrollTo({
        top: document.getElementById('apis')?.offsetTop,
        left: 0,
        behavior: 'smooth'
      });
    },
    onConfirm(obj: IApi | IProxy, type: IApplicationType) {
      this.confirming = true;
      this.confirm.object = obj;
      this.confirm.type = type;
    },
    onApply(obj: IApi | IProxy, type: IApplicationType) {
      applicationOperator
        .create({
          type,
          ...(type === IApplicationType.API
            ? {
                api_id: obj.id
              }
            : {}),
          ...(type === IApplicationType.PROXY
            ? {
                proxy_id: obj.id
              }
            : {})
        })
        .then(({ data: data }: { data: IApplicationDetailResponse }) => {
          this.application = data;
          obj.applied = true;
          ElMessage.success(this.$t('application.message.applySuccessfully'));
          setTimeout(() => {
            this.$router.push({
              name: ROUTE_CONSOLE_APPLICATION_LIST
            });
          }, 2000);
        })
        .catch((error) => {
          if (error?.response?.data?.code === ERROR_CODE_DUPLICATION) {
            ElMessage.error(this.$t('application.message.alreadyApplied'));
            setTimeout(() => {
              this.$router.push({
                name: 'console-application-list'
              });
            }, 2000);
          }
          if (error?.response?.data?.code === ERROR_CODE_UNVERIFIED) {
            ElMessage({
              dangerouslyUseHTMLString: true,
              duration: 0,
              showClose: true,
              message: `${this.$t(
                'application.message.unverified'
              )} <a class="underline" href="${getVerificationUrl()}">${this.$t('application.message.goVerify')}</a>`,
              type: 'warning'
            });
          }
        });
    }
  }
});
</script>

<style lang="scss" scoped>
.banner {
  $height: calc(100vh - 60px);
  $min-height: 600px;
  background-color: #111827;
  background-image: url('@/assets/images/bg.png');
  background-position: 50% 50%;
  background-size: cover;
  background-repeat: no-repeat;
  position: relative;
  z-index: 1;
  height: $height;
  min-height: $min-height;
  margin-bottom: 30px;

  .left {
    position: relative;
    height: $height;
    min-height: $min-height;

    .info {
      position: absolute;
      left: 0;
      width: 100%;
      top: 50%;
      transform: translateY(-50%);
      .title-placeholder {
        height: 64px;
        width: 200px;
        margin-bottom: 24px;
      }

      .description-placeholder {
        height: 50px;
        margin-bottom: 56px;
      }

      .price-placeholder {
        height: 32px;
        margin-bottom: 56px;
      }

      .operations-placeholder {
        height: 52px;
        margin-bottom: 40px;
        visibility: hidden;
      }

      h1 {
        max-width: 1064px;
        margin-bottom: 24px;
        color: #fff;
        font-size: 56px;
        line-height: 64px;
      }

      p {
        max-width: 650px;
        margin-bottom: 56px;
        color: #d1d5db;
        font-size: 24px;
        line-height: 32px;
        font-weight: 500;
      }

      .price {
        margin: 0;
        .unfree {
          .value {
            font-weight: bold;
            color: #ff5441;
            font-size: 40px;
          }

          .unit {
            color: white;
          }

          .from {
            color: white;
          }
        }
        .free {
          color: #29c287;
        }
      }

      .operations {
        .btn-apply {
          margin: 0 auto 40px;
          padding: 25px 62px;
          color: #fff;
          font-size: 20px;
          line-height: 20px;
          font-weight: 700;
          text-align: center;
        }
      }
    }
  }

  .right {
    position: relative;
    height: $height;
    min-height: $min-height;
    .demo {
      position: absolute;
      top: 50%;
      left: 0;
      transform: translateY(-50%);
    }
  }
}

.preview {
  overflow: hidden;
  $left-width: 320px;
  $left-height: 290px;
  margin: 15px 0;

  .body {
    display: flex;
    .left {
      float: left;
      position: relative;
      border: 1px solid #e8e8e8;
      border-radius: 8px;
      width: $left-width;
      height: $left-height;
      text-align: center;
      box-sizing: border-box;
      box-shadow: none;
      padding-top: 50px;
      .icon {
        width: 150px;
        height: 150px;
        margin: 0 auto;
        font-size: 80px;
      }
      .icon-placeholder {
        display: flex;
        width: 80px;
        height: 80px;
        text-align: center;
        margin: 30px auto 10px auto;
      }

      .count {
        color: #999;
      }
    }

    .right {
      position: relative;
      padding: 15px;
      float: left;
      width: calc(100% - $left-width);
      .title {
        font-size: 18px;
        color: #000;
        line-height: 26px;
        padding-right: 8px;
      }
      .title-placeholder {
        width: 100px;
        height: 30px;
        display: block;
        margin-bottom: 10px;
      }
      .description {
        line-height: 22px;
        color: #303030;
        padding: 15px 0;
        font-size: 14px;
      }
      .description-placeholder {
        width: 300px;
        height: 20px;
        display: block;
        margin-bottom: 10px;
      }
      .price {
        margin: 0;
        .unfree {
          .value {
            font-weight: bold;
            color: #ff5441;
            font-size: 30px;
          }

          .unit {
            color: #666;
          }
        }
        .free {
          color: #29c287;
        }
      }
      .price-placeholder {
        width: 100px;
        height: 30px;
      }
      .operations {
        position: absolute;
        left: 15px;
        bottom: 10px;
      }
    }
  }
}

.introduction {
  margin-bottom: 20px;
}

.apis {
  margin-bottom: 40px;
  .operations {
    align-items: center;
    justify-items: center;
    display: flex;
  }
}

.proxies {
  margin-bottom: 40px;
  .operations {
    align-items: center;
    justify-items: center;
    display: flex;
  }
}

.dialog-confirm {
  .title {
    font-size: 14px;
    font-weight: bold;
  }
}
</style>
