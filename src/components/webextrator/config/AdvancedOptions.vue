<template>
  <el-collapse v-model="active" class="advanced">
    <el-collapse-item :title="$t('webextrator.name.advanced')" name="advanced">
      <div class="field">
        <h2 class="sub-title">{{ $t('webextrator.name.waitUntil') }}</h2>
        <el-select v-model="waitUntil" class="value">
          <el-option value="networkidle" :label="$t('webextrator.waitUntil.networkidle')" />
          <el-option value="load" :label="$t('webextrator.waitUntil.load')" />
          <el-option value="domcontentloaded" :label="$t('webextrator.waitUntil.domcontentloaded')" />
          <el-option value="commit" :label="$t('webextrator.waitUntil.commit')" />
        </el-select>
      </div>
      <div class="field">
        <h2 class="sub-title">{{ $t('webextrator.name.waitForSelector') }}</h2>
        <el-input v-model="waitForSelector" :placeholder="$t('webextrator.placeholder.waitForSelector')" />
      </div>
      <div class="field">
        <h2 class="sub-title">{{ $t('webextrator.name.timeout') }}</h2>
        <el-input-number v-model="timeout" :min="1" :max="120" :step="5" controls-position="right" class="w-full" />
      </div>
      <div class="field">
        <h2 class="sub-title">{{ $t('webextrator.name.delay') }}</h2>
        <el-input-number v-model="delay" :min="0" :max="30" :step="1" controls-position="right" class="w-full" />
      </div>
      <div class="field">
        <h2 class="sub-title">{{ $t('webextrator.name.blockResources') }}</h2>
        <el-select
          v-model="blockResources"
          multiple
          collapse-tags
          :placeholder="$t('webextrator.placeholder.blockResources')"
          class="w-full"
        >
          <el-option
            v-for="kind in resourceKinds"
            :key="kind"
            :label="$t(`webextrator.blockResource.${kind}`)"
            :value="kind"
          />
        </el-select>
      </div>
    </el-collapse-item>
  </el-collapse>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElCollapse, ElCollapseItem, ElInput, ElInputNumber, ElSelect, ElOption } from 'element-plus';
import { IWebextratorBlockResource, IWebextratorWaitUntil } from '@/models';

const RESOURCE_KINDS: IWebextratorBlockResource[] = ['image', 'font', 'media', 'stylesheet', 'xhr', 'fetch'];

export default defineComponent({
  name: 'AdvancedOptions',
  components: {
    ElCollapse,
    ElCollapseItem,
    ElInput,
    ElInputNumber,
    ElSelect,
    ElOption
  },
  data() {
    return {
      // Collapse opens whenever any of its child fields is non-default;
      // we keep it open by default since the panel is short and discovery matters.
      active: [] as string[]
    };
  },
  computed: {
    resourceKinds() {
      return RESOURCE_KINDS;
    },
    waitUntil: {
      get(): IWebextratorWaitUntil {
        return this.$store.state.webextrator?.config?.wait_until || 'networkidle';
      },
      set(val: IWebextratorWaitUntil) {
        this.commit({ wait_until: val });
      }
    },
    waitForSelector: {
      get(): string {
        return this.$store.state.webextrator?.config?.wait_for_selector || '';
      },
      set(val: string) {
        this.commit({ wait_for_selector: val });
      }
    },
    timeout: {
      get(): number {
        return this.$store.state.webextrator?.config?.timeout ?? 30;
      },
      set(val: number) {
        this.commit({ timeout: val });
      }
    },
    delay: {
      get(): number {
        return this.$store.state.webextrator?.config?.delay ?? 0;
      },
      set(val: number) {
        this.commit({ delay: val });
      }
    },
    blockResources: {
      get(): IWebextratorBlockResource[] {
        return this.$store.state.webextrator?.config?.block_resources || [];
      },
      set(val: IWebextratorBlockResource[]) {
        this.commit({ block_resources: val });
      }
    }
  },
  methods: {
    commit(patch: Record<string, unknown>) {
      this.$store.commit('webextrator/setConfig', {
        ...this.$store.state.webextrator?.config,
        ...patch
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.advanced {
  border: none;
  background: transparent;
  :deep(.el-collapse-item__header) {
    background: transparent;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-regular);
    border-bottom: none;
  }
  :deep(.el-collapse-item__wrap) {
    background: transparent;
    border-bottom: none;
  }
  :deep(.el-collapse-item__content) {
    padding-bottom: 8px;
  }
  .field {
    margin-bottom: 12px;
    .sub-title {
      font-size: 12px;
      font-weight: 500;
      color: var(--el-text-color-regular);
      margin: 0 0 6px 0;
    }
    .value {
      width: 100%;
    }
  }
}
</style>
