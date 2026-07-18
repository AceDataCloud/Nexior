<template>
  <div class="field">
    <div class="label">
      <h2 class="title font-bold">{{ $t('pika.name.ingredients') }}</h2>
      <info-icon :content="$t('pika.description.ingredients')" class="info" />
    </div>
    <el-switch v-model="value" class="value" />
  </div>
</template>

<script lang="ts">
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
      set(val: boolean) {
        if (!val) {
          this.$store.commit('pika/setConfig', {
            ...this.$store.state.pika?.config,
            ingredients: val,
            ingredients_mode: undefined,
            image_url: undefined
          });
          return;
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
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;

  .label {
    display: flex;
    gap: 6px;
    align-items: center;
    min-width: 0;
  }

  .title {
    min-width: 0;
    margin: 0;
    font-size: 14px;
  }
}
</style>
