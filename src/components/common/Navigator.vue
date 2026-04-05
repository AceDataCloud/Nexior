<template>
  <div :direction="direction" :class="['navigator', { collapsed: isCollapsed && direction === 'column' }]">
    <div class="top">
      <div class="w-full flex items-center brand">
        <logo v-if="direction === 'column'" :collapsed="isCollapsed" @click.stop="onHome" />
        <button
          v-if="direction === 'column'"
          class="collapse-btn"
          :title="isCollapsed ? 'Expand' : 'Collapse'"
          @click="toggleCollapse"
        >
          <font-awesome-icon :icon="isCollapsed ? 'fa-solid fa-angles-right' : 'fa-solid fa-angles-left'" />
        </button>
      </div>
      <div ref="linksContainer" class="links">
        <template v-if="direction === 'column' && !isCollapsed">
          <template v-for="(group, groupIndex) in linkGroups" :key="groupIndex">
            <div class="category-header">{{ group.label }}</div>
            <div
              v-for="(link, linkIndex) in group.links"
              :key="`${groupIndex}-${linkIndex}`"
              :class="{ link: true, active: link.routes.includes($route.name as string) }"
              @click="$router.push(link.route)"
            >
              <el-image v-if="link.logo" :src="link.logo" class="avatar" />
              <span class="link-label">{{ link.displayName }}</span>
            </div>
          </template>
        </template>
        <template v-else>
          <div
            v-for="(link, linkIndex) in visibleLinks"
            :key="linkIndex"
            :class="{ link: true, active: link.routes.includes($route.name as string) }"
          >
            <el-tooltip effect="dark" :content="link.displayName" :placement="direction === 'row' ? 'top' : 'right'">
              <el-image v-if="link.logo" :src="link.logo" class="avatar" @click="$router.push(link.route)" />
            </el-tooltip>
          </div>
          <div v-if="overflowLinks.length > 0" :class="{ link: true, active: isOverflowActive }">
            <el-popover
              v-model:visible="showOverflow"
              :placement="direction === 'row' ? 'top' : 'right-start'"
              :width="180"
              trigger="click"
              :show-arrow="false"
              popper-class="navigator-overflow-popover"
            >
              <template #reference>
                <div class="more-button" :class="{ active: isOverflowActive }" :title="$t('common.nav.more')">
                  <div class="folder-preview">
                    <el-image
                      v-for="(link, i) in overflowPreviewLinks"
                      :key="i"
                      :src="link.logo"
                      class="folder-icon"
                      fit="cover"
                    />
                  </div>
                </div>
              </template>
              <div class="overflow-menu">
                <div
                  v-for="(link, linkIndex) in overflowLinks"
                  :key="linkIndex"
                  :class="{ 'overflow-item': true, active: link.routes.includes($route.name as string) }"
                  @click="onOverflowItemClick(link)"
                >
                  <el-image v-if="link.logo" :src="link.logo" class="overflow-avatar" fit="cover" />
                  <span class="overflow-name">{{ link.displayName }}</span>
                </div>
              </div>
            </el-popover>
          </div>
        </template>
      </div>
    </div>
    <div class="bottom">
      <user-center />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElTooltip, ElImage, ElPopover } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  ROUTE_PROFILE_INDEX,
  ROUTE_INDEX,
  ROUTE_MIDJOURNEY_INDEX,
  ROUTE_LUMA_INDEX,
  ROUTE_LUMA_HISTORY,
  ROUTE_HAILUO_INDEX,
  ROUTE_HAILUO_HISTORY,
  ROUTE_SUNO_INDEX,
  ROUTE_SUNO_HISTORY,
  ROUTE_FLUX_INDEX,
  ROUTE_CHATGPT_CONVERSATION_NEW,
  ROUTE_CHATGPT_CONVERSATION,
  ROUTE_DEEPSEEK_CONVERSATION_NEW,
  ROUTE_DEEPSEEK_CONVERSATION,
  ROUTE_GROK_CONVERSATION_NEW,
  ROUTE_GROK_CONVERSATION,
  ROUTE_GEMINI_CONVERSATION_NEW,
  ROUTE_GEMINI_CONVERSATION,
  ROUTE_CLAUDE_CONVERSATION_NEW,
  ROUTE_CLAUDE_CONVERSATION,
  ROUTE_KLING_INDEX,
  ROUTE_KLING_HISTORY,
  ROUTE_PIXVERSE_INDEX,
  ROUTE_PIXVERSE_HISTORY,
  ROUTE_VEO_INDEX,
  ROUTE_VEO_HISTORY,
  ROUTE_SORA_INDEX,
  ROUTE_SORA_HISTORY,
  ROUTE_NANOBANANA_INDEX,
  ROUTE_SEEDREAM_INDEX,
  ROUTE_SEEDANCE_INDEX
} from '@/router/constants';
import {
  CHAT_MODEL_ICON_CHATGPT,
  CHAT_MODEL_ICON_DEEPSEEK,
  CHAT_MODEL_ICON_GROK,
  CHAT_MODEL_ICON_GEMINI,
  CHAT_MODEL_ICON_CLAUDE,
  MIDJOURNEY_LOGO,
  FLUX_LOGO,
  NANOBANANA_LOGO,
  SEEDREAM_LOGO,
  SEEDANCE_LOGO,
  SUNO_LOGO,
  LUMA_LOGO,
  HAILUO_LOGO,
  KLING_LOGO,
  VEO_LOGO,
  SORA_LOGO,
  PIXVERSE_LOGO
} from '@/constants';
import Logo from './Logo.vue';
import UserCenter from '@/components/user/Center.vue';

interface NavLink {
  route: { name: string };
  displayName: string;
  logo?: string;
  icon?: string;
  routes: string[];
  category: string;
}

export default defineComponent({
  name: 'Navigator',
  components: {
    ElImage,
    ElPopover,
    Logo,
    ElTooltip,
    UserCenter,
    FontAwesomeIcon
  },
  props: {
    direction: {
      type: String,
      default: 'column'
    }
  },
  data() {
    return {
      operating: {
        dark: false,
        locale: false
      },
      activeIndex: this.$route.name as string,
      containerHeight: 0,
      showOverflow: false,
      resizeObserver: null as ResizeObserver | null,
      isCollapsed: localStorage.getItem('nav-collapsed') === 'true'
    };
  },
  computed: {
    links(): NavLink[] {
      const result: NavLink[] = [];
      // Chat category
      if (this.$store?.state?.site?.features?.chatgpt?.enabled) {
        result.push({
          route: { name: ROUTE_CHATGPT_CONVERSATION_NEW },
          displayName: this.$t('common.nav.chatgpt'),
          logo: CHAT_MODEL_ICON_CHATGPT,
          routes: [ROUTE_CHATGPT_CONVERSATION, ROUTE_CHATGPT_CONVERSATION_NEW],
          category: 'chat'
        });
      }
      if (this.$store?.state?.site?.features?.deepseek?.enabled) {
        result.push({
          route: { name: ROUTE_DEEPSEEK_CONVERSATION_NEW },
          displayName: this.$t('common.nav.deepseek'),
          logo: CHAT_MODEL_ICON_DEEPSEEK,
          routes: [ROUTE_DEEPSEEK_CONVERSATION, ROUTE_DEEPSEEK_CONVERSATION_NEW],
          category: 'chat'
        });
      }
      if (this.$store?.state?.site?.features?.grok?.enabled) {
        result.push({
          route: { name: ROUTE_GROK_CONVERSATION_NEW },
          displayName: this.$t('common.nav.grok'),
          logo: CHAT_MODEL_ICON_GROK,
          routes: [ROUTE_GROK_CONVERSATION, ROUTE_GROK_CONVERSATION_NEW],
          category: 'chat'
        });
      }
      if (this.$store?.state?.site?.features?.gemini?.enabled) {
        result.push({
          route: { name: ROUTE_GEMINI_CONVERSATION_NEW },
          displayName: this.$t('common.nav.gemini'),
          logo: CHAT_MODEL_ICON_GEMINI,
          routes: [ROUTE_GEMINI_CONVERSATION, ROUTE_GEMINI_CONVERSATION_NEW],
          category: 'chat'
        });
      }
      if (this.$store?.state?.site?.features?.claude?.enabled) {
        result.push({
          route: { name: ROUTE_CLAUDE_CONVERSATION_NEW },
          displayName: this.$t('common.nav.claude'),
          logo: CHAT_MODEL_ICON_CLAUDE,
          routes: [ROUTE_CLAUDE_CONVERSATION, ROUTE_CLAUDE_CONVERSATION_NEW],
          category: 'chat'
        });
      }
      // Image category
      if (this.$store?.state?.site?.features?.midjourney?.enabled) {
        result.push({
          route: { name: ROUTE_MIDJOURNEY_INDEX },
          displayName: this.$t('common.nav.midjourney'),
          logo: MIDJOURNEY_LOGO,
          routes: [ROUTE_MIDJOURNEY_INDEX],
          category: 'image'
        });
      }
      if (this.$store?.state?.site?.features?.flux?.enabled) {
        result.push({
          route: { name: ROUTE_FLUX_INDEX },
          displayName: this.$t('common.nav.flux'),
          logo: FLUX_LOGO,
          routes: [ROUTE_FLUX_INDEX],
          category: 'image'
        });
      }
      if (this.$store?.state?.site?.features?.nanobanana?.enabled) {
        result.push({
          route: { name: ROUTE_NANOBANANA_INDEX },
          displayName: this.$t('common.nav.nanobanana'),
          logo: NANOBANANA_LOGO,
          routes: [ROUTE_NANOBANANA_INDEX],
          category: 'image'
        });
      }
      if (this.$store?.state?.site?.features?.seedream?.enabled) {
        result.push({
          route: { name: ROUTE_SEEDREAM_INDEX },
          displayName: this.$t('common.nav.seedream'),
          logo: SEEDREAM_LOGO,
          routes: [ROUTE_SEEDREAM_INDEX],
          category: 'image'
        });
      }
      // Music category
      if (this.$store?.state?.site?.features?.suno?.enabled) {
        result.push({
          route: { name: ROUTE_SUNO_INDEX },
          displayName: this.$t('common.nav.suno'),
          logo: SUNO_LOGO,
          routes: [ROUTE_SUNO_INDEX, ROUTE_SUNO_HISTORY],
          category: 'music'
        });
      }
      // Video category
      if (this.$store?.state?.site?.features?.seedance?.enabled) {
        result.push({
          route: { name: ROUTE_SEEDANCE_INDEX },
          displayName: this.$t('common.nav.seedance'),
          logo: SEEDANCE_LOGO,
          routes: [ROUTE_SEEDANCE_INDEX],
          category: 'video'
        });
      }
      if (this.$store?.state?.site?.features?.luma?.enabled) {
        result.push({
          route: { name: ROUTE_LUMA_INDEX },
          displayName: this.$t('common.nav.luma'),
          logo: LUMA_LOGO,
          routes: [ROUTE_LUMA_INDEX, ROUTE_LUMA_HISTORY],
          category: 'video'
        });
      }
      if (this.$store?.state?.site?.features?.hailuo?.enabled) {
        result.push({
          route: { name: ROUTE_HAILUO_INDEX },
          displayName: this.$t('common.nav.hailuo'),
          logo: HAILUO_LOGO,
          routes: [ROUTE_HAILUO_INDEX, ROUTE_HAILUO_HISTORY],
          category: 'video'
        });
      }
      if (this.$store?.state?.site?.features?.kling?.enabled) {
        result.push({
          route: { name: ROUTE_KLING_INDEX },
          displayName: this.$t('common.nav.kling'),
          logo: KLING_LOGO,
          routes: [ROUTE_KLING_INDEX, ROUTE_KLING_HISTORY],
          category: 'video'
        });
      }
      if (this.$store?.state?.site?.features?.veo?.enabled) {
        result.push({
          route: { name: ROUTE_VEO_INDEX },
          displayName: this.$t('common.nav.veo'),
          logo: VEO_LOGO,
          routes: [ROUTE_VEO_INDEX, ROUTE_VEO_HISTORY],
          category: 'video'
        });
      }
      if (this.$store?.state?.site?.features?.sora?.enabled) {
        result.push({
          route: { name: ROUTE_SORA_INDEX },
          displayName: this.$t('common.nav.sora'),
          logo: SORA_LOGO,
          routes: [ROUTE_SORA_INDEX, ROUTE_SORA_HISTORY],
          category: 'video'
        });
      }
      if (this.$store?.state?.site?.features?.pixverse?.enabled) {
        result.push({
          route: { name: ROUTE_PIXVERSE_INDEX },
          displayName: this.$t('common.nav.pixverse'),
          logo: PIXVERSE_LOGO,
          routes: [ROUTE_PIXVERSE_INDEX, ROUTE_PIXVERSE_HISTORY],
          category: 'video'
        });
      }
      if (this.direction === 'row') {
        result.push({
          route: { name: ROUTE_PROFILE_INDEX },
          displayName: this.$t('common.nav.profile'),
          icon: 'fa-solid fa-user',
          routes: [ROUTE_PROFILE_INDEX],
          category: 'other'
        });
      }
      return result;
    },
    linkGroups() {
      const categoryOrder = ['chat', 'image', 'music', 'video'];
      const categoryLabels: Record<string, string> = {
        chat: this.$t('common.nav.chat'),
        image: this.$t('common.nav.image'),
        music: this.$t('common.nav.music'),
        video: this.$t('common.nav.video')
      };
      const groups: { label: string; links: NavLink[] }[] = [];
      for (const cat of categoryOrder) {
        const catLinks = this.links.filter((l) => l.category === cat);
        if (catLinks.length > 0) {
          groups.push({ label: categoryLabels[cat], links: catLinks });
        }
      }
      return groups;
    },
    authenticated() {
      return !!this.$store.state.token.access;
    },
    maxVisibleItems(): number {
      if (this.direction === 'row') return this.links.length;
      const itemHeight = 50;
      const maxItems = Math.floor((this.containerHeight + 15) / itemHeight);
      return Math.max(maxItems, 3);
    },
    visibleLinks() {
      if (this.links.length <= this.maxVisibleItems) return this.links;
      return this.links.slice(0, this.maxVisibleItems - 1);
    },
    overflowLinks() {
      if (this.links.length <= this.maxVisibleItems) return [];
      return this.links.slice(this.maxVisibleItems - 1);
    },
    overflowPreviewLinks() {
      return this.overflowLinks.slice(0, 4);
    },
    isOverflowActive(): boolean {
      const routeName = this.$route.name as string;
      return this.overflowLinks.some((link: { routes: string[] }) => link.routes.includes(routeName));
    }
  },
  watch: {
    $route() {
      this.showOverflow = false;
    }
  },
  mounted() {
    if (this.$refs.linksContainer) {
      const el = this.$refs.linksContainer as HTMLElement;
      this.containerHeight = el.clientHeight;
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          this.containerHeight = entry.contentRect.height;
        }
      });
      this.resizeObserver.observe(el);
    }
  },
  beforeUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  },
  methods: {
    onHome() {
      this.$router.push({
        name: ROUTE_INDEX
      });
    },
    onOverflowItemClick(link: { route: { name: string } }) {
      this.showOverflow = false;
      this.$router.push(link.route);
    },
    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed;
      localStorage.setItem('nav-collapsed', String(this.isCollapsed));
    }
  }
});
</script>

<style lang="scss" scoped>
.navigator {
  display: flex;
  align-items: center;
  position: relative;
  background-color: var(--app-nav-bg);
  border-right: 1px solid var(--app-border-subtle);
  transition: width 0.25s ease;

  .top {
    .avatar {
      display: block;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      cursor: pointer;
      flex-shrink: 0;
    }
  }

  .category-header {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--el-text-color-secondary);
    padding: 16px 16px 6px;
    user-select: none;
  }

  .collapse-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    flex-shrink: 0;
    transition:
      background 0.15s,
      color 0.15s;
    font-size: 12px;

    &:hover {
      background: var(--el-fill-color-light);
      color: var(--el-text-color-primary);
    }
  }

  &[direction='row'] {
    flex-direction: row;
    overflow-x: scroll;
    border-right: none;
    border-top: 1px solid var(--app-border-subtle);

    .brand {
      display: none;
    }
    .top {
      padding-left: 10px;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 10px;
      justify-content: space-evenly;
      .links {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 10px;
        .link {
          text-align: center;
          .description {
            font-size: 10px;
            margin-top: 3px;
          }
          &.active {
            color: var(--el-color-primary);
          }
        }
      }
    }
    .bottom {
      padding: 0 10px;
      display: flex;
      flex: 1;
      justify-content: flex-end;
    }
  }

  &[direction='column'] {
    flex-direction: column;
    width: 220px;

    .top {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding-top: 12px;
      width: 100%;
      min-height: 0;
      overflow: hidden;

      .brand {
        flex: 0 0 auto;
        margin-bottom: 8px;
        padding: 0 12px;
        justify-content: space-between;
      }

      .links {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
        overflow-y: auto;
        overflow-x: hidden;
        padding-bottom: 10px;

        /* Subtle scrollbar */
        &::-webkit-scrollbar {
          width: 4px;
        }
        &::-webkit-scrollbar-track {
          background: transparent;
        }
        &::-webkit-scrollbar-thumb {
          background: var(--el-fill-color);
          border-radius: 4px;
        }
      }

      .logo {
        width: 40px;
        height: 40px;
        cursor: pointer;
      }

      .link {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 16px;
        margin: 0 8px;
        border-radius: 10px;
        cursor: pointer;
        transition:
          background 0.15s,
          box-shadow 0.15s;
        color: var(--el-text-color-primary);
        position: relative;

        .link-label {
          font-size: 13px;
          font-weight: 450;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        &:hover {
          background: var(--el-fill-color-light);
        }

        &.active {
          background: var(--el-color-primary-light-9);
          color: var(--el-color-primary);

          &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 18px;
            border-radius: 0 3px 3px 0;
            background: var(--el-color-primary);
          }
        }
      }

      .more-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 35px;
        height: 35px;
        border-radius: 50%;
        background: var(--el-fill-color-light);
        cursor: pointer;
        margin: auto;
        box-shadow: var(--app-shadow-xs);
        transition:
          border-radius 0.2s,
          background-color 0.2s,
          box-shadow 0.2s;

        &:hover {
          border-radius: 35%;
          background: var(--el-fill-color);
          box-shadow: var(--app-shadow-sm);
        }

        &.active {
          box-shadow: 0 0 0 2px var(--el-color-primary);
        }

        .folder-preview {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 1px;
          width: 22px;
          height: 22px;

          .folder-icon {
            width: 10px;
            height: 10px;
            border-radius: 50%;
          }
        }
      }
    }

    .bottom {
      height: 50px;
      display: flex;
      flex-direction: column;
      width: 100%;
      justify-content: flex-end;
      align-items: center;
      padding-bottom: 10px;
      border-top: 1px solid var(--app-border-subtle);
    }

    /* Collapsed state */
    &.collapsed {
      width: 60px;

      .top {
        padding-top: 10px;

        .brand {
          justify-content: center;
          padding: 0;
          margin-bottom: 15px;

          .collapse-btn {
            display: none;
          }
        }

        .links {
          gap: 15px;
          align-items: center;
        }

        .link {
          padding: 0;
          margin: 0;
          justify-content: center;
          background: none !important;

          .avatar {
            width: 35px;
            height: 35px;
            margin: auto;
          }

          .link-label {
            display: none;
          }

          &.active::before {
            display: none;
          }
        }

        .category-header {
          display: none;
        }
      }

      .bottom {
        border-top: none;
      }
    }
  }
}

html.dark .navigator {
  border-right-color: var(--app-glass-border);
}
</style>

<style lang="scss">
.navigator-overflow-popover {
  padding: 6px !important;
  border-radius: 12px !important;
  backdrop-filter: blur(var(--app-glass-blur));

  .overflow-menu {
    max-height: 400px;
    overflow-y: auto;

    .overflow-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 8px;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.15s;

      &:hover {
        background: var(--el-fill-color-light);
      }

      &.active {
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
      }

      .overflow-avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .overflow-name {
        font-size: 13px;
        color: var(--el-text-color-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}
</style>
