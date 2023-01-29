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
                  <span>{{ scope.row.service?.title }}</span>
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
              <el-table-column :label="$t('application.field.apiKey')" class-name="api-key" width="330px">
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
                    <el-button v-if="false" @click="onGoDocument(scope.row)">
                      {{ $t('application.button.goDocument') }}
                    </el-button>
                    <el-button type="primary" @click="onBuyMore(scope.row)">
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
  <create-order v-if="active.application" :visible="buying" :application="active.application" @hide="buying = false" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { applicationOperator, IApplication, IApplicationListResponse, IService } from '@/operators';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import Pagination from '@/components/common/Pagination.vue';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import CreateOrder from '@/components/order/Create.vue';

interface IData {
  applications: IApplication[];
  loading: boolean;
  total: number | undefined;
  limit: number;
  buying: boolean;
  form: {
    amount: number | undefined;
  };
  active: {
    service: IService | undefined;
    application: IApplication | undefined;
  };
}

export default defineComponent({
  name: 'ConsoleApplicationList',
  components: {
    FontAwesomeIcon,
    Pagination,
    CopyToClipboard,
    CreateOrder
  },
  data(): IData {
    return {
      applications: [],
      loading: false,
      total: undefined,
      buying: false,
      limit: 8,
      form: {
        amount: 1
      },
      active: {
        service: undefined,
        application: undefined
      }
    };
  },
  computed: {
    redirect() {
      return this.$route.query?.redirect;
    },
    page() {
      return parseInt(this.$route.query.page?.toString() || '1');
    }
  },
  watch: {
    page: {
      handler() {
        this.onFetchData();
      }
    }
  },
  mounted() {
    this.onFetchData();
  },
  methods: {
    onGoDocument(application: IApplication) {},
    onBuyMore(application: IApplication) {
      this.active.application = application;
      this.buying = true;
    },
    onPageChange(page: number) {
      this.$router.push({
        name: this.$route.name?.toString(),
        query: {
          page: page
        }
      });
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
        })
        .catch(() => {
          this.loading = false;
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
