<template>
  <div class="title">
    {{ api?.title }}
  </div>
  <div class="url">
    <el-tag class="method" effect="dark">{{ api?.request?.method }}</el-tag>
    <span v-if="api?.endpoint && api?.path" class="endpoint">{{ urlJoin(api?.endpoint, api?.path) }}</span>
  </div>
  <div class="introduction">
    <p>{{ api?.introduction }}</p>
  </div>
</template>

<script lang="ts">
import { IApi } from '@/operators';
import { defineComponent } from 'vue';
import urlJoin from 'url-join';
import { ElTag } from 'element-plus';
export default defineComponent({
  name: 'ApiInfo',
  components: {
    ElTag
  },
  props: {
    api: {
      type: Object as () => IApi,
      required: true
    }
  },
  methods: {
    urlJoin
  }
});
</script>

<style lang="scss" scoped>
.title {
  font-size: 26px;
  font-weight: 500;
  line-height: 1.2;
  margin-bottom: 10px;
}
.url {
  margin-bottom: 10px;
  .method {
    border-radius: 10px;
    padding: 1px 8px;
    font-size: 10px;
    transform: scale(0.8);
    transform-origin: left;
  }
  .endpoint {
    font-size: 12px;
  }
}
.introduction {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
}
</style>
