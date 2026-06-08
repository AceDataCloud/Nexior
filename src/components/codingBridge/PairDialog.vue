<template>
  <el-dialog
    :model-value="visible"
    width="520px"
    :title="$t('codingBridge.pair.title')"
    center
    @update:model-value="$emit('update:visible', $event)"
  >
    <div class="content">
      <p class="text-sm text-[var(--app-text-subtle)] mb-4">
        {{ $t('codingBridge.pair.intro') }}
      </p>

      <ol class="steps list-none m-0 p-0 mb-4">
        <li class="flex gap-3 mb-3">
          <span class="step-index">1</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm mb-1">{{ $t('codingBridge.pair.step1') }}</p>
            <code class="cmd">pip install coding-bridge-agent</code>
          </div>
        </li>
        <li class="flex gap-3 mb-3">
          <span class="step-index">2</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm mb-1">{{ $t('codingBridge.pair.step2') }}</p>
            <code class="cmd">coding-bridge-agent up</code>
          </div>
        </li>
        <li class="flex gap-3">
          <span class="step-index">3</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm">{{ $t('codingBridge.pair.step3') }}</p>
          </div>
        </li>
      </ol>

      <el-input
        v-model="code"
        size="large"
        class="mb-3"
        :placeholder="$t('codingBridge.pair.codePlaceholder')"
        clearable
        @keyup.enter="onClaim"
      />
      <el-button type="primary" round class="w-full" :loading="claiming" :disabled="!code.trim()" @click="onClaim">
        <font-awesome-icon icon="fa-solid fa-link" class="mr-1" />
        {{ $t('codingBridge.pair.claim') }}
      </el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDialog, ElInput, ElButton, ElMessage } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { Status } from '@/models';

export default defineComponent({
  name: 'CodingBridgePairDialog',
  components: {
    ElDialog,
    ElInput,
    ElButton,
    FontAwesomeIcon
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    initialCode: {
      type: String,
      default: ''
    }
  },
  emits: ['update:visible'],
  data() {
    return {
      code: ''
    };
  },
  computed: {
    claiming(): boolean {
      return this.$store.state.codingBridge?.status?.claimPair === Status.Request;
    }
  },
  watch: {
    visible(value: boolean) {
      if (value && this.initialCode) {
        this.code = this.initialCode;
      }
    },
    initialCode(value: string) {
      if (value) {
        this.code = value;
      }
    }
  },
  methods: {
    async onClaim() {
      const code = this.code.trim();
      if (!code) {
        return;
      }
      try {
        const name = await this.$store.dispatch('codingBridge/claimPair', code);
        ElMessage.success(this.$t('codingBridge.pair.success', { name }) as string);
        this.code = '';
        this.$emit('update:visible', false);
      } catch (error: any) {
        const status = error?.response?.status;
        if (status === 404) {
          ElMessage.error(this.$t('codingBridge.pair.invalidCode') as string);
        } else if (status === 409) {
          ElMessage.error(this.$t('codingBridge.pair.usedCode') as string);
        } else {
          ElMessage.error(this.$t('codingBridge.pair.failed') as string);
        }
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.step-index {
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #fff;
  background-color: var(--el-color-primary);
}

.cmd {
  display: block;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 6px;
  background-color: var(--app-sidebar-bg);
  border: 1px solid var(--app-border-subtle);
  overflow-x: auto;
  white-space: nowrap;
}
</style>
