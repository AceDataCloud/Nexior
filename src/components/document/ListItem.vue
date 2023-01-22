<template>
  <div v-if="document.type === 'TEXT'" class="item" @click="onClick">
    <el-link type="primary" class="link" :underline="false">
      <span class="name">{{ document?.title }}</span>
    </el-link>
  </div>
  <div v-else-if="document.type === 'API'" class="item" @click="onClick">
    <el-link type="primary" class="link" :underline="false">
      <span class="name">{{ document?.api?.title }}</span>
    </el-link>
    <el-tag v-if="document?.api?.request?.method" type="primary" class="request-method" effect="dark">
      {{ document?.api?.request?.method }}
    </el-tag>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IDocument } from '@/operators/document/models';

export default defineComponent({
  name: 'ApiListItem',
  props: {
    document: {
      type: Object as () => IDocument,
      required: true
    }
  },
  methods: {
    onClick() {
      this.$router.push({
        name: 'document-detail',
        params: {
          id: this.document.id
        }
      });
    }
  }
});
</script>

<style lang="scss" scoped>
$height: 35px;
.item {
  height: $height;
  line-height: $height;
  padding-left: 5px;
  cursor: pointer;
  border-radius: 5px;
  overflow: hidden;
  position: relative;

  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }

  .link {
    color: #333;
    .name {
      display: flex;
    }
  }
  .request-method {
    position: absolute;
    right: 10px;
    top: 5px;
  }
}
</style>
