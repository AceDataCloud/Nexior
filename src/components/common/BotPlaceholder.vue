<template>
  <div v-for="_ in 3" :key="_" class="flex mb-[10px]">
    <div class="w-[70px] p-[10px]">
      <el-skeleton animated>
        <template #template>
          <el-skeleton-item variant="image" class="w-[50px] h-[50px] rounded-full" />
        </template>
      </el-skeleton>
    </div>
    <div class="flex-1 p-[10px]">
      <el-skeleton animated>
        <template #template>
          <el-skeleton-item variant="p" class="w-[200px] h-[20px] mb-[15px] block" />
          <el-skeleton-item variant="p" class="w-full h-[200px] max-w-[300px] block" />
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
  }
});
</script>
