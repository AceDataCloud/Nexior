<template>
  <el-row v-if="service" class="preview">
    <el-col :span="20" :offset="2">
      <el-row>
        <el-col :span="24">
          <el-card shadow="hover">
            <div class="body">
              <div class="left">
                <div class="icon">
                  <font-awesome-icon :icon="'fa-regular fa-' + service.icon" />
                </div>
                <div class="count">
                  <p>{{ $t('service.message.appliedCount') }}: {{ service.appliedCount }}</p>
                </div>
              </div>
              <div class="right">
                <div class="title">
                  {{ service.title }}
                </div>
                <div class="description">
                  {{ service.description }}
                </div>
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
                  <el-button type="danger">
                    {{ $t('service.button.apply') }}
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-row>
        <el-col></el-col>
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
          <el-tab-pane :label="$t('service.button.apis')" name="apis">Config</el-tab-pane>
        </el-tabs>
      </el-card>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { IService, IServiceDetailResponse, serviceOperator } from '@/operators';
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

interface IData {
  service: IService | undefined;
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
      // service: undefined,
      // order: undefined,
      // episodes: [],
      service: undefined,
      loading: false,
      activeTab: 'introduction'
      // buying: false,
      // paid: undefined
    };
  },
  computed: {
    id() {
      return this.$route.params.id;
    }
  },
  async mounted() {
    this.loading = true;
    serviceOperator.get(this.id).then(({ data: data }: { data: IServiceDetailResponse }) => {
      this.service = data;
      console.log('this.service', this.service);
      this.loading = false;
    });
  },
  methods: {}
});
</script>

<style lang="scss" scoped>
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
      .description {
        line-height: 22px;
        color: #303030;
        padding: 15px 0;
        font-size: 14px;
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
