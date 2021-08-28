<template>
  <el-card shadow="hover">
    <el-table :data="items" style="width: 100%" height="250">
      <el-table-column prop="name" label="姓名" width="120"> </el-table-column>
    </el-table>
  </el-card>
</template>

<script lang="ts">
import PlatformService from '@/services/platform/service';
import { IPlatform, IPlatformListResponse } from '@/services/platform/types';
import { defineComponent, PropType } from 'vue';

interface IData {
  items: IPlatform[];
}

export default defineComponent({
  data(): IData {
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
});
</script>
