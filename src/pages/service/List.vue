<template>
  <el-row>
    <el-col :span="20" :offset="2">
      <el-row v-if="loading" :gutter="15" class="services">
        <el-col v-for="_ in 8" :key="_" :lg="6" :md="8" :sm="12" :xs="24">
          <el-card shadow="hover" class="service">
            <el-skeleton>
              <template #template>
                <el-skeleton-item variant="image" class="icon-placeholder" />
                <el-skeleton-item variant="p" class="title-placeholder" />
                <el-skeleton-item variant="p" class="price-placeholder" />
              </template>
            </el-skeleton>
          </el-card>
        </el-col>
      </el-row>
      <el-row v-else :gutter="15" class="services">
        <el-col v-for="(service, serviceIndex) in services" :key="serviceIndex" :lg="6" :md="8" :sm="12" :xs="24">
          <el-card shadow="hover" class="service">
            <div class="icon">
              <font-awesome-icon v-if="service.icon" :icon="service.icon" />
            </div>
            <div class="title">{{ service.title }}</div>
            <div class="price">
              <p v-if="service && service.price && service.price > 0" class="nonfree">
                ￥{{ service.price }} / {{ $t('service.unit.usage') }}
              </p>
              <p v-else class="free">
                {{ $t('service.message.free') }}
              </p>
            </div>
            <div class="introduction">
              <p>
                {{ service.introduction }}
              </p>
            </div>
            <div class="operations">
              <router-link
                :to="{
                  name: 'service-detail',
                  params: {
                    id: service.id
                  }
                }"
              >
                <el-button type="danger">
                  {{ $t('service.button.learnMore') }}
                </el-button>
              </router-link>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="10" :offset="14">
          <div class="pagination m-v-lg">
            <el-pagination
              v-model:current-page="page"
              background
              :page-size="limit"
              layout="total, prev, pager, next"
              :total="total"
              @current-change="onPageChange"
            >
            </el-pagination>
          </div>
        </el-col>
      </el-row>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { serviceOperator, IService, IServiceListResponse } from '@/operators';
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

interface IData {
  services: IService[];
  loading: boolean;
  total: number | undefined;
  limit: number;
  page: number;
}
export default defineComponent({
  name: 'ServiceList',
  components: {
    FontAwesomeIcon
  },
  data(): IData {
    return {
      services: [],
      loading: true,
      total: undefined,
      limit: 8,
      page: parseInt(this.$route.query.page?.toString() || '1')
    };
  },
  async mounted() {
    this.onFetchData();
  },
  methods: {
    onPageChange(page: number) {
      this.$router.push({
        name: this.$route.name?.toString(),
        query: {
          page: page
        }
      });
      this.onFetchData();
    },
    onFetchData() {
      this.loading = true;
      console.debug('start to load all services');
      serviceOperator
        .getAll({
          limit: this.limit,
          offset: (this.page - 1) * this.limit
        })
        .then(({ data: data }: { data: IServiceListResponse }) => {
          this.services = data.items;
          this.total = data.count;
          this.loading = false;
        });
    }
  }
});
</script>

<style lang="scss" scoped>
$transition-duration: 0.5s;
.services {
  padding: 50px 0;
  .service {
    width: 100%;
    height: 280px;
    border-radius: 10px !important;
    margin: 10px auto;
    padding: 30px 0;
    position: relative;
    transition: all $transition-duration;

    .icon-placeholder {
      display: flex;
      width: 80px;
      height: 80px;
      margin: 0 auto 15px auto;
      text-align: center;
    }

    .title-placeholder {
      display: block;
      width: 80px;
      height: 20px;
      margin: 0 auto 10px auto;
    }

    .price-placeholder {
      display: block;
      width: 100px;
      height: 16px;
      margin: 0 auto 10px auto;
    }

    .icon {
      font-size: 60px;
      text-align: center;
    }

    .title {
      color: #666;
      font-size: 14px;
      text-align: center;
      margin: 0;
      margin-bottom: 8px;
      padding: 0 20px;
      font-weight: bold;
    }

    .price {
      font-size: 16px;
      font-weight: bold;
      text-align: center;
      margin: 0;
      .nonfree {
        color: #ff5441;
      }
      .free {
        color: #29c287;
      }
    }

    .introduction {
      padding: 5px 0;
      text-align: center;
      margin: 0 auto;
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      text-overflow: ellipsis;
      color: #9f9f9f;
      font-size: 12px;
      opacity: 0;
      word-break: break-all;
      transition: all $transition-duration;
      text-overflow: ellipsis;
      height: 42px;
    }

    .operations {
      opacity: 0;
      position: absolute;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      transition: all $transition-duration;
    }

    &:hover {
      padding-top: 0;
      .introduction {
        opacity: 1;
      }
      .operations {
        opacity: 1;
      }
    }
  }
}
.pagination {
  padding-bottom: 50px;
  float: right;
}
</style>
