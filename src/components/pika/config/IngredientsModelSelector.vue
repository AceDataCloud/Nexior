<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('pika.name.ingredientsModel') }}</h2>
    <el-radio-group v-model="value" size="small" class="quality">
      <el-radio-button v-for="item in options" :key="item.value" :label="item.value">
        {{ item.label }}
      </el-radio-button>
    </el-radio-group>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElRadioButton, ElRadioGroup } from 'element-plus';
import { PIKA_DEFAULT_INGREDIENTS_MODEL } from '@/constants';

export default defineComponent({
  name: 'IngredientsModelSelector',
  components: {
    ElRadioButton,
    ElRadioGroup
  },
  data() {
    return {
      options: [
        {
          label: this.$t('pika.button.precise'),
          value: 'precise'
        },
        {
          label: this.$t('pika.button.creative'),
          value: 'creative'
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.pika?.config?.ingredients_mode;
      },
      set(val) {
        this.$store.commit('pika/setConfig', {
          ...this.$store.state.pika?.config,
          ingredients_mode: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = PIKA_DEFAULT_INGREDIENTS_MODEL;
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  .title {
    font-size: 14px;
    margin: 0;
    width: 30%;
  }
  .value {
    flex: 1;
  }
}
</style>

<style lang="scss">
.quality {
  .el-radio-button--small .el-radio-button__inner {
    padding: 8px 11px;
  }
}
</style>
