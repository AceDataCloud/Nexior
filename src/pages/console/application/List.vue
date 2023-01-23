<template>
  <el-row class="panel">
    <el-col :span="24">
      <el-row>
        <el-col :span="24">
          <h2 class="title">{{ $t('common.title.allApplications') }}</h2>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-card shadow="hover">
            <el-table v-loading="loading" :data="applications" stripe>
              <el-table-column :label="$t('application.field.service')" width="200px">
                <template #default="scope">
                  <font-awesome-icon v-if="scope.row?.service?.icon" :icon="scope.row?.service?.icon" />
                  <span style="margin-left: 10px">{{ scope.row.service?.title }}</span>
                </template>
              </el-table-column>
              <el-table-column
                prop="remaining_count"
                :label="$t('application.field.remainingCount')"
                width="100px"
                class-name="text-center"
              />
              <el-table-column
                prop="used_count"
                :label="$t('application.field.usedCount')"
                width="100px"
                class-name="text-center"
              />
              <el-table-column :label="$t('application.field.apiKey')" class-name="api-key">
                <template #default="scope">
                  <span class="key">{{ scope.row.api_key }}</span>
                  <span class="copy">
                    <copy-to-clipboard :content="scope.row.api_key" />
                  </span>
                </template>
              </el-table-column>
              <el-table-column>
                <template #default="scope">
                  <div class="float-right">
                    <el-button @click="onGoDocument(scope.row.service)">
                      {{ $t('application.button.goDocument') }}
                    </el-button>
                    <el-button type="primary" @click="onBuyMore(scope.row.service)">
                      {{ $t('application.button.buyMore') }}
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="10" :offset="14">
          <div class="pagination m-v-lg">
            <pagination :current-page="page" :page-size="limit" :total="total" @change="onPageChange"> </pagination>
          </div>
        </el-col>
      </el-row>
    </el-col>
  </el-row>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import { applicationOperator, IApplication, IApplicationListResponse, IService } from '@/operators';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import Pagination from '@/components/common/Pagination.vue';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';

interface IData {
  applications: IApplication[];
  loading: boolean;
  total: number | undefined;
  limit: number;
  page: number;
}

export default defineComponent({
  name: 'ApplicationList',
  components: {
    FontAwesomeIcon,
    Pagination,
    CopyToClipboard
  },
  data(): IData {
    return {
      applications: [],
      loading: false,
      total: undefined,
      limit: 8,
      page: parseInt(this.$route.query.page?.toString() || '1')
    };
  },
  computed: {
    redirect() {
      return this.$route.query.redirect;
    }
  },
  watch: {},
  mounted() {
    this.onFetchData();
  },
  methods: {
    onBuyMore(service: IService) {},
    onGoDocument(service: IService) {},
    onPageChange(page: number) {
      this.$router.push({
        name: this.$route.name?.toString(),
        query: {
          page: page
        }
      });
      this.onFetchData();
    },
    onFetchData() {
      this.loading = true;
      applicationOperator
        .getAll({
          limit: this.limit,
          offset: (this.page - 1) * this.limit,
          user_id: this.$store.getters.user.id
        })
        .then(({ data: data }: { data: IApplicationListResponse }) => {
          this.applications = data.items;
          this.loading = false;
          this.total = data.count;
        });
    }
  }
});
</script>

<style lang="scss" scoped>
.title {
  font-size: 26px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}
.el-table {
  min-height: calc(100vh - 270px);
  margin-bottom: 50px;
}

.panel {
  padding: 30px;
  .api-key {
    .copy {
      cursor: pointer;
      margin: 0 10px;
    }
  }
}

.pagination {
  float: right;
}
</style>
