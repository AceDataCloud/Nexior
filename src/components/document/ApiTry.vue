<template>
  <div class="wrapper">
    <div class="operation">
      <el-button class="btn-try" type="primary" @click="onTry">{{ $t('common.button.try') }}</el-button>
    </div>
    <div v-if="responseData" class="result">
      <div class="title">{{ $t('api.entity.response') }}</div>
      <code-snippet :code="responseData" />
    </div>
  </div>
</template>

<script lang="ts">
import { IApi, IForm, IRequest } from '@/operators/api/models';
import { defineComponent } from 'vue';
import axios, { Method } from 'axios';
import urlJoin from 'url-join';
import CodeSnippet from '../common/CodeSnippet.vue';

export default defineComponent({
  name: 'ApiTry',
  components: {
    CodeSnippet
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
      responseData: ''
    };
  },
  methods: {
    onTry() {
      console.log('try', this.api, this.form);
      const config = {
        method: this.api?.request?.method as Method,
        url: urlJoin(this.api?.endpoint, this.api?.path),
        params: { ...this.form.queries },
        data: { ...this.form.body }
      };
      console.debug('config', config);
      axios(config)
        .then((response) => {
          this.responseData = JSON.stringify(response?.data, null, '  ');
        })
        .catch((error) => {
          console.log('error', error);
          console.log(error);
          console.log('error');
          console.log(error.response);
          this.responseData = JSON.stringify(error?.response?.data, null, '  ');
        });
    }
  }
});
</script>

<style lang="scss" scoped>
.wrapper {
  padding: 15px;
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
