<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('webextrator.name.expectedType') }}</h2>
    <el-select v-model="value" class="value">
      <el-option value="general" :label="$t('webextrator.expectedType.general')" />
      <el-option value="article" :label="$t('webextrator.expectedType.article')" />
      <el-option value="product" :label="$t('webextrator.expectedType.product')" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { IWebextratorExpectedType } from '@/models';

export default defineComponent({
  name: 'ExpectedTypeSelector',
  components: {
    ElSelect,
    ElOption
  },
  computed: {
    value: {
      get(): IWebextratorExpectedType | undefined {
        return this.$store.state.webextrator?.config?.expected_type;
      },
      set(val: IWebextratorExpectedType) {
        this.$store.commit('webextrator/setConfig', {
          ...this.$store.state.webextrator?.config,
          expected_type: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = 'general';
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
    width: 40%;
  }
  .value {
    flex: 1;
  }
}
</style>
