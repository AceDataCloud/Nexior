<template>
  <div class="suggestion">
    <el-row class="items" justify="center" :gutter="15">
      <el-col v-for="(item, itemKey) in items" :key="itemKey" :md="8" :sm="12" :xs="12">
        <suggestion-item
          :content="item.content"
          :icon-component="item.icon"
          :color="item.color"
          class="cursor-pointer"
          @click="$emit('draft', item.content)"
        />
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import {
  DeveloperIcon,
  EditIcon,
  FastIcon,
  GenerateIcon,
  GrowthIcon,
  LaunchIcon,
  LoadingIcon,
  RewardIcon
} from '@acedatacloud/core/icons/components';
import { defineComponent, markRaw } from 'vue';
import SuggestionItem from './SuggestionItem.vue';
import { ElRow, ElCol } from 'element-plus';

export default defineComponent({
  name: 'Suggestion',
  components: {
    SuggestionItem,
    ElRow,
    ElCol
  },
  emits: ['draft'],
  data() {
    return {
      items: [
        {
          icon: markRaw(EditIcon),
          content: this.$t('chat.message.question1'),
          color: 'rgb(226, 197, 65)'
        },
        {
          icon: markRaw(DeveloperIcon),
          content: this.$t('chat.message.question2'),
          color: 'rgb(203, 139, 208)'
        },
        {
          icon: markRaw(LoadingIcon),
          content: this.$t('chat.message.question3'),
          color: 'rgb(118, 208, 235)'
        },
        {
          icon: markRaw(LaunchIcon),
          content: this.$t('chat.message.question4'),
          color: 'rgb(237, 98, 98)'
        },
        {
          icon: markRaw(FastIcon),
          content: this.$t('chat.message.question5'),
          color: 'rgb(203, 139, 208)'
        },
        {
          icon: markRaw(RewardIcon),
          content: this.$t('chat.message.question6'),
          color: 'rgb(118, 208, 235)'
        },
        {
          icon: markRaw(GrowthIcon),
          content: this.$t('chat.message.question7'),
          color: 'rgb(226, 197, 65)'
        },
        {
          icon: markRaw(GenerateIcon),
          content: this.$t('chat.message.question8'),
          color: 'rgb(237, 98, 98)'
        }
      ]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
    };
  },
  computed: {}
});
</script>

<style lang="scss" scoped>
.suggestion {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 150px;
  width: 100%;

  .items {
    max-width: 800px;
    width: 100%;
    margin: auto;
  }
}
</style>
