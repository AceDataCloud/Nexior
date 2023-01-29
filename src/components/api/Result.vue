<template>
  <el-collapse v-if="responses" id="document-response-item" class="wrapper" accordion>
    <el-collapse-item v-for="(response, responseKey) in responses" :key="responseKey" class="item" :name="responseKey">
      <template #title>
        <span class="badge">
          <el-tag v-if="response?.is_success" class="ml-2" type="success">{{ $t('api.entity.success') }}</el-tag>
          <el-tag v-else class="ml-2" type="danger">{{ $t('api.entity.failure') }}</el-tag>
        </span>
        <span class="status-code">
          {{ response?.status_code }}
        </span>
        <span class="error-code">
          {{ response?.error_code }}
        </span>
      </template>
      <div class="item-body">
        <div v-if="response?.headers?.properties" class="headers">
          <h2 class="title">{{ $t('api.entity.responseHeaders') }}</h2>
          <div class="properties">
            <div v-for="(item, itemKey) in response?.headers?.properties" :key="itemKey" class="property">
              <div class="info">
                <span class="key">{{ itemKey }}</span>
                <span class="type">{{ item?.type }}</span>
              </div>
              <div class="description">
                {{ item?.title }}
              </div>
            </div>
          </div>
        </div>
        <div v-if="response?.body?.properties" class="body">
          <h2 class="title">{{ $t('api.entity.responseBody') }}</h2>
          <div class="properties">
            <div v-for="(item, itemKey) in response?.body?.properties" :key="itemKey" class="property">
              <div class="info">
                <span class="key">{{ itemKey }}</span>
                <span class="type">{{ item?.type }}</span>
              </div>
              <div class="description">
                {{ item?.title }}
              </div>
            </div>
          </div>
        </div>
        <div v-if="response?.example" class="example">
          <h2 class="title">{{ $t('api.entity.responseExample') }}</h2>
          <code-snippet :code="response?.example" />
        </div>
      </div>
    </el-collapse-item>
  </el-collapse>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IResponse } from '@/operators/api/models';
import CodeSnippet from '../common/CodeSnippet.vue';
import { ElCollapse, ElCollapseItem, ElTag } from 'element-plus';

interface IData {
  value: {
    [key: string]: string | number;
  };
}

export default defineComponent({
  name: 'ApiResult',
  components: {
    CodeSnippet,
    ElCollapse,
    ElCollapseItem,
    ElTag
  },
  props: {
    responses: {
      type: Object as () => IResponse[] | [],
      required: true
    }
  },
  data(): IData {
    return {
      value: {}
    };
  }
});
</script>

<style lang="scss" scoped>
.wrapper {
  overflow: hidden;
  border: none;

  .item {
    display: block;
    overflow: hidden;
    background-color: #f8f8f8;
    border-right: 1px solid rgba(0, 0, 0, 0.1);
    border-left: 1px solid rgba(0, 0, 0, 0.1);
    .status-code,
    .error-code {
      display: inline-block;
      padding-left: 5px;
    }

    &.el-collapse-item:last-child {
      margin-bottom: 0;
    }

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

    .item-body {
      padding: 15px;
      .body,
      .headers,
      .example {
        .title {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .properties {
          margin-bottom: 10px;
          .property {
            padding: 10px;
            border-right: 1px solid rgba(0, 0, 0, 0.1);
            border-left: 1px solid rgba(0, 0, 0, 0.1);

            &:first-of-type {
              border-top: 1px solid rgba(0, 0, 0, 0.1);
              border-top-left-radius: 10px;
              border-top-right-radius: 10px;
            }

            &:not(:first-of-type):not(:last-of-type) {
              border-top: 1px solid rgba(0, 0, 0, 0.1);
            }

            &:last-of-type {
              border-top: 1px solid rgba(0, 0, 0, 0.1);
              border-bottom: 1px solid rgba(0, 0, 0, 0.1);
              border-bottom-left-radius: 10px;
              border-bottom-right-radius: 10px;
            }
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
            }
          }
        }
      }
    }
  }
}
</style>

<style lang="scss">
#document-response-item {
  .el-collapse-item__header {
    border: none;
    background: none;
  }
}
</style>
