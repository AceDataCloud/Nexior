<template>
  <div class="field">
    <div class="label">
      <div class="box">
        <h2 class="title font-bold">{{ $t('seedream.name.size') }}</h2>
        <info-icon :content="$t('seedream.description.size')" class="info" />
      </div>
    </div>
    <el-select
      v-model="value"
      class="value"
      :placeholder="$t('seedream.placeholder.select')"
      filterable
      allow-create
      default-first-option
    >
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { SEEDREAM_DEFAULT_SIZE, SEEDREAM_SIZE_1K, SEEDREAM_SIZE_2K, SEEDREAM_SIZE_4K } from '@/constants';

export default defineComponent({
  name: 'SeedreamSizeSelector',
  components: {
    ElSelect,
    ElOption,
    InfoIcon
  },
  data() {
    return {
      options: [
        { value: SEEDREAM_SIZE_1K, label: SEEDREAM_SIZE_1K },
        { value: SEEDREAM_SIZE_2K, label: SEEDREAM_SIZE_2K },
        { value: SEEDREAM_SIZE_4K, label: SEEDREAM_SIZE_4K }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.seedream?.config?.size;
      },
      set(val: string) {
        this.$store.commit('seedream/setConfig', {
          ...this.$store.state.seedream?.config,
          size: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = SEEDREAM_DEFAULT_SIZE;
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

  .label {
    width: 30%;
    display: flex;
    align-items: center;

    .box {
      display: flex;
      flex-direction: row;
      align-items: center;

      .title {
        font-size: 14px;
        margin: 0;
      }

      .info {
        margin-left: 6px;
      }
    }
  }

  .value {
    width: 160px;
  }
}
</style>
