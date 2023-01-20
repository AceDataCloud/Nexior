<template>
  <div v-if="schema" class="wrapper">
    <div v-for="(item, itemKey) in schema.properties" :key="itemKey">
      <div class="item">
        <div class="left">
          <div class="info">
            <span class="key">{{ itemKey }}</span>
            <span class="type">{{ item.type }}</span>
            <span v-if="!item.optional" class="required">required</span>
          </div>
          <div class="description">
            {{ item.title }}
          </div>
        </div>
        <div class="right">
          <el-input v-model="value[itemKey.toString()]" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ISchema } from '@/operators/api/models';

interface IData {
  value: {
    [key: string]: string | number;
  };
}

export default defineComponent({
  name: 'ApiForm',
  props: {
    schema: {
      type: Object as () => ISchema | undefined,
      required: true
    }
  },
  emits: ['change'],
  data(): IData {
    return {
      value: {}
    };
  },
  watch: {
    value: {
      handler() {
        console.log('change', this.value);
        this.$emit('change', { ...this.value });
      },
      deep: true
    }
  },
  methods: {
    onChange(key: string, val: string) {
      console.log('key', key, val);
      this.value[key] = val;
      this.$emit('change', {
        ...this.value
      });
    }
  }
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
