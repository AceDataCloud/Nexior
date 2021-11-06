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
              v-if="!extensionInstalled"
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
                <el-button
                  @click="onSetup(scope.row.alias)"
                  round
                  type="primary"
                  size="mini"
                  v-if="!isSetup[scope.row.alias]"
                >
                  {{ $t('common.button.setup') }}
                </el-button>
                <el-button @click="onDelete(scope.row.alias)" round type="danger" size="mini" v-else>
                  {{ $t('common.button.delete') }}
                </el-button>
              </template>
            </el-table-column>
            <el-table-column :label="$t('common.entity.status')">
              <template #default="scope">
                <el-button type="success" circle v-if="isSetup[scope.row.alias]">
                  <el-icon :size="13">
                    <check />
                  </el-icon>
                </el-button>
                <el-button type="info" circle v-else>
                  <el-icon :size="13">
                    <close />
                  </el-icon>
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
import { ICookie } from '@/types/cookie';
import { Check, Close } from '@element-plus/icons';
import { ElMessageBox, ElMessage } from 'element-plus';

interface IData {
  items: IPlatform[];
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
  computed: {
    extensionInstalled(): boolean {
      return !!document.getElementById('extension-id');
    },
    extensionId(): string | undefined | null {
      return document.getElementById('extension-id')?.getAttribute('value');
    },
    extensionVersion(): string | undefined | null {
      return document.getElementById('extension-version')?.getAttribute('value');
    },
    isSetup(): { [key: string]: boolean } {
      let result: { [key: string]: boolean } = {};
      this.items.forEach((item: IPlatform) => {
        const alias = item.alias;
        const cookies: ICookie[] | undefined = this.$store.getters.cookies(alias);
        result[alias] = !!cookies;
      });
      return result;
    }
  },
  async mounted() {
    this.loading = true;
    PlatformService.getAll().then(({ data: data }: { data: IPlatformListResponse }): void => {
      this.items = data.results;
      this.loading = false;
    });
  },
  methods: {
    onSetup(alias: string) {
      const domain = getDomainByAlias(alias as IAlias);
      if (window.hasOwnProperty('chrome') && this.extensionId) {
        chrome.runtime.sendMessage(
          this.extensionId?.toString(),
          { command: 'getCookies', domain },
          (cookies: ICookie[]) => {
            console.log(cookies);
            this.$store.dispatch('setCookies', {
              alias,
              value: cookies
            });
            ElMessage.success(this.$t('platform.message.setupSuccessfully'));
          }
        );
      }
    },
    onDelete(alias: string) {
      ElMessageBox.confirm(this.$t('platform.message.confirmDelete'), {
        confirmButtonText: this.$t('common.button.confirm'),
        cancelButtonText: this.$t('common.button.cancel'),
        type: 'warning'
      }).then(() => {
        this.$store.dispatch('setCookies', {
          alias,
          value: undefined
        });
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.el-card {
  height: calc(100vh - 100px);
}
</style>
