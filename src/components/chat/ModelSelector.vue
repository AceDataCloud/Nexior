<template>
  <div class="selector">
    <el-dropdown trigger="click" popper-class="popper">
      <div class="flex align-center justify-center">
        <span class="icon">
          <img :src="modelGroup.icon" />
        </span>
        <span class="name">{{ modelGroup?.getDisplayName() }}</span>
        <span class="angle">
          <font-awesome-icon icon="fa-solid fa-angle-down" />
        </span>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item v-for="(option, optionKey) in options" :key="optionKey" @click="onCommandChange(option)">
            <div class="item">
              <div class="icon">
                <img :src="option.icon" />
              </div>
              <div class="info">
                <p class="name">{{ option.getDisplayName() }}</p>
                <p class="description">{{ option.getDescription() }}</p>
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
import { ElDropdown, ElDropdownItem, ElDropdownMenu } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { IChatModelGroup } from '@/models';
import { CHAT_MODEL_GROUP_CHATGPT, CHAT_MODEL_GROUP_DEEPSEEK, CHAT_MODEL_GROUP_GROK } from '@/constants';

interface IData {
  options: IChatModelGroup[];
}

export default defineComponent({
  name: 'ModelSelector',
  components: {
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    FontAwesomeIcon
  },
  emits: ['update:modelValue', 'select'],
  data(): IData {
    return {
      options: [CHAT_MODEL_GROUP_CHATGPT, CHAT_MODEL_GROUP_DEEPSEEK, CHAT_MODEL_GROUP_GROK]
    };
  },
  computed: {
    modelGroup() {
      return this.$store.state.chat.modelGroup;
    }
  },
  methods: {
    onCommandChange(modelGroup: IChatModelGroup) {
      this.$emit('select', modelGroup);
      this.$store.dispatch('chat/setModelGroup', modelGroup);
    }
  }
});
</script>

<style lang="scss">
.popper {
  border-radius: 20px;
  overflow: hidden;
}
</style>

<style lang="scss" scoped>
.selector {
  cursor: pointer;
  padding: 7px 6px;
  border-radius: 15px;
  margin-bottom: 10px;
  .name {
    font-size: 16px;
    font-weight: bold;
    display: inline-block;
    margin-right: 5px;
  }
  .angle {
    display: inline-block;
    max-width: 5px;
  }
}

.icon {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 5px;
  img {
    width: 18px;
    height: 18px;
    border-radius: 50%;
  }
}

.item {
  display: flex;
  flex-direction: row;

  .icon {
    img {
      width: 30px;
      height: 30px;
      border-radius: 50%;
    }
  }

  .info {
    width: calc(100% - 15px);
    .name {
      font-size: 14px;
      font-weight: bold;
      color: var(--el-text-color-primary);
      margin: 0;
    }
    .description {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin: 0;
    }
  }
}
</style>
