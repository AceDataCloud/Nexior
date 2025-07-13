<template>
  <div class="selector">
    <el-dropdown v-show="false" trigger="click" popper-class="popper">
      <div class="flex justify-center mr-1">
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
          <el-dropdown-item v-for="(option, optionKey) in options" :key="optionKey" @click="onModelGroupChange(option)">
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
    <el-dropdown trigger="click" popper-class="popper">
      <div class="flex justify-center">
        <span class="name">{{ model?.getDisplayName() }}</span>
        <span class="angle">
          <font-awesome-icon icon="fa-solid fa-angle-down" />
        </span>
      </div>
      <template #dropdown>
        <el-dropdown-menu v-if="modelGroup && modelGroup.models">
          <el-dropdown-item
            v-for="(option, optionKey) in modelGroup.models"
            :key="optionKey"
            @click="onModelChange(option)"
          >
            <div class="item">
              <div class="info">
                <p v-if="option.getDisplayName" class="name">{{ option.getDisplayName() }}</p>
                <p v-if="option.getDescription" class="description">{{ option.getDescription() }}</p>
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
  emits: ['update:modelValue', 'select', 'model-group-changed', 'model-changed'],
  data(): IData {
    return {
      options: [CHAT_MODEL_GROUP_CHATGPT, CHAT_MODEL_GROUP_DEEPSEEK, CHAT_MODEL_GROUP_GROK]
    };
  },
  computed: {
    model() {
      console.log('model', this.$store.state.chat.model);
      return this.$store.state.chat.model;
    },
    modelGroup(): IChatModelGroup {
      return (this.$route.meta?.modelGroup as IChatModelGroup) || CHAT_MODEL_GROUP_CHATGPT;
    }
  },
  watch: {
    // set first model when modelGroup changes
    modelGroup(newValue: IChatModelGroup) {
      console.debug('modelGroup from route changed', newValue);
      this.$store.dispatch('chat/setModelGroup', newValue);
      this.$store.dispatch('chat/setModel', newValue.models[0]);
    }
  },
  mounted() {
    // renew models if modelGroup is already set
    console.debug('ModelSelector mounted, checking model group');
    const modelGroups = [CHAT_MODEL_GROUP_CHATGPT, CHAT_MODEL_GROUP_DEEPSEEK, CHAT_MODEL_GROUP_GROK];
    const foundGroup = modelGroups.find((group) => group.name === this.modelGroup.name);
    console.debug('Found model group:', foundGroup);
    if (foundGroup) {
      this.$store.dispatch('chat/setModelGroup', foundGroup);
      this.$store.dispatch('chat/setModel', foundGroup.models[0]);
    }
  },
  methods: {
    onModelGroupChange(modelGroup: IChatModelGroup) {
      this.$store.dispatch('chat/setModelGroup', modelGroup);
      this.$emit('model-group-changed', modelGroup);
    },
    onModelChange(model: IChatModelGroup['models'][number]) {
      this.$store.dispatch('chat/setModel', model);
      this.$emit('model-changed', model);
    }
  }
});
</script>

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
    width: 15px;
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
