<template>
  <el-pagination
    class="mt-3 mb-3"
    background
    :hide-on-single-page="false"
    layout="prev, pager, next"
    :current-page="currentPage"
    :total="total"
    :page-size="pageSize"
    @current-change="onPageChange"
  >
  </el-pagination>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElPagination } from 'element-plus';

interface IData {
  loaded: boolean;
}

export default defineComponent({
  name: 'Pagination',
  components: {
    ElPagination
  },
  props: {
    total: {
      type: Number,
      required: false,
      default: undefined
    },
    currentPage: {
      type: Number,
      required: true
    },
    pageSize: {
      type: Number,
      required: true
    }
  },
  emits: ['change'],
  data(): IData {
    return {
      loaded: false
    };
  },
  mounted() {
    setTimeout(() => {
      // use this flag to fix the bug of el-pagination,
      // always emit page 1 when load first time.
      this.loaded = true;
    }, 1000);
  },
  methods: {
    onPageChange(val: number): void {
      // if not finished loading, ignore the wrong emit event
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
