<template>
  <div v-for="_ in 3" :key="_" class="placeholder">
    <div class="left">
      <el-skeleton animated>
        <template #template>
          <el-skeleton-item variant="image" class="avatar" />
        </template>
      </el-skeleton>
    </div>
    <div class="main">
      <el-skeleton animated>
        <template #template>
          <el-skeleton-item variant="p" class="title" />
          <el-skeleton-item variant="image" class="icon" />
        </template>
      </el-skeleton>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSkeleton, ElSkeletonItem } from 'element-plus';

export default defineComponent({
  name: 'BotPlaceholder',
  components: {
    ElSkeleton,
    ElSkeletonItem
  },
  data() {
    return {};
  }
});
</script>

<style lang="scss" scoped>
.placeholder {
  display: flex;
  flex-direction: row;
  .left {
    width: 70px;
    padding: 10px;

    .avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
    }
  }

  .main {
    width: calc(100% - 70px);
    flex: 1;
    padding: 10px;
    margin-bottom: 10px;

    .icon {
      display: flex;
      height: 200px;
      width: 300px;
    }

    .title {
      display: block;
      width: 200px;
      height: 20px;
      margin-bottom: 15px;
    }
  }
}
</style>
