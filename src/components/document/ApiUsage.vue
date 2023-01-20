<template>
  <div v-if="loading">
    <el-skeleton />
    <el-divider />
    <el-skeleton />
  </div>
  <div v-else class="item">
    <div class="title">
      {{ api?.title }}
    </div>
    <div class="url">
      <el-tag class="method" size="mini" type="primary" effect="dark">{{ api?.request?.method }}</el-tag>
      <span v-if="api?.endpoint && api?.path" class="endpoint">{{ urlJoin(api?.endpoint, api?.path) }}</span>
    </div>
    <div class="introduction">
      <p>{{ api?.introduction }}</p>
    </div>
    <el-divider />
    <div class="queries">
      <h2 class="title">{{ $t('api.entity.requestQueries') }}</h2>
      <api-form :schema="api?.request.queries" />
    </div>
    <div class="headers">
      <h2 class="title">{{ $t('api.entity.requestHeaders') }}</h2>
      <api-form :schema="api?.request.headers" />
    </div>
    <div class="body">
      <h2 class="title">{{ $t('api.entity.requestBody') }}</h2>
      <api-form :schema="api?.request.body" />
    </div>
    <div v-if="api?.responses" class="responses">
      <h2 class="title">{{ $t('api.entity.response') }}</h2>
      <api-result :responses="api?.responses" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IApi, IApiDetailResponse } from '@/operators/api/models';
import { apiOperator } from '@/operators/api/operator';
import ApiForm from './ApiForm.vue';
import ApiResult from './ApiResult.vue';
import urlJoin from 'url-join';

export interface IData {
  api: IApi | undefined;
  loading: boolean;
}

export default defineComponent({
  name: 'ApiUsage',
  components: {
    ApiForm,
    ApiResult
  },
  props: {
    id: {
      type: String,
      required: true
    }
  },
  data(): IData {
    return {
      api: undefined,
      loading: false
    };
  },
  watch: {
    id: {
      handler() {
        this.getApi(this.id);
      }
    }
  },
  mounted() {
    this.getApi(this.id);
  },
  methods: {
    urlJoin,
    getApi(id: string) {
      this.loading = true;
      apiOperator
        .get(id)
        .then(({ data: data }: { data: IApiDetailResponse }) => {
          this.loading = false;
          this.api = data;
          console.log('api', this.api);
        })
        .catch((error) => {
          this.loading = false;
          console.error(error);
        });
    }
  }
});
</script>

<style lang="scss">
.item {
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

  .queries {
    margin-bottom: 10px;
    .title {
      font-size: 12px;
      margin-bottom: 10px;
    }
  }

  .headers {
    margin-bottom: 10px;
    .title {
      font-size: 12px;
      margin-bottom: 10px;
    }
  }

  .body {
    margin-bottom: 10px;
    .title {
      font-size: 12px;
      margin-bottom: 10px;
    }
  }

  .responses {
    margin-bottom: 10px;
    .title {
      font-size: 12px;
      margin-bottom: 10px;
    }
  }
}
</style>
