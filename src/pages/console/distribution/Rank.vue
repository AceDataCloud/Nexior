<template>
  <el-row>
    <el-col :span="24">
      <el-row>
        <el-col :span="24">
          <h2 class="text-[26px] font-bold mb-5 text-[var(--el-text-color-primary)]">
            {{ $t('common.title.distributionRank') }}
          </h2>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-card shadow="hover">
            <el-table
              v-loading="loading"
              :data="distributionRank"
              stripe
              :empty-text="$t('common.message.noData')"
              class="min-h-[calc(100vh-350px)] mb-5"
            >
              <el-table-column
                prop="id"
                :label="$t('distribution.field.inviteeId')"
                class-name="text-center"
                width="400px"
              >
                <template #default="scope">
                  <span class="description">{{ scope.row.invitee_id }}</span>
                  <span class="inline-block cursor-pointer">
                    <copy-to-clipboard :content="scope.row.invitee_id" />
                  </span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('distribution.field.priceSum')" width="150px">
                <template #default="scope">
                  <span class="price">{{ getPriceString({ value: scope.row?.sum }) }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('distribution.field.rewardSum')" width="150px">
                <template #default="scope">
                  <span class="description">{{ getPriceString({ value: scope.row?.reward }) }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('distribution.field.lastPaidAt')">
                <template #default="scope">
                  <span class="created-at">{{ $dayjs.format(scope.row.last_paid_at) }}</span>
                </template>
              </el-table-column>
              <el-table-column fixed="right">
                <template #default="scope">
                  <div class="flex items-center justify-center flex-wrap">
                    <el-button
                      type="primary"
                      size="small"
                      @click="
                        $router.push({
                          name: 'console-distribution-history',
                          query: {
                            invitee_id: scope.row.invitee_id
                          }
                        })
                      "
                    >
                      {{ $t('common.button.detail') }}
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
          <div class="float-right">
            <pagination :current-page="page" :page-size="limit" :total="total" @change="onPageChange"> </pagination>
          </div>
        </el-col>
      </el-row>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Pagination from '@/components/common/Pagination.vue';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import { ElRow, ElCol, ElTable, ElTableColumn, ElCard, ElButton } from 'element-plus';
import { distributionHistoryOperator } from '@/operators';
import { IDistributionHistory, IDistributionStatus } from '@/models';
import { getPriceString } from '@/utils';

interface IData {
  distributionRank: IDistributionHistory[];
  distributionStatus: IDistributionStatus | undefined;
  loading: boolean;
  total: number | undefined;
  limit: number;
}

export default defineComponent({
  name: 'ConsoleDistributionRank',
  components: {
    Pagination,
    CopyToClipboard,
    ElRow,
    ElCol,
    ElTable,
    ElTableColumn,
    ElButton,
    ElCard
  },
  data(): IData {
    return {
      distributionRank: [],
      distributionStatus: undefined,
      loading: false,
      total: undefined,
      limit: 10
    };
  },
  computed: {
    redirect() {
      return this.$route.query.redirect;
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
    getPriceString,
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
      Promise.all([this.onFetchDistributionRank()]).finally(() => {
        this.loading = false;
      });
    },
    async onFetchDistributionRank() {
      const { data } = await distributionHistoryOperator.getRank({
        user_id: this.$store.getters.user.id,
        ordering: '-price',
        limit: this.limit,
        offset: (this.page - 1) * this.limit
      });
      this.distributionRank = data.items;
      this.total = data.count;
    }
  }
});
</script>
