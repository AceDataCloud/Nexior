<template>
  <div class="selector">
    <el-dropdown trigger="click" popper-class="popper">
      <div>
        <span class="name">{{ model?.getDisplayName() }}</span>
        <span class="angle">
          <font-awesome-icon icon="fa-solid fa-angle-down" />
        </span>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="(option, optionKey) in options"
            :key="optionKey"
            @click="onCommandChange(option.model)"
          >
            <div class="item">
              <div class="icon" :style="{ color: option.color }">
                <font-awesome-icon :icon="option.icon" />
              </div>
              <div class="info">
                <p class="name">{{ option.model.getDisplayName() }}</p>
                <p class="description">{{ option.model.getDescription() }}</p>
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
import { IChatModel } from '@/models';
import {
  CHAT_MODEL_GPT_3_5,
  CHAT_MODEL_GPT_3_5_BROWSING,
  CHAT_MODEL_GPT_4,
  CHAT_MODEL_GPT_4_BROWSING,
  CHAT_MODEL_GPT_4_VISION,
  CHAT_MODEL_GPT_4_ALL
} from '@/constants';

export default defineComponent({
  name: 'ModelSelector',
  components: {
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    FontAwesomeIcon
  },
  emits: ['update:modelValue', 'select'],
  data() {
    return {
      options: [
        {
          icon: 'fa-solid fa-bolt',
          color: '#ff9900',
          model: CHAT_MODEL_GPT_3_5
        },
        {
          icon: 'fa-solid fa-bolt',
          color: '#ff9900',
          model: CHAT_MODEL_GPT_3_5_BROWSING
        },
        {
          icon: 'fa-solid fa-wand-magic-sparkles',
          color: '#ce65e6',
          model: CHAT_MODEL_GPT_4
        },
        {
          icon: 'fa-solid fa-wand-magic-sparkles',
          color: '#ce65e6',
          model: CHAT_MODEL_GPT_4_BROWSING
        },
        {
          icon: 'fa-solid fa-wand-magic-sparkles',
          color: '#ce65e6',
          model: CHAT_MODEL_GPT_4_VISION
        },
        {
          icon: 'fa-solid fa-wand-magic-sparkles',
          color: '#ce65e6',
          model: CHAT_MODEL_GPT_4_ALL
        }
      ]
    };
  },
  computed: {
    model() {
      const modelName = this.$store.state.chat.model.name;
      const model = [
        CHAT_MODEL_GPT_3_5,
        CHAT_MODEL_GPT_3_5_BROWSING,
        CHAT_MODEL_GPT_4,
        CHAT_MODEL_GPT_4_BROWSING,
        CHAT_MODEL_GPT_4_VISION,
        CHAT_MODEL_GPT_4_ALL
      ].find((model) => model.name === modelName);
      return model;
    }
  },
  methods: {
    onCommandChange(command: IChatModel) {
      this.$emit('select', command);
      this.$store.dispatch('chat/setModel', command);
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
