<template>
  <div :direction="direction" :class="['navigator', { collapsed: direction === 'column' }]">
    <div v-if="direction === 'column'" class="brand">
      <logo @click.stop="onHome" />
    </div>
    <div class="top">
      <div ref="linksContainer" class="links">
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
import {
  ROUTE_INDEX,
  ROUTE_PROFILE_INDEX,
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
  ROUTE_SEEDANCE_INDEX,
  ROUTE_WAN_INDEX,
  ROUTE_PRODUCER_INDEX,
  ROUTE_KIMI_CONVERSATION,
  ROUTE_KIMI_CONVERSATION_NEW,
  ROUTE_SERP_INDEX
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
  PIXVERSE_LOGO,
  WAN_LOGO,
  PRODUCER_LOGO,
  CHAT_MODEL_ICON_KIMI,
  SERP_LOGO
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
    UserCenter
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
      resizeObserver: null as ResizeObserver | null
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
      if (this.$store?.state?.site?.features?.kimi?.enabled) {
        result.push({
          route: { name: ROUTE_KIMI_CONVERSATION_NEW },
          displayName: this.$t('common.nav.kimi'),
          logo: CHAT_MODEL_ICON_KIMI,
          routes: [ROUTE_KIMI_CONVERSATION, ROUTE_KIMI_CONVERSATION_NEW],
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
      if (this.$store?.state?.site?.features?.producer?.enabled) {
        result.push({
          route: { name: ROUTE_PRODUCER_INDEX },
          displayName: this.$t('common.nav.producer'),
          logo: PRODUCER_LOGO,
          routes: [ROUTE_PRODUCER_INDEX],
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
      if (this.$store?.state?.site?.features?.wan?.enabled) {
        result.push({
          route: { name: ROUTE_WAN_INDEX },
          displayName: this.$t('common.nav.wan'),
          logo: WAN_LOGO,
          routes: [ROUTE_WAN_INDEX],
          category: 'video'
        });
      }
      // Search category
      if (this.$store?.state?.site?.features?.serp?.enabled) {
        result.push({
          route: { name: ROUTE_SERP_INDEX },
          displayName: this.$t('common.nav.serp'),
          logo: SERP_LOGO,
          routes: [ROUTE_SERP_INDEX],
          category: 'search'
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
      this.$router.push({ name: ROUTE_INDEX });
    },
    onOverflowItemClick(link: { route: { name: string } }) {
      this.showOverflow = false;
      this.$router.push(link.route);
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
    display: none;
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
    width: 60px;

    .brand {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 6px 0 4px;
      width: 100%;
    }

    .top {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding-top: 0;
      width: 100%;
      min-height: 0;
      overflow: hidden;

      .links {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: 15px;
        align-items: center;
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

      .link {
        display: flex;
        align-items: center;
        padding: 0;
        margin: 0;
        justify-content: center;
        cursor: pointer;
        background: none !important;
        color: var(--el-text-color-primary);

        .avatar {
          width: 35px;
          height: 35px;
          border-radius: 50%;
          margin: auto;
          cursor: pointer;
          flex-shrink: 0;
        }

        .link-label {
          display: none;
        }

        &.active::before {
          display: none;
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
