<template>
  <el-row :gutter="20">
    <el-col :span="24">
      <div class="px-4 pt-4">
        
      </div>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { Breadcrumb, Pagination } from '@/components/common/index';
import PublicationService from '@/services/content/Publication/service';
import { IPublication, IPublicationListResponse } from '@/services/content/Publication/types';
import { defineComponent } from 'vue';
import { Check, Close } from '@element-plus/icons';
import { PUBLICATION_STATE_MAP } from '@/services/content/publication/constants';
import { Constants, Methods } from '@/mixins/index';
import { DEFAULT_LIMIT } from '@/settings/article';
import { RouteQueryAndHash } from 'vue-router';

interface IData {
  items: IPublication[];
  loading: boolean;
  total: number;
  limit: number;
  offset: number;
}

export default defineComponent({
  mixins: [Constants, Methods],
  components: {
    Breadcrumb,
    Check,
    Close,
    Pagination
  },
  data(): IData {
    return {
      items: [],
      limit: this.$route.query.limit ? parseInt(this.$route.query.limit.toString()) : DEFAULT_LIMIT,
      offset: this.$route.query.offset ? parseInt(this.$route.query.offset.toString()) : 0,
      total: 0,
      loading: false
    };
  },
  computed: {
    currentPage(): number {
      return this.offset / this.limit + 1;
    }
  },
  async mounted() {
    this.onLoadData();
  },
  methods: {
    onLoadData() {
      this.loading = true;
      PublicationService.getAll(this.offset, this.limit).then(
        ({ data: data }: { data: IPublicationListResponse }): void => {
          this.total = data.count;
          this.items = data.results;
          this.loading = false;
        }
      );
    },
    getPublicationState(publication: IPublication) {
      return PUBLICATION_STATE_MAP[publication.state];
    },
    onPageChange(val: number) {
      this.limit = DEFAULT_LIMIT;
      this.offset = (val - 1) * this.limit;
      const route = {
        name: this.$route.name,
        query: {
          ...this.$route.query,
          offset: this.offset,
          limit: this.limit
        }
      };
      this.$router.push(route as RouteQueryAndHash);
      this.onLoadData();
    }
  }
});
</script>

<style lang="scss" scoped>
.el-card {
  height: calc(100vh - 100px);
}
</style>
