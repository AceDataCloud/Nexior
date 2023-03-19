<template>
  <div v-if="schema" class="body">
    <div v-if="schema.items && schema.type === 'array'" class="items">
      <h2 class="title">{{ $t('api.entity.arrayOf') }}</h2>
      <div v-for="(item, itemKey) in schema.items" :key="itemKey" class="item">
        <response-body :schema="item" />
      </div>
    </div>
    <div class="properties">
      <div v-for="(item, itemKey) in schema.properties" :key="itemKey" class="property">
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
</template>

<script lang="ts">
import { ISchema } from '@/operators';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ResponseBody',
  props: {
    schema: {
      type: Object as () => ISchema,
      required: true
    }
  }
});
</script>

<style lang="scss">
.items {
  padding: 10px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  .title {
    margin-bottom: 5px;
  }
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
</style>
