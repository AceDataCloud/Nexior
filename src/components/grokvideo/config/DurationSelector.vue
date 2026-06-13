<template>
  <div class="field">
    <div class="label">
      <div class="box">
        <h2 class="title font-bold">{{ $t('grokvideo.name.duration') }}</h2>
        <info-icon :content="$t('grokvideo.description.duration')" class="info" />
      </div>
    </div>
    <el-select v-model="value" class="value" :placeholder="$t('grokvideo.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { GROKVIDEO_DEFAULT_DURATION } from '@/constants';

export default defineComponent({
  name: 'GrokVideoDurationSelector',
  components: {
    ElSelect,
    ElOption,
    InfoIcon
  },
  data() {
    return {
      options: [
        { value: 3, label: '3s' },
        { value: 5, label: '5s' },
        { value: 6, label: '6s' },
        { value: 8, label: '8s' },
        { value: 10, label: '10s' },
        { value: 12, label: '12s' },
        { value: 15, label: '15s' }
      ]
    };
  },
  computed: {
    value: {
      get(): number | undefined {
        return this.$store.state.grokvideo?.config?.duration;
      },
      set(val: number) {
        this.$store.commit('grokvideo/setConfig', {
          ...this.$store.state.grokvideo?.config,
          duration: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = GROKVIDEO_DEFAULT_DURATION;
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

  .label {
    width: 30%;
    display: flex;
    align-items: center;

    .box {
      display: flex;
      flex-direction: row;
      align-items: center;

      .title {
        font-size: 14px;
        margin: 0;
      }

      .info {
        margin-left: 6px;
      }
    }
  }

  .value {
    width: 80px;
  }
}
</style>
