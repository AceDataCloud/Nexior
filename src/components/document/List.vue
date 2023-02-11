<template>
  <div v-if="loading">
    <el-skeleton animated />
  </div>
  <div v-else-if="documents" class="wrapper">
    <document-list-item
      v-for="(document, documentIndex) in documents"
      :key="documentIndex"
      :document="document"
    ></document-list-item>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IDocument, IDocumentListResponse } from '@/operators/document/models';
import DocumentListItem from './ListItem.vue';
import { documentOperator } from '@/operators/document';
import { ElSkeleton } from 'element-plus';

interface IData {
  documents: IDocument[];
  limit: number;
  offset: number;
  loading: boolean;
}

export default defineComponent({
  name: 'DocumentList',
  components: {
    DocumentListItem,
    ElSkeleton
  },
  data(): IData {
    return {
      documents: [],
      limit: 20,
      offset: 0,
      loading: false
    };
  },
  computed: {},
  mounted() {
    this.getDocuments(this.offset, this.limit);
  },
  methods: {
    getDocuments(offset: number, limit: number) {
      this.loading = true;
      documentOperator
        .getAll({
          offset,
          limit,
          ordering: 'rank',
          private: false
        })
        .then(({ data: data }: { data: IDocumentListResponse }) => {
          this.loading = false;
          this.documents = data.items;
        })
        .catch((error) => {
          this.loading = false;
          console.error(error);
        });
    }
  }
});
</script>
