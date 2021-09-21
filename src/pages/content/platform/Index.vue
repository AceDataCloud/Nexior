<template>
  <el-row :gutter="20">
    <el-col :span="24">
      <div class="px-4 pt-4">
        <el-card shadow="hover">
          <div class="mb-5">
            <breadcrumb />
          </div>
          <div class="mb-4">
            <el-alert
              :title="$t('content.message.extensionNotInstalled')"
              type="warning"
              show-icon
              v-if="extensionInstalled"
            >
            </el-alert>
          </div>
          <el-table :data="items" v-loading="loading">
            <el-table-column prop="icon" :label="$t('common.entity.icon')">
              <template #default="scope">
                <img :src="scope.row.icon" class="w-10" />
              </template>
            </el-table-column>
            <el-table-column prop="name" :label="$t('common.entity.platform')"> </el-table-column>
            <el-table-column prop="description" :label="$t('common.entity.description')"> </el-table-column>
            <el-table-column :label="$t('common.entity.operation')">
              <template #default="scope">
                <el-button @click="onSetup(scope.row.alias)" round type="primary" size="small">
                  {{ $t('common.button.setup') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { Breadcrumb } from '@/components/common/index';
import PlatformService from '@/services/content/platform/service';
import { IPlatform, IPlatformListResponse } from '@/services/content/platform/types';
import { defineComponent } from 'vue';
import { getDomainByAlias, IAlias } from '@/settings/platform';

interface IData {
  items: IPlatform[];
  loading: boolean;
}

export default defineComponent({
  components: {
    Breadcrumb
  },
  data(): IData {
    return {
      items: [],
      loading: false
    };
  },
  computed: {
    extensionInstalled() {
      return document.getElementById('extension-id');
    },
    extensionId() {
      return document.getElementById('extension-id')?.getAttribute('value');
    },
    extensionVersion() {
      return document.getElementById('extension-version')?.getAttribute('value');
    }
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
    onSetup(alias: string) {
      const domain = getDomainByAlias(alias as IAlias);
      if (window.hasOwnProperty('chrome') && this.extensionId) {
        chrome.runtime.sendMessage(this.extensionId?.toString(), { command: 'getCookies', domain }, (cookies) => {
          console.log(cookies);
          this.$store.dispatch('setCookies', {
            alias,
            value: cookies
          });
        });
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.el-card {
  height: calc(100vh - 100px);
}
</style>
