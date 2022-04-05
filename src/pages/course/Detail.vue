<template>
  <verification-alert />
  <el-row>
    <el-col :span="24">
      <div class="wrapper">
        <div class="container">
          <el-row v-if="course">
            <el-col :span="6"
              ><div class="thumbnail">
                <img :src="course.thumbnail" />
              </div>
            </el-col>
            <el-col :span="18">
              <div class="title mb-5">
                <p>{{ course.title }}</p>
              </div>
              <div class="introduction mb-5">
                <p>{{ course.introduction }}</p>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-col>
  </el-row>
  <el-row>
    <el-col :span="24">
      <div class="banner"></div>
    </el-col>
  </el-row>
  <el-row :class="{ episodes: true, disabled: !verified }">
    <el-col :span="14" :offset="5">
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
          <el-col :span="3" class="left">
            <span class="index">
              {{ episodeIndex + 1 }}
            </span>
          </el-col>
          <el-col :span="21" class="right">
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
import { ICourse, ICourseDetailResponse } from '@/services/course/types';
import { episodeService } from '@/services/episode/service';
import { IEpisode, IEpisodeListResponse } from '@/services/episode/types';
import { defineComponent } from 'vue';
import { Clock } from '@element-plus/icons-vue';
import VerificationAlert from '@/components/common/VerificationAlert.vue';

interface IData {
  course: ICourse | undefined;
  episodes: IEpisode[] | undefined;
  loading: boolean;
}

export default defineComponent({
  name: 'CourseDetail',
  components: {
    Clock,
    VerificationAlert
  },
  data(): IData {
    return {
      course: undefined,
      episodes: [],
      loading: false
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
    episodeService.getAllForCourse(this.id).then(({ data: data }: { data: IEpisodeListResponse }) => {
      this.episodes = data.items;
    });
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
    height: 100px;
    border-radius: 0.934rem !important;
    .left {
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
        top: 5px;
        left: 35px;
      }
    }
    .title {
      p {
        font-size: 1.2rem;
        font-weight: bold;
        margin-bottom: 10px;
      }
    }
    .introduction {
      p {
        font-size: 0.8rem;
        color: rgb(161, 161, 161);
      }
    }
    .info {
      font-size: 12px;
      color: #666;
      .icon {
        position: relative;
        top: 1px;
      }
    }
  }
}
</style>
