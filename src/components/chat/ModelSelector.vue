<template>
  <div class="model-selector">
    <el-dropdown v-for="(group, groupIndex) in groups" :key="groupIndex" trigger="click" @command="onCommandChange">
      <el-button :class="{ group: true, active: group.value === activeGroup }" @click="onSwitchGroup(group)">
        <font-awesome-icon :icon="group.icon" :class="'icon ' + group.value" />
        <span v-if="group.value === activeGroup">
          {{ value.displayName }}
        </span>
        <span v-else>
          {{ group.label }}
        </span>
        <font-awesome-icon icon="fa-solid fa-chevron-down" />
      </el-button>
      <template #dropdown>
        <el-dropdown-menu class="menu">
          <el-dropdown-item
            v-for="(model, modelIndex) in group.options"
            :key="modelIndex"
            :command="model"
            class="option"
          >
            <font-awesome-icon :icon="group.icon" :class="'icon ' + group.value" />
            {{ model.displayName }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDropdown, ElButton, ElDropdownItem } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  CHAT_MODEL_CHATGPT,
  CHAT_MODEL_CHATGPT4,
  CHAT_MODEL_CHATGPT4_BROWSING,
  CHAT_MODEL_CHATGPT_16K,
  CHAT_MODEL_CHATGPT_BROWSING
} from '@/operators/chat/constants';
import { IChatModel } from '@/operators';

export default defineComponent({
  name: 'ModelSelector',
  components: {
    ElDropdown,
    ElButton,
    ElDropdownItem,
    FontAwesomeIcon
  },
  props: {
    modelValue: {
      type: Object as () => IChatModel,
      required: true
    }
  },
  emits: ['update:modelValue', 'select'],
  data() {
    return {
      value: this.modelValue,
      activeGroup: 'base',
      groups: [
        {
          label: '基础',
          value: 'base',
          icon: 'fa-solid fa-bolt',
          options: [CHAT_MODEL_CHATGPT, CHAT_MODEL_CHATGPT_16K, CHAT_MODEL_CHATGPT_BROWSING]
        },
        {
          label: 'Plus',
          value: 'plus',
          icon: 'fa-solid fa-wand-magic-sparkles',
          options: [CHAT_MODEL_CHATGPT4, CHAT_MODEL_CHATGPT4_BROWSING]
        }
      ]
    };
  },
  watch: {
    modelValue(val) {
      if (val !== this.value) {
        this.value = val;
      }
    }
  },
  methods: {
    onSwitchGroup(group: any) {
      if (this.activeGroup === group.value) {
        return;
      }
      this.activeGroup = group.value;
      const options = group.options;
      if (options && options.length > 0) {
        this.value = options[0];
        this.$emit('select', options[0]);
        this.$emit('update:modelValue', options[0]);
      }
    },
    onCommandChange(command: IChatModel) {
      this.value = command;
      this.$emit('select', command);
      this.$emit('update:modelValue', command);
    }
  }
});
</script>

<style lang="scss" scoped>
.model-selector {
  background-color: #ececf1;
  padding: 7px 6px;
  border-radius: 15px;
  margin-bottom: 5px;
  .group {
    padding: 20px 30px;
    color: black;
    border: none;
    border-radius: 10px;
    margin: 0 3px;
    background-color: inherit;
    &:hover,
    &:focus {
      background-color: inherit;
    }
    &.active {
      background-color: white;
    }
    .icon {
      display: inline-block;
      margin-right: 5px;
      &.base {
        color: #ff9900;
      }
      &.plus {
        color: #ce65e6;
      }
    }
    .fa-chevron-down {
      margin-left: 5px;
      font-weight: 100;
      color: #999;
      transform: scale(0.8);
    }
  }
}
.menu {
  .option {
    .icon {
      display: inline-block;
      margin-right: 5px;
      &.base {
        color: #ff9900;
      }
      &.plus {
        color: #ce65e6;
      }
    }
  }
}
</style>
