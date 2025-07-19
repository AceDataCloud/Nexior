<template>
  <el-descriptions :column="1" class="flex flex-col">
    <el-descriptions-item :label="$t('application.field.serviceName')">{{
      application.service?.title
    }}</el-descriptions-item>
    <el-descriptions-item :label="$t('application.field.id')">
      <span>{{ application.id }}</span>
      <copy-to-clipboard v-if="application.id" :content="application.id" />
    </el-descriptions-item>
    <el-descriptions-item :label="$t('application.field.type')">
      <el-tag v-if="application.type === 'Period'" effect="dark" round>
        {{ $t('application.type.period') }}
      </el-tag>
      <el-tag v-if="application.type === 'Usage'" effect="dark" round>
        {{ $t('application.type.usage') }}
      </el-tag>
    </el-descriptions-item>
    <el-descriptions-item v-if="application.type === 'Period'" :label="$t('application.field.expiredAt')">
      {{ $dayjs.format(application.expired_at) }}
    </el-descriptions-item>
    <el-descriptions-item :label="$t('application.field.remainingAmount')">
      {{ application?.remaining_amount?.toFixed(6) }} {{ $t(`service.unit.` + application?.service?.unit + 's') }}
    </el-descriptions-item>
  </el-descriptions>
</template>

<script lang="ts">
import { IApplication } from '@/models';
import { defineComponent } from 'vue';
import { ElTag, ElDescriptions, ElDescriptionsItem } from 'element-plus';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';

export default defineComponent({
  name: 'ApplicationInfo',
  components: {
    ElTag,
    CopyToClipboard,
    ElDescriptions,
    ElDescriptionsItem
  },
  props: {
    application: {
      type: Object as () => IApplication,
      required: true
    },
    showType: {
      type: Boolean,
      default: false
    },
    showId: {
      type: Boolean,
      default: false
    }
  }
});
</script>

<style lang="scss" scoped>
.info {
  font-size: 13px;
  color: var(--el-text-color-primary);
  text-align: center;
  line-height: 28px;
}
.subtitle {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
