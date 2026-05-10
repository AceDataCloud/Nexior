<template>
  <div class="prompt-textarea">
    <div class="header">
      <h2 class="title font-bold">{{ title }}</h2>
      <div class="actions">
        <slot name="actions" />
        <info-icon v-if="info" :content="info" />
        <el-tooltip v-if="expandable" :content="$t('common.button.expand')" placement="top">
          <el-button size="small" circle class="expand-btn" @click="onExpand">
            <font-awesome-icon icon="fa-solid fa-expand" />
          </el-button>
        </el-tooltip>
      </div>
    </div>
    <slot name="before" />
    <el-input
      v-model="text"
      type="textarea"
      class="textarea"
      :autosize="{ minRows, maxRows }"
      resize="vertical"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :show-word-limit="!!maxlength"
    />
    <slot name="after" />

    <el-dialog
      v-if="expandable"
      v-model="expanded"
      :title="dialogTitle || title"
      width="720px"
      top="5vh"
      :close-on-click-modal="false"
      class="prompt-expand-dialog"
      append-to-body
    >
      <el-input
        v-model="text"
        type="textarea"
        :autosize="{ minRows: 14, maxRows: 28 }"
        :placeholder="placeholder"
        :maxlength="maxlength"
        :show-word-limit="!!maxlength"
        autofocus
      />
      <template #footer>
        <el-button type="primary" @click="expanded = false">
          {{ $t('common.button.confirm') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { ElInput, ElButton, ElTooltip, ElDialog } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import InfoIcon from '@/components/common/InfoIcon.vue';

export default defineComponent({
  name: 'PromptTextarea',
  components: {
    ElInput,
    ElButton,
    ElTooltip,
    ElDialog,
    FontAwesomeIcon,
    InfoIcon
  },
  props: {
    modelValue: {
      type: String as PropType<string>,
      default: ''
    },
    title: {
      type: String,
      required: true
    },
    info: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    },
    minRows: {
      type: Number,
      default: 4
    },
    maxRows: {
      type: Number,
      default: 12
    },
    maxlength: {
      type: Number,
      default: 0
    },
    expandable: {
      type: Boolean,
      default: true
    },
    dialogTitle: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue', 'expand'],
  data() {
    return {
      expanded: false
    };
  },
  computed: {
    text: {
      get(): string {
        return this.modelValue ?? '';
      },
      set(val: string) {
        this.$emit('update:modelValue', val);
      }
    }
  },
  methods: {
    onExpand() {
      this.expanded = true;
      this.$emit('expand');
    }
  }
});
</script>

<style lang="scss" scoped>
.prompt-textarea {
  .header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
    .title {
      font-size: 14px;
      margin: 0;
    }
    .actions {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .expand-btn {
      width: 24px;
      height: 24px;
      min-height: 24px;
    }
  }
  .textarea {
    width: 100%;
  }
}
</style>

<style lang="scss">
.prompt-expand-dialog {
  .el-dialog__body {
    padding-top: 8px;
  }
  .el-textarea__inner {
    font-size: 14px;
    line-height: 1.6;
  }
}
</style>
