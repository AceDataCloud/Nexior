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
    </section>
    <home-scenes :site="site" @saved="onScenesSaved" />
    <banners-setting :site="site" />
    <home-sections-setting :site="site" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElMessage, ElSwitch } from 'element-plus';
import BannersSetting from './Banners.vue';
import HomeSectionsSetting from './HomeSections.vue';
import HomeScenes from './HomeScenes.vue';
import { siteOperator } from '@/operators';
import { isHomeSectionEnabled, withHomeSectionEnabled, type HomeSectionKey } from '@/utils/siteHome';

const SECTIONS: Array<{ key: HomeSectionKey; titleKey: string; tipKey: string }> = [
  { key: 'banner', titleKey: 'site.homeLayout.banner', tipKey: 'site.homeLayout.bannerTip' },
  { key: 'categories', titleKey: 'site.homeLayout.categories', tipKey: 'site.homeLayout.categoriesTip' },
  { key: 'showcase', titleKey: 'site.homeLayout.showcase', tipKey: 'site.homeLayout.showcaseTip' }
];

export default defineComponent({
  name: 'HomeSetting',
  components: { BannersSetting, ElSwitch, HomeSectionsSetting, HomeScenes },
  data() {
    return { sections: SECTIONS, busyKey: '' };
  },
  computed: {
    site() {
      return this.$store.state.site;
    }
  },
  methods: {
    async onScenesSaved(): Promise<void> {
      await this.$store.dispatch('getSite');
    },
    sectionEnabled(key: HomeSectionKey): boolean {
      return isHomeSectionEnabled(this.site, key);
    },
    async save(
      change: (site: typeof this.site) => ReturnType<typeof withHomeSectionEnabled>,
      busyKey: HomeSectionKey
    ): Promise<void> {
      if (!this.site?.id) return;
      this.busyKey = busyKey;
      try {
        const { data: latest } = await siteOperator.get(this.site.id);
        const source = { ...latest, home: latest.home };
        await siteOperator.update(this.site.id, { home: change(source) }, latest.configuration_revision);
        await this.$store.dispatch('getSite');
      } catch {
        ElMessage.error(this.$t('site.homeLayout.updateFailed'));
      } finally {
        this.busyKey = '';
      }
    },
    async toggleSection(key: HomeSectionKey, enabled: boolean): Promise<void> {
      await this.save((source) => withHomeSectionEnabled(source, key, enabled), key);
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
