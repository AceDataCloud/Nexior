<template>
  <div class="field">
    <el-button type="primary" class="btn w-full" round @click="onGenerate">
      <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
      {{ $t('qrart.button.generate') }}
    </el-button>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export const DEFAULT_PROMPT = '';

export default defineComponent({
  name: 'GenerateButton',
  components: {
    ElButton,
    FontAwesomeIcon
  },
  emits: ['generate'],
  data() {
    return {
      operating: false
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.qrart?.config?.prompt;
      },
      set(val) {
        console.debug('set prompt', val);
        this.$store.commit('qrart/setConfig', {
          ...this.$store.state.qrart?.config,
          prompt: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = DEFAULT_PROMPT;
    }
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
.field {
  .title-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    .title {
      font-size: 14px;
      margin-bottom: 10px;
    }
    .right-aligned-switch {
      float: left;
    }
  }
}
</style>
