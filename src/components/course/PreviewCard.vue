<template>
  <div class="card">
    <div
      class="left"
      @click="
        $router.push({
          name: 'course-detail',
          params: {
            id: $route.params.courseId
          }
        })
      "
    >
      <img :src="course.thumbnail" class="thumbnail" />
    </div>
    <div class="right">
      <h2
        class="title"
        @click="
          $router.push({
            name: 'course-detail',
            params: {
              id: $route.params.courseId
            }
          })
        "
      >
        {{ course.title }}
      </h2>
      <div class="info">
        <div class="duration">
          <el-icon class="icon"> <clock /> </el-icon>
          <span class="value">{{ course?.duration }}{{ $t('common.entity.minute') }}</span>
        </div>
        <div class="level">
          <el-icon class="icon"> <magic-stick /> </el-icon>
          <span class="value">{{ course?.level }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ICourse } from '@/services/course/types';
import { Clock, MagicStick, Collection, ArrowRight } from '@element-plus/icons-vue';

export default defineComponent({
  name: 'CoursePreviewCard',
  components: {
    Clock,
    MagicStick
  },
  props: {
    course: {
      type: Object as () => ICourse,
      required: true
    }
  }
});
</script>

<style lang="scss" scoped>
.card {
  width: 100%;
  padding: 10px 30px;
  height: 84px;
  overflow: hidden;
  .left {
    width: 100px;
    float: left;
    .thumbnail {
      text-align: center;
      width: 64px;
      height: 64px;
      cursor: pointer;
    }
  }
  .right {
    padding: 10px 0;
    color: white;
    float: left;

    width: calc(100% - 100px);
    .title {
      cursor: pointer;
    }
    .info {
      color: rgb(120, 144, 156);
      margin-top: 5px;
      .duration,
      .level {
        font-size: 12px;
        display: inline-block;
        margin-right: 5px;
        .icon {
          position: relative;
          top: 1px;
        }
        .value {
          display: inline-block;
          margin-left: 5px;
        }
      }
    }
  }
}
</style>
