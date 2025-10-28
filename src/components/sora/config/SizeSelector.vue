<template>
  <div class="field">
    <div class="control">
      <h2 class="title font-bold">{{ $t('sora.name.size') }}</h2>
      <el-select v-model="value" class="value" :placeholder="$t('sora.placeholder.select')">
        <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { SORA_ALLOWED_SIZES, SORA_DEFAULT_SIZE } from '@/constants';

const formatSizeLabel = (value: string): string => {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export default defineComponent({
  name: 'SizeSelector',
  components: {
    ElSelect,
    ElOption
  },
  data() {
    return {
      options: SORA_ALLOWED_SIZES.map((size) => ({
        value: size,
        label: formatSizeLabel(size)
      }))
    };
  },
  computed: {
    value: {
      get(): string | undefined {
        return this.$store.state.sora?.config?.size;
      },
      set(val: string | undefined) {
        const currentConfig = this.$store.state.sora?.config || {};
        this.$store.commit('sora/setConfig', {
          ...currentConfig,
          size: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = SORA_DEFAULT_SIZE;
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: column;
}

.control {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 14px;
  margin: 0;
  width: 30%;
}

.value {
  width: 120px;
}
</style>
