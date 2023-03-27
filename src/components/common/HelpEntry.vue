<template>
  <div>
    <el-tooltip effect="dark" :content="`${$t('common.message.helpWechat')}「sunbitty」`" placement="top-start">
      <el-button type="primary" circle size="large">
        <font-awesome-icon icon="fa-solid fa-question" />
      </el-button>
    </el-tooltip>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElTooltip, ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'HelpEntry',
  components: {
    ElTooltip,
    ElButton,
    FontAwesomeIcon
  }
});
</script>
