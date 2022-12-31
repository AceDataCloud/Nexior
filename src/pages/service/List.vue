<template>
  <el-row>
    <el-col :span="20" :offset="2">
      <el-row :gutter="15" class="services">
        <el-col v-for="(service, serviceIndex) in services" :key="serviceIndex" :md="6" :xs="24">
          <el-card shadow="hover" class="service">
            <div class="icon">
              <font-awesome-icon :icon="'fa-regular fa-' + service.icon" />
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
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { serviceOperator, IService, IServiceListResponse } from '@/operators';
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ElForm, ElMessage } from 'element-plus';

interface IData {
  services: IService[];
  loading: boolean;
}
export default defineComponent({
  name: 'ServiceList',
  components: {
    FontAwesomeIcon
  },
  data(): IData {
    return {
      services: [],
      loading: false
    };
  },
  async mounted() {
    this.loading = true;
    console.debug('start to load all services');
    serviceOperator.getAll().then(({ data: data }: { data: IServiceListResponse }) => {
      this.services = data.items;
      this.loading = false;
    });
  }
});
</script>

<style lang="scss" scoped>
$transition-duration: 0.5s;
.services {
  padding: 50px;
  .service {
    width: 100%;
    height: 280px;
    border-radius: 10px !important;
    margin: 10px auto;
    padding: 30px 0;
    position: relative;
    transition: all $transition-duration;

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
</style>
