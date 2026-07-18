<template>
  <div class="main flex flex-row flex-1">
    <div
      class="config w-[320px] flex-none h-full min-h-0 overflow-hidden flex flex-col bg-[var(--app-sidebar-bg)] border-r border-[var(--app-border-subtle)]"
    >
      <slot name="config" />
    </div>
    <div class="result h-full p-6 flex-1 flex flex-col min-w-0 overflow-x-hidden bg-[var(--app-content-bg)]">
      <slot name="result" />
    </div>
    <el-button
      v-show="!tasksEmpty"
      circle
      class="menu"
      :aria-label="$t('common.button.openMenu')"
      :title="$t('common.button.openMenu')"
      @click="drawer = true"
    >
      <magic-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
    </el-button>
    <el-drawer v-model="drawer" direction="ltr" :with-header="false" size="340px" class="drawer generator-drawer">
      <slot name="config" />
    </el-drawer>
  </div>
</template>

<script lang="ts">
import { MagicIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElDrawer, ElButton } from 'element-plus';
import taskDrawerMixin from '@/utils/taskDrawerMixin';

export default defineComponent({
  name: 'LayoutFlux',
  components: {
    MagicIcon,
    ElDrawer,
    ElButton
  },
  mixins: [taskDrawerMixin]
});
</script>

<style lang="scss" scoped>
.menu {
  display: none;
}

@media (max-width: 767px) {
  .config {
    display: none;
  }
  .result {
    width: 100%;
  }
  .menu {
    display: block;
    position: absolute;
    right: 8px;
    top: calc(45px + var(--app-safe-area-top));
    z-index: 1000;
  }
}
</style>
