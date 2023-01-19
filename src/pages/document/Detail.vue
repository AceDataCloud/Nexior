<template>
  <el-row class="wrapper">
    <el-col :span="22" :offset="1">
      <div class="left">
        <api-list />
      </div>
      <div class="main">
        <api-usage v-if="api" :api="api" />
      </div>
      <div class="right"></div>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ApiList from '@/components/document/ApiList.vue';
import ApiUsage from '@/components/document/ApiUsage.vue';
import { apiOperator } from '@/operators/api/operator';
import { IApi, IApiDetailResponse } from '@/operators/api/models';

export interface IData {
  api: IApi | undefined;
}

export default defineComponent({
  components: {
    ApiList,
    ApiUsage
  },
  data(): IData {
    return {
      api: undefined
    };
  },
  methods: {
    getApi(id: string) {
      apiOperator
        .get(id)
        .then(({ data: data }: { data: IApiDetailResponse }) => {
          this.api = data;
          console.log('api', this.api);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }
});
</script>

<style lang="scss" scoped>
.wrapper {
  width: 100%;
  height: 100vh;
  overflow: hidden;

  .left {
    float: left;
    width: 280px;
    height: 100%;
  }

  .main {
    float: left;
    width: calc(100% - 760px);
    height: 100%;
  }

  .right {
    float: left;
    width: 480px;
    height: 100%;
  }
}
</style>
