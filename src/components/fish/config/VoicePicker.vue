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
      <el-option v-for="item in displayOptions" :key="item.value" :label="item.label" :value="item.value" />
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
    displayOptions(): { value: string; label: string }[] {
      // Fish-audio's `/fish/model` response surfaces the canonical reference id
      // under one of three keys depending on which shape the platform proxy
      // forwards: `id`, `_id` (Mongo), or `reference_id`. Resolve them in that
      // order so each voice always has a non-empty `:value` — otherwise the
      // <el-option> renders with `value=""` and el-select treats it as the
      // "clear" sentinel, which surfaces as the dropdown showing
      // 'No voice models yet' even when voices state has items.
      return this.options
        .map((item) => {
          const m = item as IFishVoiceModel & { _id?: string };
          const id = (m.id || m._id || m.reference_id || '').toString();
          return { value: id, label: m.title || id };
        })
        .filter((o) => !!o.value);
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
        // Refetch when credential becomes available AND we either don't have a
        // voices snapshot yet OR the snapshot is empty. The latter handles the
        // case where the user created their first voice on /fish/model: by the
        // time they hop back to /fish/tts the cached `voices` may have been an
        // empty array, which used to lock the picker into "No voice models
        // yet" indefinitely.
        if (!val?.token) return;
        const voices = this.$store.state.fish?.voices;
        if (voices === undefined || voices.length === 0) {
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
