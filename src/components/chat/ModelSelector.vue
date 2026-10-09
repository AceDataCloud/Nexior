<template>
  <div class="selector">
    <el-dropdown trigger="click" popper-class="model-selector-popper">
      <div class="trigger">
        <img v-if="model && modelIcon(model)" :src="modelIcon(model)" class="trigger-icon" />
        <span class="trigger-name">{{ model ? modelDisplayName(model) : '' }}</span>
        <expand-down-icon class="trigger-arrow" :size="'1em' as any" aria-hidden="true" focusable="false" />
      </div>
      <template #dropdown>
        <el-dropdown-menu v-if="visibleModels.length">
          <el-dropdown-item
            v-for="option in visibleModels"
            :key="option.name"
            :class="{ active: model?.name === option?.name }"
            @click="onModelChange(option)"
          >
            <div class="item">
              <img v-if="modelIcon(option)" :src="modelIcon(option)" class="item-icon" />
              <div class="item-info">
                <p class="item-name">
                  {{ modelDisplayName(option) }}
                  <span v-if="option?.isFree" class="item-free-tag">{{ $t('chat.model.freeTag') }}</span>
                </p>
                <p v-if="option?.getDescription" class="item-desc">{{ option?.getDescription() }}</p>
              </div>
              <confirm-icon
                v-if="model?.name === option?.name"
                class="item-check"
                :size="'1em' as any"
                aria-hidden="true"
                focusable="false"
              />
            </div>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script lang="ts">
import { ConfirmIcon, ExpandDownIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElDropdown, ElDropdownItem, ElDropdownMenu } from 'element-plus';
import type { IChatModel, IChatModelGroup, ISite } from '@/models';
import { resolveModelDisplayName, resolveModelIcon, selectableChatModels } from '@/utils/modelPresentation';
import {
  CHAT_MODEL_GROUP_CHATGPT,
  CHAT_MODEL_GROUP_DEEPSEEK,
  CHAT_MODEL_GROUP_GROK,
  CHAT_MODEL_GROUP_GEMINI,
  CHAT_MODEL_GROUP_CLAUDE,
  CHAT_MODEL_GROUP_KIMI,
  getDefaultChatModel
} from '@/constants';

interface IData {
  options: IChatModelGroup[];
}

export default defineComponent({
  name: 'ModelSelector',
  components: {
    ConfirmIcon,
    ExpandDownIcon,
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem
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
      return this.$store.state.chat.model;
    },
    modelGroup(): IChatModelGroup {
      return (this.$route.meta?.modelGroup as IChatModelGroup) || CHAT_MODEL_GROUP_CHATGPT;
    },
    visibleModels(): IChatModel[] {
      return selectableChatModels(this.$store.getters?.site as ISite | undefined, this.modelGroup);
    }
  },
  watch: {
    // set first model when modelGroup changes
    modelGroup(newValue: IChatModelGroup) {
      console.debug('modelGroup from route changed', newValue);
      this.$store.dispatch('chat/setModelGroup', newValue);
      this.$store.dispatch('chat/setModel', this.preferredModel(newValue, this.model));
    },
    visibleModels(models: IChatModel[]) {
      // Restored conversations keep their original model, even if it is now hidden from new selections.
      if (this.$route.params?.id || models.some((model) => model.name === this.model?.name)) return;
      this.$store.dispatch('chat/setModel', this.preferredModel(this.modelGroup, this.model));
    },
    '$route.params.id'(id?: string) {
      if (!id && !this.visibleModels.some((model) => model.name === this.model?.name)) {
        this.$store.dispatch('chat/setModel', this.preferredModel(this.modelGroup, this.model));
      }
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
    // back to the new group's default model. Otherwise leave the user's
    // selection alone \u2014 a refresh shouldn't snap them from gpt-5-mini
    // back to gpt-5.
    const route = this.modelGroup;
    if (this.$store.state.chat?.modelGroup?.name !== route.name) {
      this.$store.dispatch('chat/setModelGroup', route);
    }
    const persistedModel = this.$store.state.chat?.model;
    this.$store.dispatch('chat/setModel', this.preferredModel(route, persistedModel));
  },
  methods: {
    preferredModel(group: IChatModelGroup, current?: IChatModel): IChatModel {
      const models = selectableChatModels(this.$store.getters?.site as ISite | undefined, group);
      const defaultName = getDefaultChatModel(group).name;
      return (
        models.find((model) => model.name === current?.name) ??
        models.find((model) => model.name === defaultName) ??
        models[0] ??
        getDefaultChatModel(group)
      );
    },
    modelDisplayName(model: IChatModel): string {
      return resolveModelDisplayName(this.$store.getters?.site as ISite | undefined, model);
    },
    modelIcon(model: IChatModel): string {
      return resolveModelIcon(this.$store.getters?.site as ISite | undefined, model);
    },
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
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .item-free-tag {
    display: inline-flex;
    align-items: center;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    line-height: 1.3;
    color: var(--el-color-success);
    background-color: var(--el-color-success-light-9);
    border: 1px solid var(--el-color-success-light-7);
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
