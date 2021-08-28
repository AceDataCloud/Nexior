<template>
  <el-card shadow="hover">
    <el-table :data="items" style="width: 100%" height="250">
      <el-table-column prop="name" label="姓名" width="120"> </el-table-column>
    </el-table>
  </el-card>
</template>

<script lang="ts">
import PlatformService from '@/services/platform/service';
import { IPlatformListResponse } from '@/services/platform/types';

console.log('PlatformService', PlatformService);

export default {
  data() {
    return {
      items: []
    };
  },
  async mounted() {
    PlatformService.getAll().then(({ data: data }: { data: IPlatformListResponse }): void => {
      console.log('data', data);
      this.items = data.results;
    });
  },
  methods: {}
};
</script>
