<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('nanobanana.name.aspectRatio') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('nanobanana.placeholder.select')">
      <el-option v-for="opt in options" :key="opt" :label="opt" :value="opt" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { NANOBANANA_DEFAULT_ASPECT_RATIO } from '@/constants';

export default defineComponent({
  name: 'AspectRatioSelector',
  components: { ElSelect, ElOption },
  data() {
    return {
      options: ['1:1', '3:2', '2:3', '16:9', '9:16', '4:3', '3:4']
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.nanobanana?.config?.aspect_ratio;
      },
      set(val: string) {
        console.debug('set aspect_ratio', val);
        this.$store.commit('nanobanana/setConfig', {
          ...this.$store.state.nanobanana?.config,
          aspect_ratio: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = NANOBANANA_DEFAULT_ASPECT_RATIO;
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
