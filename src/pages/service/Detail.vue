<template>
  <el-row v-if="service" class="introduction">
    <el-col :span="24">
      <el-row>
        <el-col :span="10" :offset="2" class="left">
          <div class="info">
            <h1>
              {{ service.title }}
            </h1>
            <p>
              {{ service.description }}
            </p>
            <div class="price">
              <p v-if="service && service.price && service.price > 0" class="nonfree">
                <span class="value">￥{{ service.price }}</span>
                <span class="unit"> / {{ $t('service.unit.usage') }}</span>
              </p>
              <p v-else class="free">
                {{ $t('service.message.free') }}
              </p>
            </div>
            <div class="operations">
              <el-button type="danger" class="btn-apply" @click="onApply">
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

  <el-row v-if="service" class="detail">
    <el-col :span="20" :offset="2">
      <el-card shadow="hover">
        <el-tabs v-model="activeTab" class="demo-tabs">
          <el-tab-pane :label="$t('service.button.introduction')" name="introduction">
            <div class="introduction">
              {{ service?.introduction }}
            </div>
          </el-tab-pane>
          <el-tab-pane :label="$t('service.button.apis')" name="apis">
            <div id="document"></div>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import {
  applicationOperator,
  IApplication,
  IApplicationDetailResponse,
  IService,
  IServiceDetailResponse,
  serviceOperator
} from '@/operators';
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ERROR_CODE_DUPLICATION } from '@/constants';
import { ElForm, ElMessage } from 'element-plus';
import { apiOperator } from '@/operators/api/operator';
import { IApi, IApiListResponse } from '@/operators/api/models';

interface IData {
  service: IService | undefined;
  apis: IApi[];
  application: IApplication | undefined;
  loading: boolean;
  activeTab: string;
}

export default defineComponent({
  name: 'ServiceDetail',
  components: {
    FontAwesomeIcon
  },
  data(): IData {
    return {
      service: undefined,
      apis: [],
      application: undefined,
      loading: false,
      activeTab: 'introduction'
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
  },
  methods: {
    onFetchService() {
      this.loading = true;
      serviceOperator.get(this.id).then(({ data: data }: { data: IServiceDetailResponse }) => {
        this.service = data;
        this.loading = false;
      });
    },
    onFetchApis() {
      this.loading = true;
      apiOperator.getAllForService(this.id).then(({ data: data }: { data: IApiListResponse }) => {
        this.apis = data.items;
      });
    },
    onApply() {
      applicationOperator
        .create({
          service: this.id
        })
        .then(({ data: data }: { data: IApplicationDetailResponse }) => {
          this.application = data;
          ElMessage.success(this.$t('application.message.applySuccessfully'));
          setTimeout(() => {
            this.$router.push({
              name: 'console-application-list'
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
        });
    }
  }
});
</script>

<style lang="scss" scoped>
.introduction {
  $height: calc(100vh - 60px);

  background-color: #111827;
  background-image: url('@/assets/images/bg.png');
  background-position: 50% 50%;
  background-size: cover;
  background-repeat: no-repeat;
  position: relative;
  z-index: 1;
  height: $height;

  .left {
    position: relative;
    height: $height;
    .info {
      position: absolute;
      left: 0;
      width: 100%;
      top: 50%;
      transform: translateY(-50%);
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
        .nonfree {
          .value {
            font-weight: bold;
            color: #ff5441;
            font-size: 40px;
          }

          .unit {
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
        .nonfree {
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

.detail {
  margin-bottom: 15px;
  font-size: 14px;
  .introduction {
    padding: 10px 0;
    color: #999;
    font-weight: 400;
  }
}
</style>
