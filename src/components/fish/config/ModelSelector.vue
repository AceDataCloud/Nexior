<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('fish.name.model') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('fish.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { FISH_DEFAULT_TTS_MODEL, FISH_TTS_MODEL_S1, FISH_TTS_MODEL_S2_PRO } from '@/constants';
import { IFishTtsModel } from '@/models';

export default defineComponent({
  name: 'FishModelSelector',
  components: {
    ElSelect,
    ElOption
  },
  computed: {
    options() {
      return [
        { value: FISH_TTS_MODEL_S2_PRO, label: this.$t('fish.button.modelS2Pro') },
        { value: FISH_TTS_MODEL_S1, label: this.$t('fish.button.modelS1') }
      ];
    },
    value: {
      get(): IFishTtsModel | undefined {
        return this.$store.state.fish?.config?.model;
      },
      set(val: IFishTtsModel) {
        this.$store.commit('fish/setConfig', {
          ...this.$store.state.fish?.config,
          model: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = FISH_DEFAULT_TTS_MODEL as IFishTtsModel;
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
  }
}
</style>
