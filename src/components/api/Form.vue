<template>
  <div v-if="schema" class="wrapper">
    <div v-for="(item, itemKey) in schema?.properties" :key="itemKey" class="item">
      <div class="left">
        <div class="info">
          <span class="key">{{ itemKey }}</span>
          <span class="type">{{ item?.type }}</span>
          <span v-if="!item?.optional" class="required">{{ $t('application.message.requiredParameter') }}</span>
        </div>
        <div class="description">
          {{ item?.title }}
        </div>
      </div>
      <div class="right">
        <div v-if="itemKey === 'token'">
          <div v-if="!applied === true">
            <application-confirm
              v-if="api"
              v-model.visible="confirming"
              :object="api"
              :type="applicationType.API"
              @apply="onApply"
            />
            <el-popover placement="bottom" :width="200" :visible="applied === false">
              <p class="text-center mb-2">
                <small>{{ $t('application.message.notApplied') }}</small>
              </p>
              <p class="text-center">
                <el-button size="small" type="primary" @click="confirming = true">{{
                  $t('common.button.apply')
                }}</el-button>
              </p>
              <template #reference>
                <el-input
                  v-model="value[itemKey?.toString()]"
                  :placeholder="$t('common.title.placeholderOfInput')"
                  class="inline-block w-4/5"
                />
              </template>
            </el-popover>
            <el-tooltip effect="dark" :content="$t('common.button.refresh')" placement="right">
              <span class="inline-block">
                <font-awesome-icon
                  icon="fa-solid fa-rotate-right"
                  class="text-sm cursor-pointer ml-1 color-primary"
                  @click="$emit('refresh-applications')"
                />
              </span>
            </el-tooltip>
          </div>
          <el-select
            v-else
            v-model="value[itemKey?.toString()]"
            :clearable="true"
            :filterable="true"
            :allow-create="true"
            :placeholder="$t('common.title.placeholderOfSelect')"
          >
            <el-option
              v-if="appliedApplication?.credential?.token"
              :label="appliedApplication?.credential?.token"
              :value="appliedApplication?.credential?.token"
              class="select-option"
            >
              <span class="select-option-main">{{ appliedApplication?.credential?.token }}</span>
              <span class="select-option-description">{{ $t('application.message.yourApplication') }}</span>
            </el-option>
          </el-select>
        </div>
        <div v-else>
          <el-select
            v-if="item?.enum"
            v-model="value[itemKey?.toString()]"
            :default-first-option="item?.enum?.length === 1"
            clearable
            :placeholder="$t('common.title.placeholderOfSelect')"
          >
            <el-option v-for="e in item?.enum" :key="e" :label="e" :value="e" />
          </el-select>
          <el-select
            v-else-if="item?.type === 'boolean'"
            v-model="value[itemKey?.toString()]"
            clearable
            :placeholder="$t('common.title.placeholderOfSelect')"
          >
            <el-option key="true" :label="'true'" :value="true" />
            <el-option key="false" :label="'false'" :value="false" />
          </el-select>
          <el-select
            v-else-if="item?.example"
            v-model="value[itemKey?.toString()]"
            :clearable="true"
            :filterable="true"
            :allow-create="true"
            :placeholder="$t('common.title.placeholderOfInput')"
          >
            <el-option :label="item.example" :value="item.example" class="select-option">
              <span class="select-option-main">{{ item.example }}</span>
              <span class="select-option-description">{{ $t('application.message.example') }}</span>
            </el-option>
          </el-select>
          <el-input v-else v-model="value[itemKey?.toString()]" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ISchema } from '@/operators/api/models';
import { applicationOperator, IApi, IApplication, IApplicationType } from '@/operators';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ElPopover, ElInput, ElSelect, ElButton, ElTooltip, ElOption, ElMessage } from 'element-plus';
import { ERROR_CODE_DUPLICATION, ERROR_CODE_UNVERIFIED } from '@/constants/errorCode';
import { getVerificationUrl } from '@/utils';
import ApplicationConfirm from '@/components/application/Confirm.vue';

interface IData {
  value: {
    [key: string]: string | number;
  };
  confirming: boolean;
  applicationType: typeof IApplicationType;
}

export default defineComponent({
  name: 'ApiForm',
  components: {
    FontAwesomeIcon,
    ElPopover,
    ElInput,
    ElSelect,
    ElButton,
    ElTooltip,
    ElOption,
    ApplicationConfirm
  },
  props: {
    schema: {
      type: Object as () => ISchema | undefined,
      required: true
    },
    api: {
      type: Object as () => IApi | undefined,
      required: true
    },
    applications: {
      type: Array as () => IApplication[],
      required: true
    },
    applied: {
      type: Boolean,
      required: false
    }
  },
  emits: ['update:form', 'refresh-applications'],
  data(): IData {
    return {
      value: {},
      confirming: false,
      applicationType: IApplicationType
    };
  },
  computed: {
    appliedApplication(): IApplication | undefined {
      const applications = this.applications.filter((application) => application.api?.id === this.api?.id);
      if (applications.length > 0) {
        return applications[0];
      }
      return undefined;
    }
  },
  watch: {
    value: {
      handler() {
        this.$emit('update:form', { ...this.value });
      },
      deep: true
    }
  },
  methods: {
    onChange(key: string, val: string) {
      this.value[key] = val;
    },
    onRefreshApplications() {
      this.$emit('refresh-applications');
    },
    onApply() {
      this.confirming = false;
      applicationOperator
        .create({
          type: IApplicationType.API,
          api_id: this.api?.id
        })
        .then(() => {
          ElMessage.success(this.$t('application.message.applySuccessfully'));
          this.$emit('refresh-applications');
        })
        .catch((error) => {
          if (error?.response?.data?.code === ERROR_CODE_DUPLICATION) {
            ElMessage.error(this.$t('application.message.alreadyApplied'));
          }
          if (error?.response?.data?.code === ERROR_CODE_UNVERIFIED) {
            ElMessage({
              dangerouslyUseHTMLString: true,
              duration: 0,
              showClose: true,
              message: `${this.$t(
                'application.message.unverified'
              )} <a class="underline" href="${getVerificationUrl()}">${this.$t('application.message.goVerify')}</a>`,
              type: 'warning'
            });
          }
        });
    }
  }
});
</script>

<style lang="scss" scoped>
.wrapper {
  overflow: hidden;

  .item {
    display: block;
    overflow: hidden;
    background-color: rgb(248, 248, 248);
    padding: 10px;
    border-right: 1px solid rgba(0, 0, 0, 0.1);
    border-left: 1px solid rgba(0, 0, 0, 0.1);

    &:first-child {
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      border-top-left-radius: 10px;
      border-top-right-radius: 10px;
    }

    &:not(:first-child):not(:last-child) {
      border-top: 1px solid rgba(0, 0, 0, 0.1);
    }

    &:last-child {
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      border-bottom-left-radius: 10px;
      border-bottom-right-radius: 10px;
    }

    .left {
      width: 70%;
      float: left;
      .info {
        .key {
          font-size: 14px;
          font-weight: bold;
          display: inline-block;
          padding: 3px;
          padding-left: 0;
        }
        .type {
          font-size: 14px;
          display: inline-block;
          padding: 3px;
        }
        .required {
          font-size: 12px;
          color: #dd1e2e;
          display: inline-block;
          padding: 3px;
        }
      }
      .description {
        font-size: 12px;
        color: #666;
      }
    }
    .right {
      width: 30%;
      float: left;
      padding-top: 6px;
    }
  }
}
.el-select-dropdown {
  .select-option {
    .select-option-main {
      display: inline-block;
      font-size: 14px;
    }
    .select-option-description {
      display: inline-block;
      font-size: 12px;
      color: #999;
      margin-left: 20px;
    }
  }
}
</style>
