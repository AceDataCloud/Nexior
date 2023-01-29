<template>
  <div v-if="document" class="center">
    <div v-if="document.type === 'TEXT'">
      <markdown-renderer :content="document?.content" :loading="loading" />
    </div>
    <div v-else-if="document.type === 'API'">
      <api-usage v-if="document.api" v-model:form="form" :loading="loading" :api="document.api" />
    </div>
  </div>
  <div v-if="document?.type === 'API' && document?.api" class="right">
    <div v-if="loading" class="p-5">
      <el-skeleton />
    </div>
    <div v-else>
      <api-code :form="form" :api="document?.api" />
      <api-try :form="form" :api="document?.api" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ApiUsage from '@/components/api/Usage.vue';
import ApiTry from '@/components/api/Try.vue';
import ApiCode from '@/components/api/Code.vue';
import { documentOperator, IDocument, IDocumentDetailResponse } from '@/operators';
import { IForm } from '@/operators/api/models';
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue';
import { ElSkeleton } from 'element-plus';

export interface IData {
  document: IDocument | undefined;
  loading: boolean;
  form: IForm;
}

export default defineComponent({
  name: 'DocumentDetail',
  components: {
    ApiUsage,
    ApiTry,
    ApiCode,
    ElSkeleton,
    MarkdownRenderer
  },
  data(): IData {
    return {
      document: undefined,
      loading: false,
      form: {}
    };
  },
  computed: {
    id() {
      return this.$route.params?.id?.toString();
    }
  },
  watch: {
    id: {
      handler(val) {
        if (val) this.getDocument(val);
      }
    }
  },
  mounted() {
    this.getDocument(this.id);
  },
  methods: {
    getDocument(id: string) {
      this.loading = true;
      this.form = {};
      documentOperator
        .get(id)
        .then(({ data: data }: { data: IDocumentDetailResponse }) => {
          this.loading = false;
          this.document = data;
        })
        .catch((error) => {
          this.loading = false;
          console.error(error);
        });
    }
  }
});
</script>

<style lang="scss" scoped>
.center {
  float: left;
  width: calc(100% - 760px);
  height: 100%;
  padding: 30px;
  .markdown-body {
    background: none;
  }
}

.right {
  float: left;
  width: 480px;
  height: 100%;
  box-shadow: -1px 0 0 #eee;
}
</style>
