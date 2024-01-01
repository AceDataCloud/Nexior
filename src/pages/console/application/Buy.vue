<template>
  <el-row class="panel">
    <el-col :span="24">
      <el-row>
        <el-col :span="24">
          <h2 class="title">{{ $t('common.title.buyMore') }}</h2>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-card shadow="hover">
            <el-row>
              <el-col :span="12" :offset="6">
                <el-skeleton v-if="loading" />
                <create-order v-else-if="application" :application="application" />
              </el-col>
            </el-row>
          </el-card>
        </el-col>
      </el-row>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { applicationOperator, IApplication, IApplicationDetailResponse } from '@/operators';
import CreateOrder from '@/components/order/Create.vue';
import { ElRow, ElCol, ElCard, ElSkeleton } from 'element-plus';

interface IData {
  application: IApplication | undefined;
  loading: boolean;
}

export default defineComponent({
  name: 'ConsoleApplicationBuy',
  components: {
    CreateOrder,
    ElSkeleton,
    ElRow,
    ElCol,
    ElCard
  },
  data(): IData {
    return {
      application: undefined,
      loading: false
    };
  },
  computed: {
    id() {
      return this.$route.params?.id?.toString();
    }
  },
  mounted() {
    this.onFetchData();
  },
  methods: {
    onFetchData() {
      this.loading = true;
      applicationOperator
        .get(this.id)
        .then(({ data: data }: { data: IApplicationDetailResponse }) => {
          this.application = data;
          this.loading = false;
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

.panel {
  padding: 30px;
  width: calc(100% - 300px);
  background-color: #f3f5f6;

  .el-card {
    padding: 50px 0;
  }
}

.pagination {
  float: right;
}
</style>
