<template>
  <div class="wrapper">
    <div v-if="apis">
      <api-list-item v-for="(api, apiIndex) in apis" :key="apiIndex" :api="api"></api-list-item>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IApi, IApiListResponse } from '@/operators/api/models';
import { apiOperator } from '@/operators/api/operator';
import ApiListItem from './ApiListItem.vue';
interface IData {
  apis: IApi[];
  limit: number;
  offset: number;
}

export default defineComponent({
  name: 'ApiList',
  components: {
    ApiListItem
  },
  data(): IData {
    return {
      apis: [],
      limit: 20,
      offset: 0
    };
  },
  mounted() {
    this.getApis(this.offset, this.limit);
  },
  methods: {
    getApis(offset: number, limit: number) {
      apiOperator
        .getAll({
          offset,
          limit
        })
        .then(({ data: data }: { data: IApiListResponse }) => {
          this.apis = data.items;
          console.log('apis', this.apis);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }
});
</script>

<style lang="scss" scoped></style>
