<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('pika.name.ingredients') }}</h2>
    <el-switch v-model="value" class="value" />
    <info-icon :content="$t('pika.description.ingredients')" class="info" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSwitch } from 'element-plus';
import { PIKA_DEFAULT_INGREDIENTS } from '@/constants';
import InfoIcon from '@/components/common/InfoIcon.vue';
export default defineComponent({
  name: 'IngredientsSelector',
  components: {
    ElSwitch,
    InfoIcon
  },
  computed: {
    value: {
      get() {
        return this.$store.state.pika?.config?.ingredients;
      },
      set(val) {
        console.debug('set ingredients', val);
        if (!val) {
          this.$store.commit('pika/setConfig', {
            ...this.$store.state.pika?.config,
            ingredients: val,
            ingredients_mode: undefined,
            image_url: undefined
          });
        }
        this.$store.commit('pika/setConfig', {
          ...this.$store.state.pika?.config,
          ingredients: val,
          model: '2.0'
        });
      }
    }
  },
  mounted() {
    if (this.value === undefined) {
      this.value = PIKA_DEFAULT_INGREDIENTS;
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: row;
  align-items: center;

  .title {
    font-size: 14px;
    margin: 0;
    width: 30%;
  }
  .value {
    flex: 1;
    margin-left: 60px; // Adjust this value as needed
  }
}
</style>
