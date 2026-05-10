<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('fish.name.voice') }}</h2>
    <el-select
      v-model="value"
      class="value"
      :placeholder="$t('fish.placeholder.voice')"
      clearable
      filterable
      :loading="loading"
      :no-data-text="$t('fish.message.noVoices')"
    >
      <el-option v-for="item in options" :key="item.id" :label="item.title || item.id" :value="item.id || ''" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { IFishVoiceModel, Status } from '@/models';

export default defineComponent({
  name: 'FishVoicePicker',
  components: {
    ElSelect,
    ElOption
  },
  computed: {
    loading(): boolean {
      return this.$store.state.fish?.status?.getApplications === Status.Request;
    },
    options(): IFishVoiceModel[] {
      return this.$store.state.fish?.voices ?? [];
    },
    initialized(): boolean {
      return this.$store.state.fish?.voices !== undefined;
    },
    credential() {
      return this.$store.state.fish?.credential;
    },
    value: {
      get(): string | undefined {
        return this.$store.state.fish?.config?.reference_id;
      },
      set(val: string | undefined) {
        this.$store.commit('fish/setConfig', {
          ...this.$store.state.fish?.config,
          reference_id: val || undefined
        });
      }
    }
  },
  watch: {
    credential: {
      immediate: true,
      handler(val) {
        if (val?.token && !this.initialized) {
          this.$store.dispatch('fish/getVoices');
        }
      }
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
