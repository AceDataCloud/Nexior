<template>
  <div>
    <el-card v-show="operating">
      <content-input class="mb-4" />
      <prompt-input class="mb-4" />
      <preset-selector class="mb-4" />
      <div class="actions">
        <el-button type="primary" class="btn w-full" round @click="onGenerate">
          <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
          {{ $t('qrart.button.generate') }}
        </el-button>
      </div>
    </el-card>
    <div>
      <el-button type="primary" class="btn btn-operate" @click="operating = !operating">+</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElCard } from 'element-plus';
import PresetSelector from './config/PresetSelector2.vue';
import ContentInput from './config/ContentInput.vue';
import PromptInput from './config/PromptInput.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'OperationPanel',
  components: {
    ElButton,
    ElCard,
    PresetSelector,
    ContentInput,
    PromptInput,
    FontAwesomeIcon
  },
  emits: ['generate'],
  data() {
    return {
      operating: false
    };
  },
  methods: {
    onGenerate() {
      this.$emit('generate');
      this.operating = false;
    }
  }
});
</script>

<style lang="scss" scoped>
.el-card {
  width: 580px;
  height: fit-content;
  overflow-y: scroll;
  position: absolute;
  bottom: 70px;
  left: calc(50% - 300px);
  @media (max-width: 767px) {
    width: 100%;
    left: 0;
  }
}

.btn-operate {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  font-size: 24px;
  line-height: 40px;
  padding: 0;
  margin: auto;
  display: block;
}
</style>
