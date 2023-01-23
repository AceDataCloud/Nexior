<template>
  <div v-if="loading">
    <el-skeleton />
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

interface IData {
  documents: IDocument[];
  limit: number;
  offset: number;
  loading: boolean;
}

export default defineComponent({
  name: 'DocumentList',
  components: {
    DocumentListItem
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
          ordering: 'rank'
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

<style lang="scss" scoped>
.wrapper {
  padding: 20px 0;
}
</style>
