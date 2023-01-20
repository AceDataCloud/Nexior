<template>
  <div class="item">
    <div class="title">
      {{ api?.title }}
    </div>
    <div class="url">
      <el-button size="mini">{{ api?.request?.method }}</el-button>
      <span>{{ api?.endpoint }}{{ api?.path }}</span>
    </div>
    <div class="description">
      <p>{{ api?.description }}</p>
    </div>
    <div class="queries">
      <h2>Queries</h2>
      <api-form :schema="api?.request.queries" />
    </div>
    <div class="headers">
      <h2>Headers</h2>
      <api-form :schema="api?.request.headers" />
    </div>
    <div class="body">
      <h2>Body</h2>
      <api-form :schema="api?.request.body" />
    </div>
    <div class="responses">
      <h2>Responses</h2>
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
    font-size: 1.9em;
    font-weight: var(--markdown-title-weight);
    line-height: 1.2;
  }
}
</style>
