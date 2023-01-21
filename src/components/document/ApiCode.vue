<template>
  <div class="authentication">
    <div class="title">
      {{ $t('api.entity.requestHeader') }}
    </div>
    <el-input v-model="apiKeyValue" placeholder="x-api-key">
      <template #prepend>x-api-key</template>
    </el-input>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ApiTry',
  props: {
    apiKey: {
      type: String,
      required: false,
      default: ''
    }
  },
  emits: ['update:api-key'],
  data() {
    return {
      apiKeyValue: this.apiKey
    };
  },
  watch: {
    apiKeyValue: {
      handler(val) {
        this.$emit('update:api-key', val);
      }
    }
  }
});
</script>
