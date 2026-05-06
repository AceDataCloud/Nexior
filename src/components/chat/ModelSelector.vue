<template>
  <div class="selector">
    <el-dropdown trigger="click" popper-class="model-selector-popper">
      <div class="trigger">
        <img v-if="model?.icon" :src="model.icon" class="trigger-icon" />
        <span class="trigger-name">{{ model?.getDisplayName?.() ?? model?.name ?? '' }}</span>
        <font-awesome-icon icon="fa-solid fa-chevron-down" class="trigger-arrow" />
      </div>
      <template #dropdown>
        <el-dropdown-menu v-if="modelGroup && modelGroup?.models">
          <el-dropdown-item
            v-for="(option, optionKey) in modelGroup?.models?.filter((m) => m.enabled)"
            :key="optionKey"
            :class="{ active: model?.name === option?.name }"
            @click="onModelChange(option)"
          >
            <div class="item">
              <img v-if="option?.icon" :src="option.icon" class="item-icon" />
              <div class="item-info">
                <p v-if="option?.getDisplayName" class="item-name">{{ option?.getDisplayName() }}</p>
                <p v-if="option?.getDescription" class="item-desc">{{ option?.getDescription() }}</p>
              </div>
              <font-awesome-icon v-if="model?.name === option?.name" icon="fa-solid fa-check" class="item-check" />
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
import {
  CHAT_MODEL_GROUP_CHATGPT,
  CHAT_MODEL_GROUP_DEEPSEEK,
  CHAT_MODEL_GROUP_GROK,
  CHAT_MODEL_GROUP_GEMINI,
  CHAT_MODEL_GROUP_CLAUDE,
  CHAT_MODEL_GROUP_KIMI
} from '@/constants';

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
      options: [
        CHAT_MODEL_GROUP_CHATGPT,
        CHAT_MODEL_GROUP_DEEPSEEK,
        CHAT_MODEL_GROUP_GROK,
        CHAT_MODEL_GROUP_GEMINI,
        CHAT_MODEL_GROUP_CLAUDE,
        CHAT_MODEL_GROUP_KIMI
      ]
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
    // Sync the route-derived modelGroup into the store on first mount.
    // `chat.modelGroup` is intentionally not persisted (see persist.ts);
    // the route is the source of truth and the store mirror only exists
    // so other components can subscribe via `state.chat.modelGroup`.
    //
    // We also reconcile `chat.model` (which IS persisted): if the
    // remembered model belongs to a different group than the route, fall
    // back to the new group's first model. Otherwise leave the user's
    // selection alone \u2014 a refresh shouldn't snap them from gpt-5-mini
    // back to gpt-5.
    const route = this.modelGroup;
    if (this.$store.state.chat?.modelGroup?.name !== route.name) {
      this.$store.dispatch('chat/setModelGroup', route);
    }
    const persistedModel = this.$store.state.chat?.model;
    if (!route.models.some((m) => m.name === persistedModel?.name)) {
      this.$store.dispatch('chat/setModel', route.models[0]);
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
}

.trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 10px;
  transition: background-color 0.15s ease;
  outline: none;
  box-shadow: none;

  &:hover {
    background-color: var(--el-fill-color-light);
  }

  &:active {
    background-color: var(--el-fill-color);
  }
}

.trigger-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid var(--el-border-color);
  object-fit: cover;
  flex-shrink: 0;
}

.trigger-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.trigger-arrow {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  transition: transform 0.2s ease;
}

.item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
  width: 100%;
}

.item-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid var(--el-border-color);
  object-fit: cover;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;

  .item-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0;
    line-height: 1.4;
  }

  .item-desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin: 0;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.item-check {
  font-size: 12px;
  color: var(--el-color-primary);
  flex-shrink: 0;
  margin-left: auto;
}
</style>

<style lang="scss">
.model-selector-popper {
  .el-dropdown-menu__item {
    padding: 6px 14px;
    min-width: 240px;

    &.active {
      background-color: var(--el-color-primary-light-9);
    }
  }
}

.selector .el-dropdown {
  outline: none !important;
  border: none !important;
  box-shadow: none !important;

  &:focus-visible,
  &:focus {
    outline: none !important;
    border: none !important;
    box-shadow: none !important;
  }
}
</style>
