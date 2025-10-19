<template>
  <div :direction="direction" class="navigator">
    <div class="top">
      <div class="w-full flex justify-center brand">
        <logo v-if="direction === 'column'" @click.stop="onHome" />
      </div>
      <div
        v-for="(link, linkIndex) in links"
        :key="linkIndex"
        :class="{link: true, active: link.routes.includes($route.name as string)}"
      >
        <el-tooltip effect="dark" :content="link.displayName" :placement="direction === 'row' ? 'top' : 'right'">
          <el-image v-if="link.logo" :src="link.logo" class="avatar" @click="$router.push(link.route)" />
        </el-tooltip>
      </div>
    </div>
    <div class="bottom">
      <user-center />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElTooltip, ElImage } from 'element-plus';
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
  ROUTE_KLING_INDEX,
  ROUTE_KLING_HISTORY,
  ROUTE_PIXVERSE_INDEX,
  ROUTE_PIXVERSE_HISTORY,
  ROUTE_VEO_INDEX,
  ROUTE_VEO_HISTORY,
  ROUTE_SORA_INDEX,
  ROUTE_SORA_HISTORY,
  ROUTE_NANOBANANA_INDEX
} from '@/router/constants';
import { CHAT_MODEL_ICON_CHATGPT, CHAT_MODEL_ICON_DEEPSEEK, CHAT_MODEL_ICON_GROK } from '@/constants/chat';
import Logo from './Logo.vue';
import UserCenter from '@/components/user/Center.vue';

export default defineComponent({
  name: 'Navigator',
  components: {
    ElImage,
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
      activeIndex: this.$route.name as string
    };
  },
  computed: {
    links() {
      const result = [];
      // Add chatgpt's leftmost icon
      if (this.$store?.state?.site?.features?.chatgpt?.enabled) {
        result.push({
          route: {
            name: ROUTE_CHATGPT_CONVERSATION_NEW
          },
          displayName: this.$t('common.nav.chatgpt'),
          logo: CHAT_MODEL_ICON_CHATGPT,
          routes: [ROUTE_CHATGPT_CONVERSATION, ROUTE_CHATGPT_CONVERSATION_NEW]
        });
      }
      // Add deepseek's leftmost icon
      if (this.$store?.state?.site?.features?.deepseek?.enabled) {
        result.push({
          route: {
            name: ROUTE_DEEPSEEK_CONVERSATION_NEW
          },
          displayName: this.$t('common.nav.deepseek'),
          logo: CHAT_MODEL_ICON_DEEPSEEK,
          routes: [ROUTE_DEEPSEEK_CONVERSATION, ROUTE_DEEPSEEK_CONVERSATION_NEW]
        });
      }
      // Add grok's leftmost icon
      if (this.$store?.state?.site?.features?.grok?.enabled) {
        result.push({
          route: {
            name: ROUTE_GROK_CONVERSATION_NEW
          },
          displayName: this.$t('common.nav.grok'),
          logo: CHAT_MODEL_ICON_GROK,
          routes: [ROUTE_GROK_CONVERSATION, ROUTE_GROK_CONVERSATION_NEW]
        });
      }
      // Add midjourney's leftmost icon
      if (this.$store?.state?.site?.features?.midjourney?.enabled) {
        result.push({
          route: {
            name: ROUTE_MIDJOURNEY_INDEX
          },
          displayName: this.$t('common.nav.midjourney'),
          logo: 'https://cdn.acedata.cloud/wto43b.png',
          routes: [ROUTE_MIDJOURNEY_INDEX]
        });
      }
      // Add flux's leftmost icon
      if (this.$store?.state?.site?.features?.flux?.enabled) {
        result.push({
          route: {
            name: ROUTE_FLUX_INDEX
          },
          displayName: this.$t('common.nav.flux'),
          logo: 'https://cdn.acedata.cloud/ogm2oa.png',
          routes: [ROUTE_FLUX_INDEX]
        });
      }
      // Add nanobanana's leftmost icon
      if (this.$store?.state?.site?.features?.nanobanana?.enabled) {
        result.push({
          route: {
            name: ROUTE_NANOBANANA_INDEX
          },
          displayName: this.$t('common.nav.nanobanana'),
          logo: 'https://cdn.acedata.cloud/859plc.jpg',
          routes: [ROUTE_NANOBANANA_INDEX]
        });
      }
      // Add qrart's leftmost icon
      // if (this.$store?.state?.site?.features?.qrart?.enabled) {
      //   result.push({
      //     route: {
      //       name: ROUTE_QRART_INDEX
      //     },
      //     displayName: this.$t('common.nav.qrart'),
      //     routes: [ROUTE_QRART_INDEX, ROUTE_QRART_HISTORY]
      //   });
      // }
      // Add suno's leftmost icon
      if (this.$store?.state?.site?.features?.suno?.enabled) {
        result.push({
          route: {
            name: ROUTE_SUNO_INDEX
          },
          displayName: this.$t('common.nav.suno'),
          logo: 'https://cdn.acedata.cloud/l3ffw7.jpg',
          routes: [ROUTE_SUNO_INDEX, ROUTE_SUNO_HISTORY]
        });
      }
      // Add luma's leftmost icon
      if (this.$store?.state?.site?.features?.luma?.enabled) {
        result.push({
          route: {
            name: ROUTE_LUMA_INDEX
          },
          displayName: this.$t('common.nav.luma'),
          logo: 'https://cdn.acedata.cloud/ahjfwi.png',
          routes: [ROUTE_LUMA_INDEX, ROUTE_LUMA_HISTORY]
        });
      }
      // Add pika's leftmost icon
      // if (this.$store?.state?.site?.features?.pika?.enabled) {
      //   result.push({
      //     route: {
      //       name: ROUTE_PIKA_INDEX
      //     },
      //     displayName: this.$t('common.nav.pika'),
      //     logo: 'https://cdn.acedata.cloud/i80tgn.png',
      //     routes: [ROUTE_PIKA_INDEX, ROUTE_PIKA_HISTORY]
      //   });
      // }
      // Add hailuo's leftmost icon
      if (this.$store?.state?.site?.features?.hailuo?.enabled) {
        result.push({
          route: {
            name: ROUTE_HAILUO_INDEX
          },
          displayName: this.$t('common.nav.hailuo'),
          logo: 'https://cdn.acedata.cloud/0qg4gp.png',
          routes: [ROUTE_HAILUO_INDEX, ROUTE_HAILUO_HISTORY]
        });
      }
      // Add kling's leftmost icon
      if (this.$store?.state?.site?.features?.kling?.enabled) {
        result.push({
          route: {
            name: ROUTE_KLING_INDEX
          },
          displayName: this.$t('common.nav.kling'),
          logo: 'https://cdn.acedata.cloud/qpbbbb.jpg',
          routes: [ROUTE_KLING_INDEX, ROUTE_KLING_HISTORY]
        });
      }
      // Add veo's leftmost icon
      if (this.$store?.state?.site?.features?.veo?.enabled) {
        result.push({
          route: {
            name: ROUTE_VEO_INDEX
          },
          displayName: this.$t('common.nav.veo'),
          logo: 'https://cdn.acedata.cloud/8nxyy9.jpg',
          routes: [ROUTE_VEO_INDEX, ROUTE_VEO_HISTORY]
        });
      }
      // Add sora's leftmost icon
      if (this.$store?.state?.site?.features?.sora?.enabled) {
        result.push({
          route: {
            name: ROUTE_SORA_INDEX
          },
          displayName: this.$t('common.nav.sora'),
          logo: 'https://cdn.acedata.cloud/z5id1u.png',
          routes: [ROUTE_SORA_INDEX, ROUTE_SORA_HISTORY]
        });
      }
      // Add pixverse's leftmost icon
      if (this.$store?.state?.site?.features?.pixverse?.enabled) {
        result.push({
          route: {
            name: ROUTE_PIXVERSE_INDEX
          },
          displayName: this.$t('common.nav.pixverse'),
          logo: 'https://cdn.acedata.cloud/viy61r.jpg',
          routes: [ROUTE_PIXVERSE_INDEX, ROUTE_PIXVERSE_HISTORY]
        });
      }
      // Add headshots's leftmost icon
      // if (this.$store?.state?.site?.features?.headshots?.enabled) {
      //   result.push({
      //     route: {
      //       name: ROUTE_HEADSHOTS_INDEX
      //     },
      //     displayName: this.$t('common.nav.headshots'),
      //     icon: 'fa-solid fa-id-card',
      //     routes: [ROUTE_HEADSHOTS_INDEX, ROUTE_HEADSHOTS_HISTORY]
      //   });
      // }
      if (this.direction === 'row') {
        result.push({
          route: {
            name: ROUTE_PROFILE_INDEX
          },
          displayName: this.$t('common.nav.profile'),
          icon: 'fa-solid fa-user',
          routes: [ROUTE_PROFILE_INDEX]
        });
      }
      return result;
    },
    authenticated() {
      return !!this.$store.state.token.access;
    }
  },
  methods: {
    onHome() {
      this.$router.push({
        name: ROUTE_INDEX
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.navigator {
  display: flex;
  align-items: center;
  position: relative;
  background-color: var(--el-bg-color);

  .top {
    .avatar {
      display: block;
      margin: auto;
      width: 35px;
      height: 35px;
      border-radius: 50%;
      cursor: pointer;
      border: 1px solid var(--el-border-color-lighter);
    }
  }

  &[direction='row'] {
    flex-direction: row;
    border-top: 1px solid var(--el-border-color);
    overflow-x: scroll;
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
    .bottom {
      padding: 0 10px;
      display: flex;
      flex: 1;
      justify-content: flex-end;
    }
  }
  &[direction='column'] {
    flex-direction: column;
    .top {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding-top: 10px;
      width: 60px;
      gap: 15px;
      .logo {
        width: 40px;
        height: 40px;
        cursor: pointer;
      }
      .link {
        width: 100%;
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
</style>
