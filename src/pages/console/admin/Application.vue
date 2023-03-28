<template>
  <el-row class="panel">
    <el-col :span="24">
      <el-row>
        <el-col :span="24">
          <h2 class="title">{{ $t('application.title.manageApplication') }}</h2>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-card shadow="hover">
            <el-row>
              <el-col :span="12" :offset="6">
                <el-form :inline="true" label-width="120px">
                  <el-form-item :label="$t('application.field.id')">
                    <el-input v-model="id" />
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" :loading="loading" @click="onQuery">
                      {{ $t('application.button.query') }}
                    </el-button>
                  </el-form-item>
                </el-form>
                <el-divider border-style="dashed" />
                <el-form v-if="application" :inline="true" label-width="120px">
                  <el-form-item :label="$t('application.field.remainingAmount')">
                    <el-input v-model="application.remaining_amount" />
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" :loading="updating" @click="onUpdateRemainingAmount">
                      {{ $t('common.button.update') }}
                    </el-button>
                  </el-form-item>
                </el-form>
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
import { ElRow, ElCol, ElCard, ElForm, ElFormItem, ElInput, ElButton, ElDivider, ElMessage } from 'element-plus';

interface IData {
  application: IApplication | undefined;
  loading: boolean;
  updating: boolean;

  id: string | undefined;
}

export default defineComponent({
  name: 'ConsoleApplication',
  components: {
    ElRow,
    ElCol,
    ElCard,
    ElForm,
    ElFormItem,
    ElInput,
    ElButton,
    ElDivider
  },
  data(): IData {
    return {
      application: undefined,
      id: undefined,
      loading: false,
      updating: false
    };
  },
  computed: {},
  methods: {
    onQuery() {
      if (!this.id) {
        return;
      }
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
    },
    onUpdateRemainingAmount() {
      if (!this.id) {
        return;
      }
      this.updating = true;
      applicationOperator
        .updateRemainingAmount(this.id, {
          remaining_amount: this.application?.remaining_amount
        })
        .then(({ data: data }: { data: IApplicationDetailResponse }) => {
          this.application = data;
          this.updating = false;
          ElMessage.success(this.$t('application.message.updateSuccessfully'));
        })
        .catch(() => {
          this.updating = false;
          ElMessage.error(this.$t('application.message.updateFailed'));
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

.el-card {
  min-height: 500px;
  padding-top: 50px;
}

.panel {
  padding: 30px;
  .credential {
    .copy {
      cursor: pointer;
    }
  }
}

.pagination {
  float: right;
}
</style>
