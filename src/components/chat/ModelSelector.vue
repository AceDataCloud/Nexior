<template>
  <div class="model-selector">
    <el-dropdown v-for="(group, groupIndex) in groups" :key="groupIndex" @command="onCommandChange">
      <el-button type="primary">
        {{ group.label }}
        <el-icon class="el-icon--right"><arrow-down /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item v-for="(option, optionIndex) in group.options" :key="optionIndex" :command="option.value">
            {{ option.label }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption, ElDropdown, ElButton, ElDropdownItem } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ROUTE_CHAT_INDEX } from '@/router/constants';

export default defineComponent({
  name: 'ModelSelector',
  components: {
    ElSelect,
    ElOption,
    ElDropdown,
    ElButton,
    ElDropdownItem,
    FontAwesomeIcon
  },
  props: {
    modelValue: {
      type: String,
      required: true
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      value: this.modelValue,
      groups: [
        {
          label: '基础',
          value: 'base',
          options: [
            {
              label: 'AI 问答',
              value: 'chatgpt'
            },
            {
              label: 'AI 问答 3.5 - 16K',
              value: 'chatgpt-16k'
            },
            {
              label: 'AI 问答 3.5 - 联网版',
              value: 'chatgpt-browsing'
            }
          ]
        },
        {
          label: 'Plus',
          value: 'plus',
          options: [
            {
              label: 'AI 问答 4.0',
              value: 'chatgpt4'
            },
            {
              label: 'AI 问答 4.0 - 联网版',
              value: 'chatgpt4-browsing'
            }
          ]
        }
      ]
    };
  },
  watch: {
    value(val) {
      this.$emit('update:modelValue', val);
    },
    modelValue(val) {
      if (val !== this.value) {
        this.value = val;
      }
    }
  },
  methods: {
    onCommandChange(command: string) {
      console.log('val', command);
      this.value = command;
    }
  }
});
</script>

<style lang="scss" scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  .top {
    display: flex;
    flex-direction: column;
  }
  .bottom {
    display: flex;
    flex-direction: column;
  }
}
</style>
