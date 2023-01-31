<template>
  <div v-if="document.type === documentType.TEXT" :class="{ item: true, active: id === document?.id }" @click="onClick">
    <el-link type="primary" class="link" :underline="false">
      <span class="name">{{ document?.title }}</span>
    </el-link>
  </div>
  <div
    v-else-if="document.type === documentType.API"
    :class="{ item: true, active: id === document?.id }"
    @click="onClick"
  >
    <el-link type="primary" class="link" :underline="false">
      <span class="name">{{ document?.title || document?.api?.title }}</span>
    </el-link>
    <el-tag v-if="document?.api?.request?.method" type="" class="method" effect="dark">
      {{ document?.api?.request?.method }}
    </el-tag>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IDocument, IDocumentType } from '@/operators/document/models';
import { ROUTE_DOCUMENT_DETAIL } from '@/router';
import { ElLink, ElTag } from 'element-plus';

export default defineComponent({
  name: 'ApiListItem',
  components: {
    ElLink,
    ElTag
  },
  props: {
    document: {
      type: Object as () => IDocument,
      required: true
    }
  },
  data() {
    return {
      documentType: IDocumentType
    };
  },
  computed: {
    id() {
      return this.$route.params?.id?.toString();
    }
  },
  methods: {
    onClick() {
      this.$router.push({
        name: ROUTE_DOCUMENT_DETAIL,
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
  padding-left: 10px;
  cursor: pointer;
  border-radius: 5px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  overflow: hidden;
  position: relative;
  border-left: 3px solid transparent;

  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }

  &.active {
    border-left: 3px solid var(--el-color-primary);
  }

  .link {
    color: #333;
    .name {
      display: flex;
    }
  }
  .method {
    position: absolute;
    right: 10px;
    top: 5px;
  }
}
</style>
