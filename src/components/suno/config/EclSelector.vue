<template>
  <div class="field">
    <h2 class="title">{{ $t('suno.name.ecl') }}</h2>
    <el-select v-model="value" clearable class="value" :placeholder="$t('suno.placeholder.ecl')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script>
import { SUNO_DEFAULT_ECL } from '@/constants';
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';

export default defineComponent({
  name: 'EclSelector',
  components: {
    ElSelect,
    ElOption
  },
  data() {
    return {
      options: [
        {
          value: 'L',
          label: 'L'
        },
        {
          value: 'M',
          label: 'M'
        },
        {
          value: 'Q',
          label: 'Q'
        },
        {
          value: 'H',
          label: 'H'
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.suno?.config?.ecl;
      },
      set(val) {
        console.debug('set ecl', val);
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          ecl: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = SUNO_DEFAULT_ECL;
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
