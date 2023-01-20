<template>
  <div v-if="responses" class="wrapper">
    <div v-for="(response, responseKey) in responses" :key="responseKey" class="item">
      <div>
        {{ response }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IResponse, ISchema } from '@/operators/api/models';

interface IData {
  value: {
    [key: string]: string | number;
  };
}

export default defineComponent({
  name: 'ApiResult',
  props: {
    responses: {
      type: Object as () => IResponse[] | [],
      required: true
    }
  },
  // emits: ['change'],
  data(): IData {
    return {
      value: {}
    };
  },
  watch: {},
  methods: {}
});
</script>

<style lang="scss" scoped>
.wrapper {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  overflow: hidden;

  .item {
    display: block;
    overflow: hidden;
    background-color: rgb(248, 248, 248);
    padding: 10px;

    .left {
      width: 70%;
      float: left;
      .info {
        .key {
          font-size: 14px;
          font-weight: bold;
          display: inline-block;
          padding: 6px;
        }
        .type {
          font-size: 14px;
          display: inline-block;
          padding: 6px;
        }
        .required {
          font-size: 12px;
          color: #dd1e2e;
          display: inline-block;
          padding: 6px;
        }
      }
      .description {
        font-size: 12px;
        color: #666;
      }
    }
    .right {
      width: 30%;
      float: left;
    }
  }
}
</style>
