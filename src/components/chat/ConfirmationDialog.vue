<template>
  <el-dialog v-model="visible" title="确认操作" width="480px" :close-on-click-modal="false">
    <div class="confirmation-body">
      <el-icon size="24" color="#e6a23c"><Warning /></el-icon>
      <div>
        <p class="confirmation-desc">{{ description }}</p>
        <p class="confirmation-tool">
          工具: <strong>{{ toolName }}</strong>
        </p>
        <pre v-if="input" class="confirmation-input">{{ JSON.stringify(input, null, 2) }}</pre>
      </div>
    </div>
    <template #footer>
      <el-button @click="onDeny">拒绝</el-button>
      <el-button type="primary" @click="onAllow">允许</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { Warning } from '@element-plus/icons-vue';

export default defineComponent({
  name: 'ConfirmationDialog',
  components: { Warning },
  props: {
    toolName: { type: String, default: '' },
    description: { type: String, default: '' },
    input: { type: Object, default: () => ({}) }
  },
  emits: ['allow', 'deny'],
  setup(_props, { emit }) {
    const visible = ref(true);
    const onAllow = () => {
      visible.value = false;
      emit('allow');
    };
    const onDeny = () => {
      visible.value = false;
      emit('deny');
    };
    return { visible, onAllow, onDeny };
  }
});
</script>

<style scoped>
.confirmation-body {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.confirmation-desc {
  margin: 0 0 8px 0;
  font-size: 14px;
}
.confirmation-tool {
  font-size: 13px;
  color: #666;
}
.confirmation-input {
  margin-top: 8px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 6px;
  font-size: 12px;
  max-height: 200px;
  overflow: auto;
}
</style>
