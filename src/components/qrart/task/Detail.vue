<template>
  <div class="detail">
    <el-row class="h-full">
      <el-col :span="24" class="h-full">
        <el-row class="h-full main">
          <el-col :span="16" class="h-full">
            <el-image
              v-if="task?.response?.image_url"
              :src="task?.response?.image_url"
              :preview-src-list="[task?.response?.image_url as string]"
              class="image"
              fit="contain"
              @error="onReload($event)"
            />
          </el-col>
          <el-col :span="8" class="h-full overflow-scroll">
            <el-descriptions title="" :column="1">
              <el-descriptions-item label="Task ID">
                {{ task?.id }}
              </el-descriptions-item>
              <el-descriptions-item label="Type">
                {{ task?.request?.type }}
              </el-descriptions-item>
              <el-descriptions-item label="Content">
                {{ task?.request?.content }}
              </el-descriptions-item>
              <el-descriptions-item label="Prompt">
                {{ task?.request?.prompt }}
              </el-descriptions-item>
              <el-descriptions-item label="Size">
                {{ task?.response?.image_width }} x {{ task?.response?.image_height }}
              </el-descriptions-item>
              <el-descriptions-item v-if="task?.created_at" label="Created At">
                {{ $dayjs.format('' + new Date(parseFloat(task?.created_at) * 1000)) }}
              </el-descriptions-item>
              <el-descriptions-item label="Steps">
                {{ task?.request?.steps }}
              </el-descriptions-item>
              <el-descriptions-item label="Qrw">
                {{ task?.request?.qrw }}
              </el-descriptions-item>
              <el-descriptions-item label="Preset">
                {{ task?.request?.preset }}
              </el-descriptions-item>
              <el-descriptions-item label="Seed">
                {{ task?.request?.seed || task?.response?.seed }}
              </el-descriptions-item>
            </el-descriptions>
          </el-col>
        </el-row>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  ElImage,
  ElTag,
  ElButton,
  ElTooltip,
  ElSkeleton,
  ElAlert,
  ElRow,
  ElCol,
  ElDescriptions,
  ElDescriptionsItem
} from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'TaskDetail',
  components: {
    ElImage,
    ElTag,
    ElDescriptions,
    ElDescriptionsItem,
    ElButton,
    ElRow,
    ElCol,
    FontAwesomeIcon,
    ElTooltip,
    ElSkeleton,
    ElAlert
  },
  props: {},
  data() {
    return {};
  },
  computed: {
    application() {
      return this.$store.state.qrart?.application;
    },
    task() {
      return this.$store.state.qrart.tasks?.active;
    }
  },
  methods: {
    onReload(event: Event) {
      const target = event.target as HTMLImageElement;
      // append a random url query to existing url query, to force reload the image
      // extract exiting url query
      const url = new URL(target.src);
      // extract `retry` query
      const retry = url.searchParams.get('retry');
      if (!retry) {
        // if no retry query, set it as random string
        url.searchParams.set('retry', '1');
      } else if (parseInt(retry) < 2) {
        // if retry < 3, increase it by 1
        url.searchParams.set('retry', (parseInt(retry) + 1).toString());
      } else {
        return;
      }
      // set the new url
      target.src = url.toString();
    }
  }
});
</script>

<style lang="scss" scoped>
.detail {
  height: 100%;
  padding: 5px 0;
  .main {
    padding: 15px;
    border: 1px solid var(--el-border-color);
    border-radius: 15px;
  }

  .image {
    height: 100%;
    display: block;
    margin: auto;
  }
}
</style>
