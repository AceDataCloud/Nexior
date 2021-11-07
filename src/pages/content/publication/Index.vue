<template>
  <el-row :gutter="20">

  </el-row>
</template>

<script lang="ts">
import { Breadcrumb } from '@/components/common/index';
import PublicationService from '@/services/content/Publication/service';
import { IPublication, IPublicationListResponse } from '@/services/content/Publication/types';
import { defineComponent } from 'vue';
import { Check, Close } from '@element-plus/icons';

interface IData {
  items: IPublication[];
  loading: boolean;
}

export default defineComponent({
  components: {
    Breadcrumb,
    Check,
    Close
  },
  data(): IData {
    return {
      items: [],
      loading: false
    };
  },
  computed: {},
  async mounted() {
    this.loading = true;
    PublicationService.getAll().then(({ data: data }: { data: IPublicationListResponse }): void => {
      this.items = data.results;
      this.loading = false;
    });
  },
  methods: {}
});
</script>

<style lang="scss" scoped>
.el-card {
  height: calc(100vh - 100px);
}
</style>
