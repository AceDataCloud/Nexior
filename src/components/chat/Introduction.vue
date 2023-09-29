<template>
  <div class="introduction">
    <h2 class="title">ChatGPT</h2>
    <el-row class="introduction-items" justify="center" :gutter="15">
      <el-col :md="8" :sm="24" :xs="24">
        <div class="text-center">
          <font-awesome-icon icon="fa-regular fa-sun" class="icon icon-rotate" />
        </div>
        <h3 class="subtitle">{{ $t('conversation.title.example') }}</h3>
        <introduction-item
          :content="$t('conversation.message.writeCode')"
          class="cursor-pointer"
          @click="$emit('draft', $t('conversation.message.writeCode'))"
        />
        <introduction-item
          :content="$t('conversation.message.writeEmail')"
          class="cursor-pointer"
          @click="$emit('draft', $t('conversation.message.writeEmail'))"
        />
        <introduction-item
          :content="$t('conversation.message.explainDefinition')"
          class="cursor-pointer"
          @click="$emit('draft', $t('conversation.message.explainDefinition'))"
        />
      </el-col>
      <el-col :md="8" :sm="24" :xs="24">
        <div class="text-center">
          <font-awesome-icon icon="fa-solid fa-bolt" class="icon icon-rotate" />
        </div>
        <h3 class="subtitle">{{ $t('conversation.title.capabilities') }}</h3>
        <introduction-item :content="$t('conversation.message.rememberHistory')" />
        <introduction-item :content="$t('conversation.message.supportStream')" />
        <introduction-item :content="$t('conversation.message.rejectInvalidPrompt')" />
      </el-col>
      <el-col :md="8" :sm="24" :xs="24">
        <div class="text-center">
          <font-awesome-icon icon="fa-solid fa-triangle-exclamation" class="icon icon-rotate" />
        </div>
        <h3 class="subtitle">{{ $t('conversation.title.limitations') }}</h3>
        <introduction-item :content="$t('conversation.message.generateInCorrect')" />
        <introduction-item :content="$t('conversation.message.generateHarmfulInfo')" />
        <introduction-item :content="$t('conversation.message.onlyKnowBefore2021')" />
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import IntroductionItem from './IntroductionItem.vue';
import { ElRow, ElCol } from 'element-plus';
export default defineComponent({
  name: 'ConversationIntroduction',
  components: {
    FontAwesomeIcon,
    IntroductionItem,
    ElRow,
    ElCol
  },
  emits: ['draft'],
  data() {
    return {};
  },
  computed: {}
});
</script>

<style lang="scss" scoped>
.introduction {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  .title {
    height: 70px;
    text-align: center;
    display: block;
    font-size: 36px;
    font-weight: 600;
    margin-bottom: 50px;
  }

  .introduction-items {
    height: fit-content;
    margin-bottom: 100px;
    .icon {
      font-size: 20px;
      margin-bottom: 10px;
    }
    .subtitle {
      text-align: center;
      font-size: 18px;
      margin-bottom: 20px;
    }
    .introduction-item {
      margin-bottom: 15px;
    }
  }
}

@media (max-width: 767px) {
  .introduction {
    width: 90%;
    left: 5%;
    transform: translateY(-50%);
  }
}
</style>
