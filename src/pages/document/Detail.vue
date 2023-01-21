<template>
  <el-row class="wrapper">
    <el-col :span="22" :offset="1">
      <div class="left">
        <api-list />
      </div>
      <div v-if="api" class="main">
        <api-usage v-model:form="form" :api="api" :loading="loading" />
      </div>
      <div v-if="api" class="right">
        <api-try :form="form" :api="api" />
      </div>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ApiList from '@/components/document/ApiList.vue';
import ApiUsage from '@/components/document/ApiUsage.vue';
import ApiTry from '@/components/document/ApiTry.vue';
import { apiOperator } from '@/operators/api/operator';
import { IApi, IApiDetailResponse, IForm } from '@/operators/api/models';

export interface IData {
  api: IApi | undefined;
  loading: boolean;
  form: IForm;
}

export default defineComponent({
  components: {
    ApiList,
    ApiUsage,
    ApiTry
  },
  data(): IData {
    return {
      api: undefined,
      loading: false,
      form: {}
    };
  },
  computed: {
    id() {
      return this.$route.params?.id?.toString();
    }
  },
  watch: {
    id: {
      handler(val) {
        if (val) this.getApi(val);
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
        })
        .catch((error) => {
          this.loading = false;
          console.error(error);
        });
    }
  }
});
</script>

<style lang="scss" scoped>
.wrapper {
  width: 100%;
  overflow: hidden;

  .left {
    float: left;
    width: 280px;
    height: 100%;
    box-shadow: 1px 0 0 #eee;
  }

  .main {
    float: left;
    width: calc(100% - 760px);
    height: 100%;
    padding: 30px;
  }

  .right {
    float: left;
    width: 480px;
    height: 100%;
    box-shadow: -1px 0 0 #eee;
  }
}
</style>
