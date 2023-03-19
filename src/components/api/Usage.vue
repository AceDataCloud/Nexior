<template>
  <div class="item">
    <div v-if="api?.request?.queries" class="queries">
      <h2 class="title">{{ $t('api.entity.requestQueries') }}</h2>
      <api-form
        v-model:form="formValue.queries"
        :schema="api?.request?.queries"
        :api="api"
        :applied="applied"
        :applications="applications"
        @refresh-applications="getApplications"
      />
    </div>
    <div v-if="api?.request?.headers" class="headers">
      <h2 class="title">{{ $t('api.entity.requestHeaders') }}</h2>
      <api-form
        v-model:form="formValue.headers"
        :schema="api?.request?.headers"
        :api="api"
        :applications="applications"
      />
    </div>
    <div v-if="api?.request?.body" class="body">
      <h2 class="title">{{ $t('api.entity.requestBody') }}</h2>
      <api-form v-model:form="formValue.body" :schema="api?.request?.body" :api="api" :applications="applications" />
    </div>
    <div v-if="api?.responses" class="responses">
      <h2 class="title">{{ $t('api.entity.response') }}</h2>
      <api-responses :responses="api?.responses" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IApi, IForm } from '@/operators/api/models';
import ApiForm from './Form.vue';
import ApiResponses from './Responses.vue';
import { applicationOperator } from '@/operators/application/operator';
import { IApplication, IApplicationListResponse } from '@/operators/application/models';

export interface IData {
  formValue: IForm;
  applications: IApplication[];
  applied: boolean | undefined;
}

export default defineComponent({
  name: 'ApiUsage',
  components: {
    ApiForm,
    ApiResponses
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
  emits: ['update:form'],
  data(): IData {
    return {
      formValue: this.form || {},
      applications: [],
      applied: undefined
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
          user_id: this.$store.getters.user?.id,
          api_id: this.api.id
        })
        .then(({ data: data }: { data: IApplicationListResponse }) => {
          this.applications = data.items;
          this.applied = this.applications.filter((item) => item?.api?.id === this.api.id).length > 0;
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
