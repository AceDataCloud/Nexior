<template>
  <el-row class="banner">
    <el-col :span="24" class="main">
      <div class="info">
        <h1 class="title">
          {{ $t('service.message.indexTitle') }}
        </h1>
        <h3 class="subtitle">
          {{ $t('service.message.indexSubtitle') }}
        </h3>
        <div class="operations">
          <el-button type="danger" class="btn-apply" @click="onApply">
            {{ $t('common.button.startForFree') }}
          </el-button>
        </div>
      </div>
    </el-col>
  </el-row>
  <el-row id="services">
    <el-col :span="20" :offset="2">
      <el-row v-if="loading" :gutter="15" class="services">
        <el-col v-for="_ in 8" :key="_" :lg="6" :md="8" :sm="12" :xs="24">
          <el-card shadow="hover" class="service">
            <el-skeleton animated>
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
          <router-link
            :to="{
              name: 'service-detail',
              params: {
                id: service.id
              }
            }"
          >
            <el-card shadow="hover" class="service" :body-style="{ padding: 0 }">
              <el-image class="thumb" :src="service?.thumbnail" />
              <div class="title">{{ service.title }}</div>
              <div class="price">
                <service-price :price="service?.price" />
              </div>
              <div class="description">
                <p>
                  {{ service.description }}
                </p>
              </div>
            </el-card>
          </router-link>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="10" :offset="14">
          <div class="pagination m-v-lg">
            <pagination :current-page="page" :page-size="limit" :total="total" @change="onPageChange" />
          </div>
        </el-col>
      </el-row>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { serviceOperator, IService, IServiceListResponse } from '@/operators';
import { defineComponent } from 'vue';
import Pagination from '@/components/common/Pagination.vue';
import { ElRow, ElCol, ElButton, ElCard, ElSkeleton, ElImage, ElSkeletonItem } from 'element-plus';
import ServicePrice from '@/components/common/Price.vue';

interface IData {
  services: IService[];
  loading: boolean;
  total: number | undefined;
  limit: number;
}
export default defineComponent({
  name: 'ServiceList',
  components: {
    Pagination,
    ElRow,
    ElCol,
    ElButton,
    ElCard,
    ElSkeleton,
    ElImage,
    ElSkeletonItem,
    ServicePrice
  },
  data(): IData {
    return {
      services: [],
      loading: true,
      total: undefined,
      limit: 8
    };
  },
  computed: {
    page() {
      return parseInt(this.$route.query.page?.toString() || '1');
    }
  },
  watch: {
    page: {
      handler() {
        this.onFetchData();
      }
    }
  },
  async mounted() {
    this.onFetchData();
  },
  methods: {
    onApply() {
      window.scrollTo({
        top: document.getElementById('services')?.offsetTop,
        left: 0,
        behavior: 'smooth'
      });
    },
    onPageChange(page: number) {
      this.$router.push({
        name: this.$route.name?.toString(),
        query: {
          page: page
        }
      });
    },
    onFetchData() {
      this.loading = true;
      console.debug('start to load all services');
      serviceOperator
        .getAll({
          limit: this.limit,
          offset: (this.page - 1) * this.limit,
          ordering: 'rank',
          private: false
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
.banner {
  // display: none;
  height: calc(100vh - 60px);
  background-color: #111827;
  width: 100%;
  background-image: url('@/assets/images/bg.png');
  background-position: 50% 50%;
  background-size: cover;
  background-repeat: no-repeat;
  position: relative;
  z-index: 1;

  .main {
    position: relative;
    .info {
      position: absolute;
      top: 50%;
      width: 100%;
      left: 0;
      right: 0;
      transform: translateY(-50%);
      h1.title {
        display: inline-block;
        color: #fff;
        font-size: 80px;
        line-height: 84px;
        position: relative;
        left: 50%;
        transform: translateX(-50%);
        text-align: center;
        margin-bottom: 50px;
        -webkit-text-fill-color: transparent;
        -webkit-background-clip: text;
        background-clip: text;
        background-image: linear-gradient(
          90deg,
          #fb60d7,
          #eb69dc 15%,
          #dc5cff 30%,
          #c555fe 45%,
          #a02fff 60%,
          #7752ff 75%,
          #5f98fa 90%,
          #44beff
        );
      }
      h3.subtitle {
        color: hsla(0, 0%, 100%, 0.7);
        font-size: 24px;
        line-height: 32px;
        text-align: center;
        margin-bottom: 70px;
      }
      .operations {
        width: 100%;
        text-align: center;
        .btn-apply {
          margin: 0 auto 40px auto;
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
}

$transition-duration: 0.5s;

@media (min-width: 1400px) {
  .services {
    width: 1300px;
    margin: auto !important;
  }
}

.services {
  padding: 50px 0;
  .service {
    $hover-offset: 50px;
    width: 100%;
    height: 250px;
    margin-bottom: 15px;
    border-radius: 30px !important;
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

    .thumb {
      position: relative;
      text-align: center;
      width: 100%;
      height: 150px;
      top: 0px;
      opacity: 1;
      transition: all $transition-duration;
    }

    .title {
      color: #666;
      font-size: 16px;
      text-align: center;
      margin-top: 10px;
      margin-bottom: 8px;
      padding: 0 20px;
      font-weight: bold;
      transition: all $transition-duration;
      position: relative;
      top: 0;
    }

    .price {
      position: relative;
      top: 0;
      font-size: 16px;
      font-weight: bold;
      text-align: center;
      margin: 0;
      .unfree {
        color: #ff5441;
      }
      .free {
        color: #29c287;
      }
      transition: all $transition-duration;
    }

    .description {
      padding: 5px 15px;
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
      position: absolute;
      bottom: 30px;
      word-break: break-all;
      transition: all $transition-duration;
      text-overflow: ellipsis;
      height: 42px;
    }

    &:hover {
      .thumb {
        top: -$hover-offset;
        opacity: 0.5;
      }
      .title {
        top: -$hover-offset;
      }
      .price {
        top: -$hover-offset;
      }
      .description {
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
