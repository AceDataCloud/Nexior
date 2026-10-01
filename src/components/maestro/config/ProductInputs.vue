<template>
  <div class="mb-5 space-y-3">
    <label class="block">
      <span class="block font-bold mb-2">{{ $t('maestro.name.websiteUrl') }}</span>
      <el-input
        :model-value="config.website_url || ''"
        type="url"
        :placeholder="$t('maestro.placeholder.websiteUrl')"
        clearable
        @update:model-value="setWebsite"
      />
    </label>
    <details>
      <summary class="cursor-pointer font-bold">{{ $t('maestro.name.brandSettings') }}</summary>
      <div class="space-y-3 mt-3">
        <label class="block">
          <span class="block mb-1">{{ $t('maestro.name.brandName') }}</span>
          <el-input
            :model-value="config.brand?.name || ''"
            maxlength="100"
            clearable
            @update:model-value="setBrand('name', $event)"
          />
        </label>
        <label class="block">
          <span class="block mb-1">{{ $t('maestro.name.brandAccent') }}</span>
          <el-color-picker :model-value="config.brand?.colors?.accent" @update:model-value="setAccent" />
        </label>
        <label class="block">
          <span class="block mb-1">{{ $t('maestro.name.ctaText') }}</span>
          <el-input
            :model-value="config.brand?.cta?.text || ''"
            maxlength="100"
            clearable
            @update:model-value="setCta('text', $event)"
          />
        </label>
        <label class="block">
          <span class="block mb-1">{{ $t('maestro.name.ctaUrl') }}</span>
          <el-input
            :model-value="config.brand?.cta?.url || ''"
            type="url"
            clearable
            @update:model-value="setCta('url', $event)"
          />
        </label>
      </div>
    </details>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElColorPicker, ElInput } from 'element-plus';
import type { IMaestroBrand, IMaestroConfig } from '@/models';

export default defineComponent({
  name: 'MaestroProductInputs',
  components: { ElInput, ElColorPicker },
  computed: {
    config(): IMaestroConfig {
      return this.$store.state.maestro?.config || {};
    }
  },
  methods: {
    update(update: Partial<IMaestroConfig>) {
      this.$store.commit('maestro/setConfig', { ...this.config, ...update });
    },
    setWebsite(value: string) {
      this.update({ website_url: value.trim() || null });
    },
    saveBrand(brand: IMaestroBrand) {
      this.update({ brand: Object.keys(brand).length ? brand : null });
    },
    setBrand(key: 'name', value: string) {
      const brand = { ...this.config.brand };
      if (value.trim()) brand[key] = value.trim();
      else delete brand[key];
      this.saveBrand(brand);
    },
    setAccent(value: string | null) {
      const brand = { ...this.config.brand, colors: { ...this.config.brand?.colors } };
      if (value) brand.colors.accent = value.toUpperCase();
      else delete brand.colors.accent;
      this.saveBrand(brand);
    },
    setCta(key: 'text' | 'url', value: string) {
      const brand = { ...this.config.brand, cta: { ...this.config.brand?.cta } };
      if (value.trim()) brand.cta[key] = value.trim();
      else delete brand.cta[key];
      this.saveBrand(brand);
    }
  }
});
</script>
