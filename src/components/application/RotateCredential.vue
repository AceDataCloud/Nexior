<template>
  <el-tooltip effect="dark" :content="$t('application.message.rotateCredential')" placement="top-start">
    <el-popconfirm
      :title="$t('application.message.rotateCredentialConfirm')"
      :confirm-button-text="$t('common.button.confirm')"
      :cancel-button-text="$t('common.button.cancel')"
      :width="290"
      @confirm="onConfirm"
    >
      <template #reference>
        <font-awesome-icon icon="fa-solid fa-arrows-rotate" class="icon-rotate" />
      </template>
    </el-popconfirm>
  </el-tooltip>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ElTooltip, ElPopconfirm } from 'element-plus';

export default defineComponent({
  name: 'RotateCredential',
  components: {
    FontAwesomeIcon,
    ElTooltip,
    ElPopconfirm
  },
  emits: ['rotate'],
  data() {
    return {};
  },
  methods: {
    onConfirm() {
      this.$emit('rotate');
    }
  }
});
</script>

<style lang="scss" scoped>
.icon-rotate {
  cursor: pointer;
  margin-left: 5px;
}
</style>
