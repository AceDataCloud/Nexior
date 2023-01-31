<template>
  <div v-if="loading">
    <el-skeleton />
    <el-divider />
    <el-skeleton />
  </div>
  <div v-else class="item">
    <api-info v-if="api" :api="api" />
    <el-divider />
    <div class="queries">
      <h2 class="title">{{ $t('api.entity.requestQueries') }}</h2>
      <api-form
        v-model:form="formValue.queries"
        :schema="api?.request?.queries"
        :service="api?.service"
        :applications="applications"
        @refresh-applications="getApplications"
      />
    </div>
    <div class="headers">
      <h2 class="title">{{ $t('api.entity.requestHeaders') }}</h2>
      <api-form
        v-model:form="formValue.headers"
        :schema="api?.request?.headers"
        :service="api?.service"
        :applications="applications"
      />
    </div>
    <div class="body">
      <h2 class="title">{{ $t('api.entity.requestBody') }}</h2>
      <api-form
        v-model:form="formValue.body"
        :schema="api?.request?.body"
        :service="api?.service"
        :applications="applications"
      />
    </div>
    <div v-if="api?.responses" class="responses">
      <h2 class="title">{{ $t('api.entity.response') }}</h2>
      <api-result :responses="api?.responses" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IApi, IForm } from '@/operators/api/models';
import ApiForm from './Form.vue';
import ApiResult from './Result.vue';
import { applicationOperator } from '@/operators/application/operator';
import { IApplication, IApplicationListResponse } from '@/operators/application/models';
import { ElSkeleton, ElDivider, ElTag } from 'element-plus';
import ApiInfo from './Info.vue';

export interface IData {
  formValue: IForm;
  applications: IApplication[];
}

export default defineComponent({
  name: 'ApiUsage',
  components: {
    ApiForm,
    ApiResult,
    ElSkeleton,
    ElDivider,
    ApiInfo
  },
  props: {
    api: {
      type: Object as () => IApi,
      required: true
    },
    loading: {
      type: Boolean,
      required: true
    },
    form: {
      type: Object as () => IForm,
      required: true
    }
  },
  emits: ['update:form'],
  data(): IData {
    return {
      formValue: this.form || {},
      applications: []
    };
  },
  watch: {
    formValue: {
      handler(val) {
        this.$emit('update:form', { ...val });
      },
      deep: true
    }
  },
  mounted() {},
  methods: {
    getApplications() {
      applicationOperator
        .getAll({
          user_id: this.$store.getters.user?.id
        })
        .then(({ data: data }: { data: IApplicationListResponse }) => {
          this.applications = data.items;
        })
        .catch((error) => {});
    }
  }
});
</script>

<style lang="scss" scoped>
.item {
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
