<template>
  <span v-if="application.type === 'Period'" class="info">
    <el-tag v-if="showType" type="primary" class="mr-1" effect="dark">
      {{ $t('application.type.period') }}
    </el-tag>
    {{ $t('common.message.expiredAt') }}:
    {{ $dayjs.format(application.expired_at) }}
    <p v-if="showId" class="subtitle">ID: {{ application.id }}</p>
  </span>
  <span v-if="application.type === 'Usage'" type="success" class="info" effect="dark">
    <el-tag v-if="showType" class="mr-1">
      {{ $t('application.type.usage') }}
    </el-tag>
    {{ $t('common.message.remainingAmount') }}:
    {{ application?.remaining_amount?.toFixed(6) }}
    {{ $t(`service.unit.` + application?.service?.unit + 's') }}
    <p v-if="showId" class="subtitle">ID: {{ application.id }}</p>
  </span>
</template>

<script lang="ts">
import { IApplication } from '@/models';
import { defineComponent } from 'vue';
import { ElTag } from 'element-plus';

export default defineComponent({
  name: 'ApplicationInfo',
  components: {
    ElTag
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
