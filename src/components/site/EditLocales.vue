<template>
  <el-dialog v-model="editing" :title="title" width="min(520px, 94vw)" class="edit-dialog" append-to-body>
    <div class="edit-body locale-edit-body">
      <el-select
        v-model="working"
        multiple
        filterable
        collapse-tags
        collapse-tags-tooltip
        :max-collapse-tags="4"
        :placeholder="$t('site.placeholder.supportedLocales')"
        class="locale-select"
      >
        <el-option v-for="locale in options" :key="locale.value" :label="locale.label" :value="locale.value" />
      </el-select>
      <p v-if="working.length === 0" class="error">{{ $t('site.message.atLeastOneLocale') }}</p>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button round @click="editing = false">{{ $t('common.button.cancel') }}</el-button>
        <el-button round type="primary" :disabled="working.length === 0" @click="onConfirm">
          {{ $t('common.button.confirm') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
  <span
    class="edit"
    role="button"
    tabindex="0"
    :aria-label="$t('common.button.edit')"
    :title="$t('common.button.edit')"
    @click="onOpen"
    @keydown.enter.prevent="onOpen"
    @keydown.space.prevent="onOpen"
  >
    <el-icon class="icon">
      <edit :size="'1em' as any" aria-hidden="true" focusable="false" />
    </el-icon>
  </span>
</template>

<script lang="ts">
import { EditIcon as Edit } from '@acedatacloud/core/icons/components';
import { defineComponent, type PropType } from 'vue';
import { ElButton, ElDialog, ElIcon, ElOption, ElSelect } from 'element-plus';
import { I18N_SUPPORTED_LOCALES } from '@/constants/i18n';

export default defineComponent({
  name: 'EditLocales',
  components: { Edit, ElButton, ElDialog, ElIcon, ElOption, ElSelect },
  props: {
    modelValue: {
      type: Array as PropType<string[]>,
      required: true
    },
    title: {
      type: String,
      required: true
    }
  },
  emits: ['confirm'],
  data() {
    return {
      editing: false,
      working: [] as string[],
      options: I18N_SUPPORTED_LOCALES
    };
  },
  methods: {
    onOpen() {
      this.working = [...this.modelValue];
      this.editing = true;
    },
    onConfirm() {
      if (this.working.length === 0) return;
      this.$emit('confirm', this.working);
      this.editing = false;
    }
  }
});
</script>

<style lang="scss" scoped>
.locale-edit-body,
.locale-select {
  width: 100%;
}

.error {
  margin: 0;
  color: var(--el-color-danger);
  font-size: 12px;
}
</style>
