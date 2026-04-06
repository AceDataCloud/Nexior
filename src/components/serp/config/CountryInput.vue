<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('serp.name.country') }}</h2>
    <el-input v-model="value" class="value" :placeholder="$t('serp.placeholder.country')" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput } from 'element-plus';

export default defineComponent({
  name: 'CountryInput',
  components: {
    ElInput
  },
  computed: {
    value: {
      get() {
        return this.$store.state.serp?.config?.country;
      },
      set(val: string) {
        this.$store.commit('serp/setConfig', {
          ...this.$store.state.serp?.config,
          country: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = 'US';
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
    width: 160px;
  }
}
</style>
