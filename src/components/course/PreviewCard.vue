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
      <h2>{{ course.title }}</h2>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ICourse } from '@/services/course/types';

export default defineComponent({
  name: 'CoursePreviewCard',
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
  }
}
</style>
