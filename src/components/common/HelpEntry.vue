<template>
  <div>
    <el-popover
      placement="bottom"
      :width="200"
      trigger="hover"
      :popper-style="{
        padding: '10px'
      }"
    >
      <template #reference>
        <el-button type="primary" circle size="large" class="entry">
          <font-awesome-icon icon="fa-solid fa-question" />
        </el-button>
      </template>
      <el-menu :collapse="false" class="menu">
        <el-menu-item index="1" @click="onJoin">
          <font-awesome-icon icon="fa-brands fa-discord" class="mr-2" />
          <template #title>{{ $t('common.message.joinDiscord') }}</template>
        </el-menu-item>
        <el-popover placement="right" :width="420" trigger="hover">
          <template #reference>
            <el-menu-item index="2">
              <font-awesome-icon icon="fa-brands fa-weixin" class="mr-2" />
              <template #title>{{ $t('common.message.addWeChat') }}</template>
            </el-menu-item>
          </template>
          <div class="flex">
            <div class="flex-1 text-center">
              <el-image src="https://cdn.acedata.cloud/wechat.png" />
              <span>{{ $t('common.message.serviceTech') }}</span>
            </div>
            <div class="flex-1 text-center">
              <el-image src="https://cdn.acedata.cloud/ue99mv.png" />
              <span>{{ $t('common.message.businessCooperation') }}</span>
            </div>
          </div>
        </el-popover>
      </el-menu>
    </el-popover>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElPopover, ElMenu, ElMenuItem, ElImage } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ROUTE_DISTRIBUTION_INDEX } from '@/router';

export default defineComponent({
  name: 'HelpEntry',
  components: {
    ElImage,
    ElButton,
    ElPopover,
    ElMenu,
    ElMenuItem,
    FontAwesomeIcon
  },
  methods: {
    onJoin() {
      window.open('https://discord.gg/73F3MYj3vp', '_blank');
    },
    onProfit() {
      this.$router.push({
        name: ROUTE_DISTRIBUTION_INDEX
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.menu {
  border-right: none;
  .el-menu-item {
    height: 40px;
  }
}
</style>
