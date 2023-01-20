<template>
  <div class="item">
    <el-link type="primary" class="link" @click="onClick">
      <span class="name">{{ api?.title }}</span>
      <span class="request-method">{{ api?.request?.method }}</span>
    </el-link>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IApi } from '@/operators/api/models';
export default defineComponent({
  name: 'ApiListItem',
  props: {
    api: {
      type: Object as () => IApi,
      required: true
    }
  },
  methods: {
    onClick() {
      this.$router.push({
        name: 'document-detail',
        params: {
          id: this.api.id
        }
      });
    }
  }
});
</script>

<style lang="scss">
.link {
  .name {
    display: flex;
  }
  .request-method {
    display: flex;
    padding-left: 0;
    padding-right: 0;
    width: 40px;
    flex-grow: 0;
    flex-shrink: 0;
    flex-basis: auto;
  }
}
</style>
