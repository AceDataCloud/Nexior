<template>
  <div class="field">
    <div class="box">
      <h2 class="title font-bold">{{ $t('serp.name.query') }}</h2>
    </div>
    <el-input v-model="query" :rows="3" type="textarea" class="prompt" :placeholder="$t('serp.placeholder.query')" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput } from 'element-plus';

export default defineComponent({
  name: 'QueryInput',
  components: {
    ElInput
  },
  computed: {
    query: {
      get() {
        return this.$store.state.serp?.config?.query;
      },
      set(val: string) {
        this.$store.commit('serp/setConfig', {
          ...this.$store.state.serp?.config,
          query: val
        });
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  .box {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    position: relative;
    .title {
      font-size: 14px;
      margin-bottom: 10px;
    }
  }
  .prompt {
    resize: none;
  }
}
</style>
