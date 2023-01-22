<template>
  <div class="center">
    <el-skeleton />
    <el-divider />
    <el-skeleton />
  </div>
</template>

<script lang="ts">
import { IDocument, IDocumentListResponse } from '@/operators/document/models';
import { documentOperator } from '@/operators/document/operator';
import { defineComponent } from 'vue';

interface IData {
  documents: IDocument[];
}
export default defineComponent({
  components: {},
  data(): IData {
    return {
      documents: []
    };
  },
  computed: {},
  mounted() {
    this.getDocuments(0, 1);
  },
  methods: {
    getDocuments(offset: number, limit: number) {
      documentOperator
        .getAll({
          offset,
          limit,
          ordering: 'rank'
        })
        .then(({ data: data }: { data: IDocumentListResponse }) => {
          this.documents = data.items;
          if (this.documents.length > 0) {
            const firstDocument = this.documents[0];
            this.$router.push({
              name: 'document-detail',
              params: {
                id: firstDocument.id
              }
            });
          }
        })
        .catch((error) => {
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
}

.right {
  float: left;
  width: 480px;
  height: 100%;
  box-shadow: -1px 0 0 #eee;
}
</style>
