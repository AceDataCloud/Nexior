<template>
  <div>
    <el-dialog v-model="visible" center width="80%">
      <el-table :data="data" stripe :span-method="spanMethod" :header-cell-style="cellStyle" :cell-style="cellStyle">
        <el-table-column
          v-for="(column, columnIndex) in columns"
          :key="columnIndex"
          :prop="column.key"
          :label="column.label"
        />
      </el-table>
    </el-dialog>
    <el-button round size="small" @click="visible = true">
      {{ $t('service.button.pricing') }}
    </el-button>
  </div>
</template>

<script lang="ts">
import { IApiPrice } from '@/models';
import { defineComponent } from 'vue';
import { ElTable, ElTableColumn, ElDialog, ElButton } from 'element-plus';
import type { CellStyle, TableColumnCtx } from 'element-plus';

interface SpanMethodProps {
  row: IApiPrice;
  column: TableColumnCtx<IApiPrice>;
  rowIndex: number;
  columnIndex: number;
}

export default defineComponent({
  name: 'ApiPrice',
  components: {
    ElTable,
    ElTableColumn,
    ElDialog,
    ElButton
  },
  props: {
    price: {
      type: Object as () => IApiPrice | undefined,
      required: true
    }
  },
  data() {
    return {
      visible: false
    };
  },
  computed: {
    data() {
      return this.price?.data || [];
    },
    columns() {
      return this.price?.columns;
    },
    spans() {
      return this.price?.spans;
    }
  },
  methods: {
    // @ts-ignore
    cellStyle(): CellStyle {
      return {
        'font-weight': 'bold',
        'text-align': 'center'
      };
    },
    spanMethod({ row, column, rowIndex, columnIndex }: SpanMethodProps) {
      if (this.spans) {
        for (const span of this.spans) {
          if (rowIndex === span[0] && columnIndex === span[1]) {
            return [span[2], span[3]];
          }
        }
      }
      return [1, 1];
    }
  }
});
</script>

<style lang="scss" scoped>
.table {
  width: 80%;
  max-width: 1200px;
}
</style>
