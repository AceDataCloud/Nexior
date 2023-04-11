<template>
  <el-dialog :model-value="visible" @close="$emit('close')">
    <h2 class="title">{{ $t('common.nav.setting') }}</h2>
    <el-form label-width="120px">
      <el-form-item :label="$t('setting.field.stream')">
        <el-switch v-model="stream" />
      </el-form-item>
      <el-form-item :label="$t('setting.field.endpoint')">
        <el-select v-model="endpoint">
          <el-option v-for="(item, itemIndex) in endpoints" :key="itemIndex" :value="item" />
        </el-select>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDialog, ElForm, ElFormItem, ElOption, ElSelect, ElSwitch } from 'element-plus';
import { ENDPOINT, ENDPOINT2 } from '@/constants/endpoint';
export default defineComponent({
  name: 'SettingPanel',
  components: {
    ElDialog,
    ElForm,
    ElFormItem,
    ElOption,
    ElSelect,
    ElSwitch
  },
  props: {
    visible: {
      type: Boolean,
      required: true
    }
  },
  emits: ['close'],
  data() {
    return {
      endpoints: [ENDPOINT, ENDPOINT2]
    };
  },
  computed: {
    stream: {
      get() {
        return this.$store.getters.setting.stream;
      },
      set(value: boolean) {
        this.$store.dispatch('setSetting', {
          stream: value
        });
      }
    },
    endpoint: {
      get() {
        return this.$store.getters.setting.endpoint;
      },
      set(value: string) {
        this.$store.dispatch('setSetting', {
          endpoint: value
        });
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.title {
  font-size: 20px;
  text-align: center;
  margin-bottom: 20px;
}
</style>
