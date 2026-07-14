<template>
  <span>
    <el-tooltip effect="dark" :content="$t('common.button.restart')" placement="bottom">
      <button
        type="button"
        class="icon-edit"
        :aria-label="$t('common.button.edit')"
        :title="$t('common.button.edit')"
        @click="onEdit"
      >
        <edit-icon class="icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
      </button>
    </el-tooltip>
  </span>
</template>

<script lang="ts">
import { EditIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElTooltip } from 'element-plus';

export default defineComponent({
  name: 'EditMessage',
  components: {
    EditIcon,
    ElTooltip
  },
  props: {
    messages: {
      type: Array,
      required: false,
      default: () => []
    }
  },
  emits: ['click'],
  data() {
    return {
      copied: false
    };
  },
  methods: {
    onEdit() {
      this.$emit('click');
    }
  }
});
</script>

<style lang="scss" scoped>
.icon-edit {
  display: inline-flex;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  color: inherit;
}
</style>
