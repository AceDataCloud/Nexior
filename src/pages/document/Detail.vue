<template>
  <!-- center part -->
  <div class="center">
    <div v-if="loading">
      <el-skeleton animated />
    </div>
    <div v-else-if="document">
      <div v-if="document.type === documentType.TEXT">
        <markdown-renderer :content="document?.content" />
      </div>
      <div v-else-if="document.type === documentType.API">
        <api-info v-if="document.api" :api="document.api" />
        <el-divider />
        <api-usage v-if="document.api" v-model:form="form" :api="document.api" />
        <markdown-renderer :content="document?.content" />
      </div>
      <div v-else-if="document.type === documentType.PROXY">
        <proxy-info v-if="document.proxy" :proxy="document.proxy" />
        <el-divider />
        <markdown-renderer :content="document?.content" />
      </div>
    </div>
  </div>
  <!-- end center part -->
  <!-- right part -->
  <div class="right">
    <div v-if="loading">
      <el-skeleton />
    </div>
    <div v-else-if="document">
      <div v-if="document?.type === documentType.API && document?.api">
        <api-code :form="form" :api="document?.api" />
        <api-try :form="form" :api="document?.api" />
      </div>
    </div>
  </div>
  <!-- end right part -->
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ApiUsage from '@/components/api/Usage.vue';
import ApiTry from '@/components/api/Try.vue';
import ApiInfo from '@/components/api/Info.vue';
import ProxyInfo from '@/components/proxy/Info.vue';
import ApiCode from '@/components/api/Code.vue';
import { documentOperator, IDocument, IDocumentDetailResponse, IDocumentType } from '@/operators';
import { IForm } from '@/operators/api/models';
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue';
import { ElSkeleton, ElDivider } from 'element-plus';
import axios from 'axios';

export interface IData {
  document: IDocument | undefined;
  loading: boolean;
  form: IForm;
  documentType: typeof IDocumentType;
  canceler: AbortController | undefined;
}

export default defineComponent({
  name: 'DocumentDetail',
  components: {
    ApiUsage,
    ApiTry,
    ApiCode,
    ApiInfo,
    ProxyInfo,
    ElSkeleton,
    ElDivider,
    MarkdownRenderer
  },
  data(): IData {
    return {
      document: undefined,
      loading: false,
      form: {},
      documentType: IDocumentType,
      canceler: undefined
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
      // cancel existing pending request
      if (this.canceler) {
        this.canceler.abort();
      }
      this.canceler = new AbortController();
      documentOperator
        .get(id, {
          signal: this.canceler.signal
        })
        .then(({ data: data }: { data: IDocumentDetailResponse }) => {
          this.loading = false;
          this.document = data;
        })
        .catch((error) => {
          if (axios.isCancel(error)) {
            return;
          }
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
  padding: 30px;
  box-shadow: -1px 0 0 #eee;
}

@media (max-width: 1199px) and (min-width: 900px) {
  .center {
    width: calc(100% - 400px);
    height: fit-content;
  }
  .right {
    width: 400px;
    height: fit-content;
  }
}

@media (max-width: 899px) {
  .center {
    width: 100%;
    height: fit-content;
  }

  .right {
    width: 100%;
    display: block;
    height: fit-content;
  }
}
</style>
