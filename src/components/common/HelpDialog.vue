<template>
  <el-dialog :model-value="visible" :width="200" class="text-center" @close="$emit('close')">
    <el-menu :collapse="false" class="menu">
      <el-menu-item v-if="site?.features?.support?.discord?.enabled" index="1" @click="onJoin">
        <font-awesome-icon icon="fa-brands fa-discord" class="mr-2" />
        <template #title>{{ $t('common.message.joinDiscord') }}</template>
      </el-menu-item>
      <el-popover :width="350" trigger="hover">
        <template #reference>
          <el-menu-item v-if="site?.features?.support?.wechat?.enabled" index="2">
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
    </el-menu>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElPopover, ElMenu, ElMenuItem, ElImage, ElDialog } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ROUTE_DISTRIBUTION_INDEX } from '@/router';

export default defineComponent({
  name: 'HelpEntry',
  components: {
    ElImage,
    ElDialog,
    ElPopover,
    ElMenu,
    ElMenuItem,
    FontAwesomeIcon
  },
  props: {
    visible: {
      type: Boolean,
      default: true
    }
  },
  emits: ['close'],
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
