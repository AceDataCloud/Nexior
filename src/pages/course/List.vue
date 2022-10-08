<template>
  <el-row>
    <el-col :span="20" :offset="2">
      <div class="courses">
        <el-card v-if="loading" class="course">
          <el-skeleton :rows="5" animated />
        </el-card>
        <el-card v-for="(course, courseIndex) in courses" :key="courseIndex" shadow="hover" class="course">
          <div class="content">
            <!-- <div class="tags mb-5">
              <el-button
                v-for="(tag, tagIndex) in course.tags"
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
                  name: 'course-detail',
                  params: {
                    id: course.id
                  }
                })
              "
            >
              <p>{{ course.title }}</p>
            </div>
            <div class="introduction mb-5">
              <p>{{ course.introduction }}</p>
            </div>
            <div class="study">
              <router-link
                :to="{
                  name: 'course-detail',
                  params: {
                    id: course.id
                  }
                }"
              >
                <el-button type="danger">
                  <el-icon class="icon"> <video-play /> </el-icon>
                  {{ $t('course.button.startStudy') }}
                </el-button>
              </router-link>
            </div>
          </div>
          <div class="thumbnail">
            <img :src="course.thumbnail" />
          </div>
        </el-card>
      </div>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { courseService } from '@/services/course/service';
import { ICourse, ICourseListResponse } from '@/services/course/types';
import { defineComponent } from 'vue';
import { VideoPlay } from '@element-plus/icons-vue';

interface IData {
  courses: ICourse[];
  loading: boolean;
}
export default defineComponent({
  name: 'CourseList',
  components: {
    VideoPlay
  },
  data(): IData {
    return {
      courses: [],
      loading: false
    };
  },
  async mounted() {
    this.loading = true;
    console.debug('start to load all courses');
    courseService.getAll().then(({ data: data }: { data: ICourseListResponse }) => {
      this.courses = data.items;
      this.loading = false;
    });
  }
});
</script>

<style lang="scss" scoped>
.courses {
  padding: 50px;
  .course {
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
