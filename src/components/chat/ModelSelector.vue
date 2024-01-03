<template>
  <div class="model-selector">
    <el-dropdown
      v-for="(group, groupIndex) in groups"
      :key="groupIndex"
      trigger="click"
      popper-class="popper"
      @command="onCommandChange"
    >
      <el-button :class="{ group: true, active: group.value === activeGroup }" @click="onSwitchGroup(group)">
        <font-awesome-icon :icon="group.icon" :class="'icon ' + group.value" />
        <span v-if="group.value === activeGroup">
          {{ model.displayName }}
        </span>
        <span v-else>
          {{ group.label }}
        </span>
        <font-awesome-icon icon="fa-solid fa-chevron-down" />
      </el-button>
      <template #dropdown>
        <el-dropdown-menu class="menu">
          <el-dropdown-item
            v-for="(groupModel, groupModelIndex) in group.options"
            :key="groupModelIndex"
            :command="groupModel"
            class="option"
          >
            <div class="item">
              <div class="icon">
                <font-awesome-icon :icon="group.icon" :class="'icon ' + group.value" />
              </div>
              <div class="info">
                <p class="name">
                  {{ groupModel.displayName }}
                </p>
                <p class="description">
                  {{ groupModel.description }}
                </p>
              </div>
            </div>
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
  CHAT_MODEL_CHATGPT4_VISION,
  CHAT_MODEL_CHATGPT_16K,
  CHAT_MODEL_CHATGPT_BROWSING
} from '@/operators/chat/constants';
import { IChatModel } from '@/operators';

const GROUPS = [
  {
    label: '3.5',
    value: 'base',
    icon: 'fa-solid fa-bolt',
    options: [CHAT_MODEL_CHATGPT, CHAT_MODEL_CHATGPT_16K, CHAT_MODEL_CHATGPT_BROWSING]
  },
  {
    label: '4.0',
    value: 'plus',
    icon: 'fa-solid fa-wand-magic-sparkles',
    options: [CHAT_MODEL_CHATGPT4, CHAT_MODEL_CHATGPT4_BROWSING, CHAT_MODEL_CHATGPT4_VISION]
  }
];

export default defineComponent({
  name: 'ModelSelector',
  components: {
    ElDropdown,
    ElButton,
    ElDropdownItem,
    FontAwesomeIcon
  },
  emits: ['update:modelValue', 'select'],
  data() {
    // find active group according to model
    const model = this.$store.state.chat.model;
    const activeGroup = GROUPS.find((group) => {
      return group.options.find((option: IChatModel) => {
        return option.name === model.name;
      });
    })?.value;
    return {
      activeGroup,
      groups: GROUPS
    };
  },
  computed: {
    model() {
      return this.$store.state.chat.model;
    }
  },
  methods: {
    onSwitchGroup(group: any) {
      if (this.activeGroup === group.value) {
        return;
      }
      this.activeGroup = group.value;
      const options = group.options;
      // by default select first option
      if (options && options.length > 0) {
        this.$emit('select', options[0]);
        this.$store.dispatch('chat/setModel', options[0]);
      }
    },
    onCommandChange(command: IChatModel) {
      this.$emit('select', command);
      this.$store.dispatch('chat/setModel', command);
    }
  }
});
</script>

<style lang="scss">
.popper {
  border-radius: 10px;
  overflow: hidden;
}
</style>

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
    .item {
      display: flex;
      flex-direction: row;
      .icon {
        width: 15px;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        margin-right: 5px;
        margin-top: 3px;
        &.base {
          color: #ff9900;
        }
        &.plus {
          color: #ce65e6;
        }
      }
      .info {
        width: calc(100% - 15px);
        .name {
          font-size: 14px;
          font-weight: bold;
          color: #333;
          margin: 0;
        }
        .description {
          font-size: 12px;
          color: #999;
          margin: 0;
        }
      }
    }
  }
}
</style>
