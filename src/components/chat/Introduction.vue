<template>
  <div class="introduction">
    <el-row class="items" justify="center" :gutter="15">
      <el-col v-for="(item, itemKey) in items" :key="itemKey" :md="6" :sm="12" :xs="12">
        <introduction-item
          :content="item.content"
          :icon="item.icon"
          :color="item.color"
          class="cursor-pointer"
          @click="$emit('draft', item.content)"
        />
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import IntroductionItem from './IntroductionItem.vue';
import { ElRow, ElCol } from 'element-plus';

export default defineComponent({
  name: 'ConversationIntroduction',
  components: {
    IntroductionItem,
    ElRow,
    ElCol
  },
  emits: ['draft'],
  data() {
    return {
      items: [
        {
          icon: 'fa-solid fa-pen-nib',
          content: this.$t('chat.message.question1'),
          color: 'rgb(226, 197, 65)'
        },
        {
          icon: 'fa-solid fa-laptop-code',
          content: this.$t('chat.message.question2'),
          color: 'rgb(203, 139, 208)'
        },
        {
          icon: 'fa-solid fa-fan',
          content: this.$t('chat.message.question3'),
          color: 'rgb(118, 208, 235)'
        },
        {
          icon: 'fa-solid fa-plane-departure',
          content: this.$t('chat.message.question4'),
          color: 'rgb(237, 98, 98)'
        }
      ].sort(() => Math.random() - 0.5)
    };
  },
  computed: {}
});
</script>

<style lang="scss" scoped>
.introduction {
  width: 100%;
  height: 100%;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;

  .items {
    max-width: 800px;
    width: 100%;
    margin: auto;
  }
}

@media (max-width: 767px) {
  .introduction {
    position: relative;
    top: initial;
    left: initial;
    transform: initial;
    width: 90%;
    margin: auto;
  }
}
</style>
