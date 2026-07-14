<template>
  <component
    :is="iconComponent"
    class="icon text-[12px] rounded-full py-[5px] px-[6px] cursor-pointer bg-[var(--el-fill-color-lighter)] text-[var(--el-text-color-primary)] shadow-sm"
    :size="'1em' as any"
    aria-hidden="true"
    focusable="false"
  />
</template>

<script lang="ts">
import { CollapseUpIcon, ExpandDownIcon, ExpandRightIcon, PreviousIcon } from '@acedatacloud/core/icons/components';
import { defineComponent, type Component, type PropType } from 'vue';

export default defineComponent({
  name: 'Chevron',
  components: {
    CollapseUpIcon,
    ExpandDownIcon,
    ExpandRightIcon,
    PreviousIcon
  },
  props: {
    direction: {
      type: String as PropType<'up' | 'down' | 'left' | 'right'>,
      default: 'right'
    }
  },
  computed: {
    iconComponent(): Component {
      return {
        up: CollapseUpIcon,
        down: ExpandDownIcon,
        left: PreviousIcon,
        right: ExpandRightIcon
      }[this.direction];
    }
  }
});
</script>
