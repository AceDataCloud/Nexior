<template>
  <div class="resolution">
    <div class="header">
      <h2 class="title font-bold">{{ $t('seedance.name.resolution') }}</h2>
      <info-icon :content="$t('seedance.description.resolution')" class="info" />
    </div>
    <div class="items">
      <el-tooltip
        v-for="item in options"
        :key="item.value"
        :content="$t('seedance.message.resolutionNotSupported')"
        :disabled="!item.disabled"
        placement="top"
      >
        <div class="item" :class="{ active: value === item.value, disabled: item.disabled }" @click="onSelect(item)">
          {{ item.label }}
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElTooltip } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import {
  getSeedanceCapability,
  SEEDANCE_DEFAULT_RESOLUTION,
  SEEDANCE_RESOLUTION_480P,
  SEEDANCE_RESOLUTION_720P,
  SEEDANCE_RESOLUTION_1080P,
  SEEDANCE_RESOLUTION_4K
} from '@/constants';

interface ResolutionOption {
  value: string;
  label: string;
  disabled: boolean;
}

// Each model exposes a max resolution via its capability entry: lite / 2.0-fast
// / 2.0-mini top out at 720p, std models at 1080p, only the full 2.0 reaches 4k.
const RESOLUTION_RANK: Record<string, number> = {
  [SEEDANCE_RESOLUTION_480P]: 0,
  [SEEDANCE_RESOLUTION_720P]: 1,
  [SEEDANCE_RESOLUTION_1080P]: 2,
  [SEEDANCE_RESOLUTION_4K]: 3
};

export default defineComponent({
  name: 'SeedanceResolutionSelector',
  components: {
    InfoIcon,
    ElTooltip
  },
  computed: {
    model(): string | undefined {
      return this.$store.state.seedance?.config?.model;
    },
    capability() {
      return getSeedanceCapability(this.model);
    },
    options(): ResolutionOption[] {
      const base = [
        { value: SEEDANCE_RESOLUTION_480P, label: '480p' },
        { value: SEEDANCE_RESOLUTION_720P, label: '720p' },
        { value: SEEDANCE_RESOLUTION_1080P, label: '1080p' },
        { value: SEEDANCE_RESOLUTION_4K, label: '4k' }
      ];
      const maxRank = RESOLUTION_RANK[this.capability.maxResolution] ?? RESOLUTION_RANK[SEEDANCE_RESOLUTION_1080P];
      return base.map((o) => ({
        ...o,
        disabled: RESOLUTION_RANK[o.value] > maxRank
      }));
    },
    value: {
      get(): string | undefined {
        return this.$store.state.seedance?.config?.resolution;
      },
      set(val: string) {
        this.$store.commit('seedance/setConfig', {
          ...this.$store.state.seedance?.config,
          resolution: val
        });
      }
    }
  },
  watch: {
    model() {
      this.clampValue();
    }
  },
  mounted() {
    if (!this.value) {
      this.value = this.capability.defaultResolution || SEEDANCE_DEFAULT_RESOLUTION;
    } else {
      this.clampValue();
    }
  },
  methods: {
    onSelect(item: ResolutionOption) {
      if (item.disabled) return;
      this.value = item.value;
    },
    clampValue() {
      const current = this.value;
      const selected = this.options.find((o) => o.value === current);
      if (!current || (selected && selected.disabled)) {
        this.value = this.capability.defaultResolution || SEEDANCE_DEFAULT_RESOLUTION;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.resolution {
  .header {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 10px;

    .title {
      font-size: 14px;
      margin: 0;
    }

    .info {
      margin-left: 6px;
    }
  }

  .items {
    display: flex;
    flex-direction: row;
    gap: 8px;

    .item {
      flex: 1;
      text-align: center;
      padding: 8px 0;
      font-size: 13px;
      color: var(--el-text-color-regular);
      border: 1px solid var(--el-border-color);
      border-radius: 8px;
      cursor: pointer;
      transition:
        background-color 0.15s ease,
        border-color 0.15s ease,
        color 0.15s ease;
      background-color: var(--el-fill-color-lighter);

      &:hover {
        background-color: var(--el-fill-color);
        border-color: var(--el-border-color-hover);
      }

      &.disabled {
        opacity: 0.45;
        cursor: not-allowed;

        &:hover {
          background-color: var(--el-fill-color-lighter);
          border-color: var(--el-border-color);
        }
      }

      &.active {
        color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);
        border-color: var(--el-color-primary);
        font-weight: 600;
      }
    }
  }
}
</style>
