<template>
  <el-card shadow="hover">
    <el-table :data="items" v-loading="loading">
      <el-table-column prop="icon" :label="$t('common.entity.icon')">
        <template #default="scope">
          <img :src="scope.row.icon" class="w-10" />
        </template>
      </el-table-column>
      <el-table-column prop="name" :label="$t('common.entity.platform')"> </el-table-column>
      <el-table-column prop="description" :label="$t('common.entity.description')"> </el-table-column>
      <el-table-column :label="$t('common.entity.status')"> </el-table-column>
      <el-table-column :label="$t('common.entity.operation')">
        <el-button @click="onSetup" round type="primary" size="small">
          {{ $t('common.button.setup') }}
        </el-button>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script lang="ts">
import PlatformService from '@/services/platform/service';
import { IPlatform, IPlatformListResponse } from '@/services/platform/types';
import { defineComponent } from 'vue';

interface IData {
  items: IPlatform[];
  loading: boolean;
}

export default defineComponent({
  data(): IData {
    return {
      items: [],
      loading: false
    };
  },
  async mounted() {
    this.loading = true;
    PlatformService.getAll().then(({ data: data }: { data: IPlatformListResponse }): void => {
      console.log('data', data);
      this.items = data.results;
      this.loading = false;
    });
  },
  methods: {
    onSetup() {
      console.log('333');
    }
  }
});
</script>
