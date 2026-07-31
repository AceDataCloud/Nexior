<template>
  <!-- Desktop: a layout-transparent wrapper, so the controls stay inline flex
       items of the composer's action row exactly as if this component weren't
       here. Mobile: the same content moves into a dialog, one labelled row
       each. The slot is compiled in the parent, so every binding on those
       controls keeps working untouched in both modes. -->
  <div v-if="!dialog" class="cb-settings-inline">
    <slot />
  </div>
  <el-dialog
    v-else
    :model-value="open"
    :title="$t('codingBridge.session.settings')"
    width="min(420px, 92vw)"
    align-center
    append-to-body
    class="cb-settings-dialog"
    @update:model-value="$emit('update:open', $event)"
  >
    <div class="cb-settings-rows">
      <slot />
    </div>
    <template #footer>
      <el-button type="primary" round @click="$emit('update:open', false)">
        {{ $t('common.button.close') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElDialog } from 'element-plus';

export default defineComponent({
  name: 'CodingBridgeComposerSettings',
  components: { ElButton, ElDialog },
  props: {
    // True on phones: render the controls in a dialog instead of inline.
    dialog: {
      type: Boolean,
      default: false
    },
    open: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:open']
});
</script>

<style scoped lang="scss">
.cb-settings-inline {
  display: contents;
}

.cb-settings-rows {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
</style>
