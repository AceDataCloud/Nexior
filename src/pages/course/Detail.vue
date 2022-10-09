<template>
  <verification-alert />
  <el-row>
    <el-col :span="24">
      <div class="wrapper">
        <div class="container">
          <el-row v-if="loading">
            <el-col :span="6">
              <el-skeleton style="width: 150px; margin: auto; margin-top: 50px" animated>
                <template #template>
                  <el-skeleton-item variant="image" style="width: 150px; height: 150px" />
                </template>
              </el-skeleton>
            </el-col>
            <el-col :span="18">
              <el-skeleton :rows="5" animated />
            </el-col>
          </el-row>
          <el-row v-if="course">
            <el-col :span="6">
              <div class="thumbnail">
                <img :src="course.thumbnail" />
              </div>
            </el-col>
            <el-col :span="18">
              <div class="title mb-5">
                <p>{{ course.title }}</p>
              </div>
              <div class="category">
                <!-- <el-button>{{ course.category }}</el-button> -->
              </div>
              <div class="introduction mb-5">
                <p>{{ course.introduction }}</p>
              </div>
              <div class="operation">
                <p v-if="paid === false">
                  <el-button @click="onBuy" type="danger" :loading="buying">
                    <el-icon class="icon" v-if="!buying">
                      <goods />
                    </el-icon>
                    {{ $t('course.button.buy') }}
                  </el-button>
                </p>
                <p v-if="paid === true">
                  <el-button @click="onStudy" type="danger">
                    <el-icon class="icon"> <video-play /> </el-icon>
                    {{ $t('course.button.startStudy') }}
                  </el-button>
                </p>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-col>
  </el-row>
  <el-row v-if="course">
    <el-col :span="24">
      <div class="banner">
        <div class="duration">
          <el-icon class="icon"> <clock /> </el-icon>
          <span class="value">{{ course?.duration }}{{ $t('common.entity.minute') }}</span>
        </div>
        <div class="level">
          <el-icon class="icon"> <magic-stick /> </el-icon>
          <span class="value">{{ course?.level }}</span>
        </div>
        <div v-if="episodes && episodes.length > 0" class="number">
          <el-icon class="icon"> <collection /> </el-icon>
          <span class="value">{{ episodes?.length }}{{ $t('common.entity.episodes') }}</span>
        </div>
      </div>
    </el-col>
  </el-row>
  <el-row :class="{ episodes: true, disabled: !verified }">
    <el-col :span="14" :offset="5">
      <el-card v-if="loading" shadow="hover" class="episode">
        <el-skeleton :rows="5" animated />
      </el-card>
      <el-card
        v-for="(episode, episodeIndex) in episodes"
        :key="episodeIndex"
        shadow="hover"
        class="episode"
        @click="
          $router.push({
            name: 'episode-detail',
            params: {
              courseId: course?.id,
              id: episode.id
            }
          })
        "
      >
        <el-row>
          <el-col :span="4" class="left">
            <span class="index">
              {{ episodeIndex + 1 }}
            </span>
          </el-col>
          <el-col :span="20" class="right">
            <div class="title">
              <p>
                {{ episode.title }}
              </p>
            </div>
            <div class="introduction">
              <p>{{ episode.introduction }}</p>
            </div>
            <div class="info">
              <span class="duration">
                <el-icon class="icon"> <clock /> </el-icon>
                {{ episode.duration }} {{ $t('common.entity.minute') }}
              </span>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { courseService } from '@/services/course/service';
import { ICourse, ICourseDetailResponse, ICoursePaidStatusResponse } from '@/services/course/types';
import { episodeService } from '@/services/episode/service';
import { IEpisode, IEpisodeListResponse } from '@/services/episode/types';
import { orderService } from '@/services/order/service';
import { defineComponent } from 'vue';
import { Clock, MagicStick, Collection, VideoPlay, Goods, Loading } from '@element-plus/icons-vue';
import VerificationAlert from '@/components/common/VerificationAlert.vue';
import { IOrder, IOrderDetailResponse } from '@/services/order/types';
import { v4 as uuidv4 } from 'uuid';
import { ElMessage } from 'element-plus';

interface IData {
  course: ICourse | undefined;
  order: IOrder | undefined;
  episodes: IEpisode[] | undefined;
  loading: boolean;
  buying: boolean;
  paid: boolean | undefined;
}

export default defineComponent({
  name: 'CourseDetail',
  components: {
    Clock,
    Collection,
    MagicStick,
    VerificationAlert,
    VideoPlay,
    Goods,
    Loading
  },
  data(): IData {
    return {
      course: undefined,
      order: undefined,
      episodes: [],
      loading: false,
      buying: false,
      paid: undefined
    };
  },
  computed: {
    verified() {
      return this.$store.getters.user.isVerified;
    },
    id() {
      return parseInt(this.$route.params.id.toString());
    }
  },
  async mounted() {
    this.loading = true;
    courseService.get(this.id).then(({ data: data }: { data: ICourseDetailResponse }) => {
      this.loading = false;
      this.course = data;
    });
    courseService.paid(this.id).then(({ data: { paid } }: { data: ICoursePaidStatusResponse }) => {
      this.paid = paid;
    });
    episodeService.getAllForCourse(this.id).then(({ data: data }: { data: IEpisodeListResponse }) => {
      this.episodes = data.items;
    });
  },
  methods: {
    onStudy() {
      if (this.episodes && this.episodes.length > 0) {
        const episode = this.episodes[0];
        this.$router.push({
          name: 'episode-detail',
          params: {
            courseId: this.course?.id,
            id: episode.id
          }
        });
      }
    },
    onBuy() {
      this.buying = true;
      ElMessage.info(this.$t('course.message.creatingOrder'));
      orderService
        .create({
          id: uuidv4().replaceAll(/-/g, ''),
          courses: [this.id],
          description: `${this.$t('common.title.orderDescription')} - ${this.id}`
        })
        .then(({ data: data }: { data: IOrderDetailResponse }) => {
          this.buying = false;
          this.order = data;
          this.$router.push({
            name: 'order-detail',
            params: {
              id: this.order.id
            }
          });
        })
        .catch(() => {
          ElMessage.error(this.$t('course.message.createOrderFailed'));
          this.buying = false;
        });
    }
  }
});
</script>

<style lang="scss" scoped>
.wrapper {
  width: 100%;
  height: 400px;
  background-image: radial-gradient(circle at 0 2%, #283e63, #172337 99%);
  .container {
    width: 1200px;
    margin: auto;
    padding-top: 50px;

    .title {
      p {
        font-weight: bold;
        color: white;
        font-size: 2.4rem;
      }
    }
    .introduction {
      p {
        color: white;
        font-size: 1rem;
      }
    }
    .thumbnail {
      text-align: center;
      img {
        pointer-events: none;
        width: 200px;
        height: 200px;
        margin-top: 50px;
        margin-left: auto;
        margin-right: auto;
      }
    }

    .operation {
      .el-button {
        .icon {
          margin-right: 2px;
        }
      }
    }
  }
}

.banner {
  border-bottom-left-radius: 28px;
  border-bottom-right-radius: 28px;
  background: linear-gradient(270deg, #f44881, #ec454f);
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  height: 55px;
  padding: 12px 50px;
  .duration,
  .level,
  .number {
    font-size: 13px;
    color: white;
    display: inline-block;
    margin-right: 10px;
    color: 10px;
    .icon {
      position: relative;
      top: 1px;
      // margin-right: 5px;
    }
    .value {
      margin-left: 5px;
      // font-weight: bold;
      display: inline-block;
    }
  }
}

.verification-alert {
  padding-top: 50px;
  .go {
    font-weight: bold;
  }
}

.episodes {
  padding: 50px 0;
  &.disabled {
    opacity: 0.2;
    pointer-events: none;
  }
  .episode {
    cursor: pointer;
    margin-bottom: 2rem;
    height: 140px;
    border-radius: 0.934rem !important;
    .left {
      position: relative;
      .index {
        width: 50px;
        height: 50px;
        background: #f8fafe;
        display: block;
        border-radius: 50%;
        line-height: 50px;
        text-align: center;
        font-size: 20px;
        border: 2px solid #e5e5e5;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
    }
    .title {
      p {
        font-size: 1.2rem;
        font-weight: bold;
        margin-bottom: 10px;
        margin-top: 10px;
      }
    }
    .introduction {
      p {
        height: 28px;
        overflow: hidden;
        white-space: nowrap;
        font-size: 0.8rem;
        color: rgb(161, 161, 161);
        text-overflow: ellipsis;
      }
    }
    .info {
      font-size: 12px;
      color: rgb(161, 161, 161);
      .icon {
        position: relative;
        top: 1px;
      }
    }
  }
}
</style>
