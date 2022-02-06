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
            <el-col :span="10">
              <div class="title mb-5">
                <p>{{ course.title }}</p>
              </div>
              <div class="introduction mb-5">
                <p>{{ course.introduction }}</p>
              </div>
            </el-col>
            <el-col :span="8"> </el-col>
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
</template>

<script lang="ts">
import { courseService } from '@/services/course/service';
import { ICourse, ICourseDetailResponse } from '@/services/course/types';
import { defineComponent } from 'vue';
interface IData {
  course: ICourse | undefined;
  loading: boolean;
  id: number;
}
export default defineComponent({
  name: 'CourseList',
  data(): IData {
    return {
      id: parseInt(this.$route.params.id.toString()),
      course: undefined,
      loading: false
    };
  },
  async mounted() {
    this.loading = true;
    courseService.get(this.id).then(({ data: data }: { data: ICourseDetailResponse }) => {
      this.loading = false;
      this.course = data;
    });
  }
});
</script>

<style lang="scss" scoped>
.wrapper {
  width: 100%;
  height: 500px;
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
</style>
