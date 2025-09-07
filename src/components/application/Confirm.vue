<template>
  <el-dialog
    :model-value="visible"
    width="500px"
    :title="$t('application.message.welcome')"
    center
    @close="$emit('update:visible', false)"
  >
    <div class="content py-[10px] px-[40px]">
      <p class="my-4">
        {{ $t('application.message.notApplied') }}
      </p>
      <el-divider class="my-2" />
      <div class="policy mb-[10px]">
        <el-checkbox v-model="checked" size="large" class="policy-checkbox mr-[10px]" />
        <span class="policy-title text-[12px] relative -bottom-[3px]">
          {{ $t('application.message.readPolicy') }}
        </span>
        <a
          class="policy-title text-[12px] relative -bottom-[3px] text-[var(--el-color-primary)] cursor-pointer no-underline"
          target="_blank"
          :href="getBaseUrlPlatform() + '/terms'"
        >
          &nbsp;{{ $t('application.message.policy') }}
        </a>
      </div>
      <el-button round type="primary" @click="onApply">{{ $t('common.button.start') }}</el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDialog, ElDivider, ElCheckbox, ElButton, ElMessage } from 'element-plus';
import { getBaseUrlPlatform } from '@/utils';

interface IData {
  checked: boolean;
}

export default defineComponent({
  name: 'ApplicationConfirm',
  components: {
    ElDialog,
    ElDivider,
    ElCheckbox,
    ElButton
  },
  props: {
    visible: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  emits: ['update:visible', 'apply'],
  data(): IData {
    return {
      checked: true
    };
  },
  watch: {},
  methods: {
    getBaseUrlPlatform,
    onApply() {
      if (!this.checked) {
        ElMessage.error(this.$t('application.message.notAgreePolicy'));
        return;
      }
      this.$emit('apply');
    }
  }
});
</script>
