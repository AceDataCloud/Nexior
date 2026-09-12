<template>
  <div class="home-settings">
    <section class="layout-section">
      <header>
        <h3>{{ $t('site.homeLayout.title') }}</h3>
        <p>{{ $t('site.homeLayout.tip') }}</p>
      </header>
      <div class="layout-list">
        <article v-for="section in sections" :key="section.key" class="layout-row">
          <div>
            <strong>{{ $t(section.titleKey) }}</strong>
            <span>{{ $t(section.tipKey) }}</span>
          </div>
          <el-switch
            :model-value="sectionEnabled(section.key)"
            :loading="busyKey === section.key"
            @change="toggleSection(section.key, $event as boolean)"
          />
        </article>
      </div>
      <div v-if="sectionEnabled('categories')" class="category-options">
        <span>{{ $t('site.homeLayout.categoriesSelect') }}</span>
        <div class="category-grid">
          <el-checkbox
            v-for="category in HOME_CATEGORIES"
            :key="category.id"
            :model-value="categoryVisible(category.id)"
            :disabled="busyKey === 'categories'"
            @change="toggleCategory(category.id, $event as boolean)"
          >
            {{ $t(category.titleKey) }}
          </el-checkbox>
        </div>
      </div>
    </section>
    <banners-setting :site="site" />
    <home-sections-setting :site="site" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElCheckbox, ElMessage, ElSwitch } from 'element-plus';
import BannersSetting from './Banners.vue';
import HomeSectionsSetting from './HomeSections.vue';
import { HOME_CATEGORIES } from '@/pages/home/data';
import { siteOperator } from '@/operators';
import {
  getHiddenCategoryIds,
  isHomeSectionEnabled,
  withHiddenCategoryIds,
  withHomeSectionEnabled,
  type HomeCategoryId,
  type HomeSectionKey
} from '@/utils/siteHome';

const SECTIONS: Array<{ key: HomeSectionKey; titleKey: string; tipKey: string }> = [
  { key: 'banner', titleKey: 'site.homeLayout.banner', tipKey: 'site.homeLayout.bannerTip' },
  { key: 'categories', titleKey: 'site.homeLayout.categories', tipKey: 'site.homeLayout.categoriesTip' },
  { key: 'showcase', titleKey: 'site.homeLayout.showcase', tipKey: 'site.homeLayout.showcaseTip' }
];

export default defineComponent({
  name: 'HomeSetting',
  components: { BannersSetting, ElCheckbox, ElSwitch, HomeSectionsSetting },
  data() {
    return { HOME_CATEGORIES, sections: SECTIONS, busyKey: '' };
  },
  computed: {
    site() {
      return this.$store.state.site;
    },
    hiddenCategoryIds(): Set<HomeCategoryId> {
      return getHiddenCategoryIds(this.site);
    }
  },
  methods: {
    sectionEnabled(key: HomeSectionKey): boolean {
      return isHomeSectionEnabled(this.site, key);
    },
    async save(home: ReturnType<typeof withHomeSectionEnabled>, busyKey: HomeSectionKey): Promise<void> {
      if (!this.site?.id) return;
      this.busyKey = busyKey;
      try {
        await siteOperator.update(this.site.id, { home });
        await this.$store.dispatch('getSite');
      } catch {
        ElMessage.error(this.$t('site.homeLayout.updateFailed'));
      } finally {
        this.busyKey = '';
      }
    },
    async toggleSection(key: HomeSectionKey, enabled: boolean): Promise<void> {
      await this.save(withHomeSectionEnabled(this.site, key, enabled), key);
    },
    categoryVisible(id: string): boolean {
      return !this.hiddenCategoryIds.has(id as HomeCategoryId);
    },
    async toggleCategory(id: string, visible: boolean): Promise<void> {
      const hidden = new Set(this.hiddenCategoryIds);
      const categoryId = id as HomeCategoryId;
      if (visible) hidden.delete(categoryId);
      else hidden.add(categoryId);
      await this.save(withHiddenCategoryIds(this.site, hidden), 'categories');
    }
  }
});
</script>

<style lang="scss" scoped>
.home-settings {
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.layout-section,
.layout-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.layout-section header h3 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 15px;
}
.layout-section header p,
.category-options > span {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}
.layout-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
}
.layout-row > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}
.layout-row strong {
  color: var(--el-text-color-primary);
  font-size: 13px;
}
.layout-row span {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}
.category-options {
  padding: 0 14px 4px;
}
.category-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 8px;
}
@media (max-width: 760px) {
  .category-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
