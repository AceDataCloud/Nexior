<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('wan.name.resolution') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('wan.placeholder.select')" clearable>
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
        <span class="float-left">{{ item.label }}</span>
      </el-option>
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';

const DEFAULT_RESOLUTION = '720p';

export default defineComponent({
  name: 'ResolutionSelector',
  components: {
    ElSelect,
    ElOption
  },
  computed: {
    options() {
      return [
        {
          value: '480p',
          label: this.$t('wan.name.resolution480p')
        },
        {
          value: '720p',
          label: this.$t('wan.name.resolution720p')
        },
        {
          value: '1080p',
          label: this.$t('wan.name.resolution1080p')
        }
      ];
    },
    value: {
      get() {
        return this.$store.state.wan?.config?.resolution;
      },
      set(val: string) {
        this.$store.commit('wan/setConfig', {
          ...this.$store.state.wan?.config,
          resolution: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = DEFAULT_RESOLUTION;
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: row;
  align-items: center;

  .title {
    font-size: 14px;
    margin: 0;
    width: 30%;
  }
  .value {
    flex: 1;
  }
}
</style>
