<template>
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
  <el-row class="episodes">
    <el-col :span="14" :offset="5">
      <el-card shadow="hover" v-for="(episode, episodeIndex) in episodes" class="episode">
        <el-row>
          <el-col :span="3"> {{ episodeIndex + 1 }}</el-col>
          <el-col :span="21">
            <div class="title">
              <p>{{ episode.title }}</p>
            </div>
            <div class="introduction">
              <p>{{ episode.introduction }}</p>
            </div>
            <div class="introduction">
              <router-link
                :to="{
                  name: 'episode-detail',
                  params: {
                    courseId: course?.id,
                    id: episode.id
                  }
                }"
              >
                <el-button>{{ $t('common.button.watch') }}</el-button>
              </router-link>
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

interface IData {
  course: ICourse | undefined;
  episodes: IEpisode[] | undefined;
  loading: boolean;
}

export default defineComponent({
  name: 'CourseDetail',
  data(): IData {
    return {
      course: undefined,
      episodes: [],
      loading: false
    };
  },
  computed: {
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

.episodes {
  .episode {
    margin-top: 2rem;
    height: 160px;
    border-radius: 0.934rem !important;
    .title {
      p {
        font-size: 1.5rem;
        font-weight: bold;
      }
    }
    .introduction {
      p {
        font-size: 0.8rem;
        color: rgb(161, 161, 161);
      }
    }
  }
}
</style>
