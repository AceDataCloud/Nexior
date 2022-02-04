<template>
  <el-pagination
    class="mt-3 mb-3"
    background
    @currentChange="onPageChange"
    layout="prev, pager, next"
    :current-page="currentPage"
    :total="total"
    :page-size="pageSize"
  >
  </el-pagination>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

interface IData {
  loaded: boolean;
}

export default defineComponent({
  name: 'Pagination',
  props: {
    total: {
      type: Number
    },
    currentPage: {
      type: Number
    },
    pageSize: {
      type: Number
    }
  },
  data(): IData {
    return {
      loaded: false
    };
  },
  mounted() {
    setTimeout(() => {
      // use this flag to fix the bug of el-paginition,
      // always emit page 1 when load first time.
      this.loaded = true;
    }, 1000);
  },
  methods: {
    onPageChange(val: number, oldVal: number): void {
      // if not finshed loading, ignore the wrong emit event
      if (!this.loaded) {
        return;
      }
      this.$emit('change', val);
    }
  }
});
</script>

<style lang="scss">
.el-pagination {
  button {
    border-radius: 50% !important;
  }
  li {
    border-radius: 50% !important;
    outline: none !important;
  }
}
</style>
