<template>
  <div class="wrapper">
    <div class="operation">
      <el-button class="btn-try" type="primary" @click="onTry">{{ $t('common.button.try') }}</el-button>
    </div>
    <div class="result">
      <div class="title">{{ $t('api.entity.response') }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { IApi, IForm, IRequest } from '@/operators/api/models';
import { defineComponent } from 'vue';
import axios, { Method } from 'axios';
import urlJoin from 'url-join';

export default defineComponent({
  name: 'ApiTry',
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
      apiKeyValue: this.apiKey
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
      axios(config).then((response) => {
        console.log('response', response);
        // response.data.pipe(fs.createWriteStream('ada_lovelace.jpg'));
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.wrapper {
  padding: 15px;
  .btn-try {
    width: 100%;
  }
}
</style>
