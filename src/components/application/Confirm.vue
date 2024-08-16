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
        <el-descriptions-item :label="$t('application.field.name')">
          {{ service?.title }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('application.field.freeAmount')">
          <span> {{ service?.free_amount }} {{ $t(`service.unit.${service?.unit}`) }} </span>
        </el-descriptions-item>
      </el-descriptions>
      <el-divider class="my-2" />
      <div class="policy">
        <el-checkbox v-model="checked" size="large" class="policy-checkbox" />
        <span class="policy-title"> {{ $t('application.message.readPolicy') }} </span>
        <a class="policy-title highlight" target="_blank" :href="getBaseUrlPlatform() + '/terms'">
          &nbsp;{{ $t('application.message.policy') }}
        </a>
      </div>
      <el-button round type="primary" @click="onApply">{{ $t('common.button.apply') }}</el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDialog, ElDescriptions, ElDescriptionsItem, ElDivider, ElCheckbox, ElButton, ElMessage } from 'element-plus';
import { IService } from '@/models';
import { getBaseUrlPlatform } from '@/utils';

interface IData {
  checked: boolean;
}

export default defineComponent({
  name: 'ApplicationConfirm',
  components: {
    ElDialog,
    ElDescriptions,
    ElDescriptionsItem,
    ElDivider,
    ElCheckbox,
    ElButton
  },
  props: {
    service: {
      type: Object as () => IService,
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
      checked: true
    };
  },
  watch: {},
  methods: {
    getBaseUrlPlatform,
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
        text-decoration: none;
      }
    }
  }
}
</style>
