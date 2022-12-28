<template>
  <el-row>
    <el-col :span="20" :offset="2">
      <div class="services">
        <el-card v-if="loading" class="service">
          <el-skeleton :rows="5" animated />
        </el-card>
        <el-card v-for="(service, serviceIndex) in services" :key="serviceIndex" shadow="hover" class="service">
          <div class="content">
            <!-- <div class="tags mb-5">
              <el-button
                v-for="(tag, tagIndex) in service.tags"
                :key="tagIndex"
                size="small"
                type="success"
                class="tag"
                >{{ tag }}</el-button
              >
            </div> -->
            <div
              class="title mb-5"
              @click="
                $router.push({
                  name: 'service-detail',
                  params: {
                    id: service.id
                  }
                })
              "
            >
              <p>{{ service.title }}</p>
            </div>
            <div class="introduction mb-5">
              <p>{{ service.introduction }}</p>
            </div>
            <div class="study">
              <router-link
                :to="{
                  name: 'service-detail',
                  params: {
                    id: service.id
                  }
                }"
              >
                <el-button type="danger">
                  <el-icon class="icon"> <video-play /> </el-icon>
                  {{ $t('service.button.startStudy') }}
                </el-button>
              </router-link>
            </div>
          </div>
          <div class="thumbnail">
            <img :src="service.thumbnail" />
          </div>
        </el-card>
      </div>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { serviceService } from '@/services/service/service';
import { IService, IServiceListResponse } from '@/services/service/types';
import { defineComponent } from 'vue';
import { VideoPlay } from '@element-plus/icons-vue';

interface IData {
  services: IService[];
  loading: boolean;
}
export default defineComponent({
  name: 'ServiceList',
  components: {
    VideoPlay
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
    serviceService.getAll().then(({ data: data }: { data: IServiceListResponse }) => {
      this.services = data.items;
      this.loading = false;
    });
  }
});
</script>

<style lang="scss" scoped>
.services {
  padding: 50px;
  .service {
    width: 1200px;
    height: 360px;
    border-radius: 0.9rem !important;
    margin: 2rem auto;
    padding: 2rem 3rem;
    position: relative;
    .content {
      max-width: 650px;
    }

    .tags {
      .tag {
        padding-left: 20px;
        padding-right: 20px;
      }
    }

    .title {
      cursor: pointer;
      p {
        font-size: 1.7rem;
      }
    }
    .introduction {
      p {
        font-size: 1rem;
        color: rgb(96 111 123);
      }
    }
    .thumbnail {
      img {
        position: absolute;
        right: -165px;
        margin-top: -50px;
        max-width: 80%;
        pointer-events: none;
        top: 0;
        width: 500px;
        height: 500px;
      }
    }
    .study {
      .el-button {
        padding-left: 30px;
        padding-right: 30px;
        .icon {
          margin-right: 4px;
          transform: scale(1.2);
        }
      }
    }
  }
}
</style>
