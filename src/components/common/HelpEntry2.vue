<template>
  <el-tooltip
    effect="dark"
    :content="`<p>${$t('common.message.helpWechat')}: yuxingzou</p><p>${$t(
      'common.message.helpWechat2'
    )}: sunbitty</p>`"
    placement="top-start"
    raw-content
  >
    <el-button class="button">
      <font-awesome-icon icon="fa-solid fa-question" />
    </el-button>
  </el-tooltip>
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

<style lang="scss" scoped>
.button {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: none;
  background-color: var(--el-bg-color-page);
  &.active,
  &:hover,
  &:focus {
    background-color: var(--el-button-hover-bg-color);
    color: var(--el-button-active-text-color);
  }
}
</style>
