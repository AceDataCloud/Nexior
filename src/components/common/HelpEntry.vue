<template>
  <el-popover
    placement="bottom"
    :width="200"
    trigger="hover"
    :popper-style="{
      padding: '10px'
    }"
  >
    <template #reference>
      <slot name="main" />
    </template>
    <el-menu :collapse="false" class="menu">
      <el-popover :width="350" trigger="hover">
        <template #reference>
          <el-menu-item
            v-if="site?.features?.support?.wechat?.enabled && site?.features?.support?.wechat?.qr"
            index="1"
          >
            <font-awesome-icon icon="fa-brands fa-weixin" class="mr-2" />
            <template #title>{{ $t('common.message.addWeChat') }}</template>
          </el-menu-item>
        </template>
        <div class="flex">
          <div class="flex-1 text-center">
            <el-image :src="site?.features?.support?.wechat?.qr" />
          </div>
        </div>
      </el-popover>
      <el-menu-item v-if="site?.features?.support?.discord?.enabled" index="2" @click="onJoin">
        <font-awesome-icon icon="fa-brands fa-discord" class="mr-2" />
        <template #title>{{ $t('common.message.joinDiscord') }}</template>
      </el-menu-item>
    </el-menu>
  </el-popover>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElPopover, ElMenu, ElMenuItem, ElImage } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ROUTE_DISTRIBUTION_INDEX } from '@/router';

export default defineComponent({
  name: 'HelpEntry',
  components: {
    ElImage,
    ElPopover,
    ElMenu,
    ElMenuItem,
    FontAwesomeIcon
  },
  computed: {
    site() {
      return this.$store.state.site;
    }
  },
  methods: {
    onJoin() {
      window.open(this.$store.state.site?.features?.support?.discord?.url, '_blank');
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
