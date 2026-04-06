<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('serp.name.type') }}</h2>
    <el-select v-model="value" class="value">
      <el-option value="search" :label="$t('serp.type.search')" />
      <el-option value="images" :label="$t('serp.type.images')" />
      <el-option value="news" :label="$t('serp.type.news')" />
      <el-option value="videos" :label="$t('serp.type.videos')" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';

export default defineComponent({
  name: 'TypeSelector',
  components: {
    ElSelect,
    ElOption
  },
  computed: {
    value: {
      get() {
        return this.$store.state.serp?.config?.type;
      },
      set(val: string) {
        this.$store.commit('serp/setConfig', {
          ...this.$store.state.serp?.config,
          type: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = 'search';
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
