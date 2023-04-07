<template>
  <el-dialog
    :model-value="visible"
    width="500px"
    :title="$t('application.message.confirmApplying')"
    center
    @close="$emit('update:visible', false)"
  >
    <div class="content">
      <el-descriptions :column="1">
        <el-descriptions-item :label="$t('application.field.type')">
          <span>
            {{ $t('application.field.api') }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('application.field.name')">
          {{ object?.title }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('application.field.freeAmount')">
          <span v-if="type === applicationType.API">
            {{ object?.free_amount }}{{ $t(`api.unit.${object?.unit}`) }}
          </span>
        </el-descriptions-item>
      </el-descriptions>
      <el-divider class="my-2" />
      <div class="policy">
        <el-checkbox v-model="checked" size="large" class="policy-checkbox" />
        <span class="policy-title"> {{ $t('application.message.readPolicy') }} </span>
        <span class="policy-title highlight" @click="showPolicy = true"> {{ $t('application.message.policy') }} </span>
        <application-policy v-model.visible="showPolicy" />
      </div>
      <el-button type="primary" @click="onApply">{{ $t('common.button.apply') }}</el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDialog, ElDescriptions, ElDescriptionsItem, ElDivider, ElCheckbox, ElButton, ElMessage } from 'element-plus';
import { IApi, IApplicationType } from '@/operators';
import ApplicationPolicy from './Policy.vue';

interface IData {
  applicationType: typeof IApplicationType;
  checked: boolean;
  showPolicy: boolean;
}

export default defineComponent({
  name: 'ApplicationConfirm',
  components: {
    ElDialog,
    ElDescriptions,
    ElDescriptionsItem,
    ElDivider,
    ElCheckbox,
    ElButton,
    ApplicationPolicy
  },
  props: {
    object: {
      type: Object as () => IApi,
      required: true
    },
    type: {
      type: Object as () => IApplicationType,
      required: true
    },
    visible: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  emits: ['update:visible', 'apply'],
  data(): IData {
    return {
      applicationType: IApplicationType,
      checked: false,
      showPolicy: false
    };
  },
  watch: {},
  methods: {
    onApply() {
      if (!this.checked) {
        ElMessage.error(this.$t('application.message.notAgreePolicy'));
        return;
      }
      this.$emit('apply');
    }
  }
});
</script>

<style lang="scss" scoped>
.content {
  padding: 10px 40px;
  .policy {
    margin-bottom: 10px;
    .policy-checkbox {
      margin-right: 10px !important;
    }
    .policy-title {
      font-size: 12px;
      position: relative;
      bottom: 3px;
      &.highlight {
        color: var(--el-color-primary);
        cursor: pointer;
      }
    }
  }
}
</style>
