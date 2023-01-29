<template>
  <div class="wrapper">
    <div class="operation mb-2">
      <el-button class="btn-try" type="primary" :loading="loading" @click="onTry">{{
        $t('common.button.try')
      }}</el-button>
    </div>
    <div v-if="responseData" class="result">
      <div class="title">{{ $t('api.entity.response') }}</div>
      <code-snippet :code="responseData" />
    </div>
    <div v-if="loading">
      <el-skeleton />
    </div>
  </div>
</template>

<script lang="ts">
import { IApi, IForm } from '@/operators/api/models';
import { defineComponent } from 'vue';
import axios, { Method } from 'axios';
import urlJoin from 'url-join';
import CodeSnippet from '../common/CodeSnippet.vue';
import { ElButton, ElSkeleton } from 'element-plus';

export default defineComponent({
  name: 'ApiTry',
  components: {
    CodeSnippet,
    ElButton,
    ElSkeleton
  },
  props: {
    api: {
      type: Object as () => IApi,
      required: true
    },
    form: {
      type: Object as () => IForm,
      required: true
    }
  },
  data() {
    return {
      apiKeyValue: this.apiKey,
      responseData: '',
      loading: false
    };
  },
  methods: {
    onTry() {
      this.loading = true;
      this.responseData = '';
      const config = {
        method: this.api?.request?.method as Method,
        url: urlJoin(this.api?.endpoint, this.api?.path),
        params: { ...this.form.queries },
        data: { ...this.form.body }
      };
      axios(config)
        .then((response) => {
          this.loading = false;
          this.responseData = JSON.stringify(response?.data, null, '  ');
        })
        .catch((error) => {
          this.loading = false;
          this.responseData = JSON.stringify(error?.response?.data, null, '  ');
        });
    }
  }
});
</script>

<style lang="scss" scoped>
.wrapper {
  padding: 15px;
  padding-bottom: 0;
  .operation {
    margin-bottom: 10px;
    .btn-try {
      width: 100%;
    }
  }

  .result {
    margin-bottom: 10px;
    .title {
      font-size: 12px;
      margin-bottom: 10px;
    }
  }
}
</style>
