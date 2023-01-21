<template>
  <div v-if="schema" class="wrapper">
    <div v-for="(item, itemKey) in schema?.properties" :key="itemKey" class="item">
      <div class="left">
        <div class="info">
          <span class="key">{{ itemKey }}</span>
          <span class="type">{{ item?.type }}</span>
          <span v-if="!item?.optional" class="required">required</span>
        </div>
        <div class="description">
          {{ item?.title }}
        </div>
      </div>
      <div class="right">
        <el-select
          v-if="item?.enum"
          v-model="value[itemKey?.toString()]"
          clearable
          :placeholder="$t('common.title.select')"
        >
          <el-option v-for="e in item?.enum" :key="e" :label="e" :value="e" />
        </el-select>
        <el-input v-else v-model="value[itemKey?.toString()]" />
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
  emits: ['update:form'],
  data(): IData {
    return {
      value: {}
    };
  },
  watch: {
    value: {
      handler() {
        this.$emit('update:form', { ...this.value });
      },
      deep: true
    }
  },
  methods: {
    onChange(key: string, val: string) {
      console.log('key', key, val);
      this.value[key] = val;
    }
  }
});
</script>

<style lang="scss" scoped>
.wrapper {
  overflow: hidden;

  .item {
    display: block;
    overflow: hidden;
    background-color: rgb(248, 248, 248);
    padding: 10px;
    border-right: 1px solid rgba(0, 0, 0, 0.1);
    border-left: 1px solid rgba(0, 0, 0, 0.1);

    &:first-child {
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      border-top-left-radius: 10px;
      border-top-right-radius: 10px;
    }

    &:not(:first-child):not(:last-child) {
      border-top: 1px solid rgba(0, 0, 0, 0.1);
    }

    &:last-child {
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      border-bottom-left-radius: 10px;
      border-bottom-right-radius: 10px;
    }

    .left {
      width: 70%;
      float: left;
      .info {
        .key {
          font-size: 14px;
          font-weight: bold;
          display: inline-block;
          padding: 3px;
          padding-left: 0;
        }
        .type {
          font-size: 14px;
          display: inline-block;
          padding: 3px;
        }
        .required {
          font-size: 12px;
          color: #dd1e2e;
          display: inline-block;
          padding: 3px;
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
      padding-top: 6px;
    }
  }
}
</style>
