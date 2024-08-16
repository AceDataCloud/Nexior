<template>
  <div v-if="task" class="detail">
    <el-row class="h-full">
      <el-col :span="24" class="h-full">
        <el-row class="h-full main">
          <el-col :span="12" class="h-full p-4">
            <el-image
              v-if="task?.response?.image_url"
              :src="task?.response?.image_url"
              :preview-src-list="[task?.response?.image_url as string]"
              class="image"
              fit="contain"
              @error="onReload($event)"
            />
            <el-alert v-else-if="task?.response?.success === false" :closable="false" class="failure">
              <template #template>
                <font-awesome-icon icon="fa-solid fa-exclamation-triangle" class="mr-1" />
                {{ $t('qrart.name.failure') }}
              </template>
              <p class="description">
                <font-awesome-icon icon="fa-solid fa-circle-info" class="mr-1" />
                {{ $t('qrart.name.failureReason') }}:
                {{ task?.response?.error?.message }}
                <copy-to-clipboard :content="task?.response?.error?.message!" class="btn-copy" />
              </p>
              <p class="description">
                <font-awesome-icon icon="fa-solid fa-hashtag" class="mr-1" />
                {{ $t('qrart.name.traceId') }}:
                {{ task?.response?.trace_id }}
                <copy-to-clipboard :content="task?.response?.trace_id" class="btn-copy" />
              </p>
            </el-alert>
            <el-image v-else class="image error">
              <template #error>
                <div class="image-slot">{{ $t('qrart.message.generating') }}</div>
              </template>
            </el-image>
          </el-col>
          <el-col :span="12" class="h-full overflow-scroll">
            <el-descriptions title="" :column="1">
              <el-descriptions-item :label="$t('qrart.name.taskId')">
                {{ task?.id }}
                <copy-to-clipboard :content="task?.id" class="btn-copy" />
              </el-descriptions-item>
              <el-descriptions-item :label="$t('qrart.name.type')">
                {{ task?.request?.type }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('qrart.name.content')">
                {{ task?.request?.content }}
                <copy-to-clipboard :content="task?.request?.content!" class="btn-copy" />
              </el-descriptions-item>
              <el-descriptions-item :label="$t('qrart.name.prompt')">
                {{ task?.request?.prompt }}
                <copy-to-clipboard v-if="task?.request?.prompt" :content="task?.request?.prompt" class="btn-copy" />
              </el-descriptions-item>
              <el-descriptions-item :label="$t('qrart.name.size')">
                {{ task?.response?.image_width }} x {{ task?.response?.image_height }}
              </el-descriptions-item>
              <el-descriptions-item v-if="task?.created_at" :label="$t('qrart.name.createdAt')">
                {{ $dayjs.format('' + new Date(parseFloat(task?.created_at) * 1000)) }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('qrart.name.seed')">
                {{ task?.request?.seed || task?.response?.seed }}
                <copy-to-clipboard
                  v-if="task?.request?.seed || task?.response?.seed"
                  :content="task?.request?.seed || task?.response?.seed"
                  class="btn-copy"
                />
              </el-descriptions-item>
              <el-descriptions-item :label="$t('qrart.name.steps')">
                {{ task?.request?.steps }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('qrart.name.qrw')">
                {{ task?.request?.qrw }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('qrart.name.preset')">
                {{ task?.request?.preset }}
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
import { ElImage, ElRow, ElCol, ElDescriptions, ElDescriptionsItem, ElAlert } from 'element-plus';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'TaskDetail',
  components: {
    ElImage,
    ElAlert,
    FontAwesomeIcon,
    CopyToClipboard,
    ElDescriptions,
    ElDescriptionsItem,
    ElRow,
    ElCol
  },
  data() {
    return {};
  },
  computed: {
    application() {
      return this.$store.state.qrart?.application;
    },
    task() {
      return this.$store.state.qrart?.tasks?.active;
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

<style lang="scss">
.detail {
  .image.error {
    background: var(--el-bg-color-page);
    .image-slot {
      font-size: 18px;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }
  .failure {
    background: var(--el-fill-color-light);
    height: 100%;
    width: 100%;
  }
}
</style>
