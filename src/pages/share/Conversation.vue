<template>
  <div class="shared-page">
    <header class="shared-header">
      <div class="brand" @click="goToApp">
        <img v-if="brandLogo" :src="brandLogo" class="brand-logo" alt="logo" />
        <span class="brand-name">{{ brandName }}</span>
      </div>
      <el-button class="cta" type="primary" round @click="goToApp">
        {{ $t('chat.share.startYourOwn') }}
      </el-button>
    </header>

    <main class="shared-body">
      <el-skeleton v-if="loading" :rows="6" animated class="skeleton" />

      <div v-else-if="error" class="unavailable">
        <font-awesome-icon icon="fa-solid fa-link-slash" class="unavailable-icon" />
        <h1 class="unavailable-title">{{ $t('chat.share.unavailableTitle') }}</h1>
        <p class="unavailable-hint">{{ $t('chat.share.unavailableHint') }}</p>
        <el-button type="primary" round @click="goToApp">{{ $t('chat.share.startYourOwn') }}</el-button>
      </div>

      <div v-else class="conversation">
        <div class="conversation-head">
          <h1 class="conversation-title">{{ title }}</h1>
          <div class="conversation-meta">
            <img v-if="modelGroup?.icon" :src="modelGroup.icon" class="meta-icon" alt="model" />
            <span v-if="modelGroupName" class="meta-model">{{ modelGroupName }}</span>
            <span class="meta-badge">
              <font-awesome-icon icon="fa-solid fa-eye" class="mr-1" />
              {{ $t('chat.share.viewOnly') }}
            </span>
          </div>
        </div>

        <div class="messages">
          <message
            v-for="(message, index) in messages"
            :key="index"
            :message="message"
            :messages="messages"
            :application="undefined"
            :readonly="true"
            :model-group-override="modelGroup"
            class="message"
          />
        </div>

        <footer class="shared-footer">
          <span class="footer-note">{{ $t('chat.share.footerNote') }}</span>
          <el-button class="footer-cta" type="primary" round @click="goToApp">
            {{ $t('chat.share.startYourOwn') }}
          </el-button>
        </footer>
      </div>
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent, provide } from 'vue';
import { ElButton, ElSkeleton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import Message from '@/components/chat/Message.vue';
import { chatOperator } from '@/operators';
import { CHAT_MODEL_GROUPS, CHAT_MODELS } from '@/constants';
import { IChatConversation, IChatMessage, IChatModelGroup } from '@/models';
import { MARKDOWN_SANITIZE_KEY } from '@/components/common/VueMarkdown.vue';

interface IData {
  loading: boolean;
  error: boolean;
  conversation: IChatConversation | undefined;
}

export default defineComponent({
  name: 'SharedConversation',
  components: {
    Message,
    ElButton,
    ElSkeleton,
    FontAwesomeIcon
  },
  setup() {
    // Force sanitized markdown rendering for every VueMarkdown descendant.
    // Shared content is attacker-controlled and viewed by unauthenticated
    // strangers — raw HTML in message content must be escaped, not executed.
    provide(MARKDOWN_SANITIZE_KEY, true);
  },
  data(): IData {
    return {
      loading: true,
      error: false,
      conversation: undefined
    };
  },
  computed: {
    shareId(): string {
      return this.$route.params?.id?.toString() || '';
    },
    messages(): IChatMessage[] {
      return this.conversation?.messages || [];
    },
    title(): string {
      return this.conversation?.title || this.$t('chat.share.untitled');
    },
    // Resolve the avatar/model group without touching the chat store (this
    // page can be viewed logged-out, where that module isn't registered).
    modelGroup(): IChatModelGroup | undefined {
      const group = this.conversation?.model_group;
      if (group) {
        const byGroup = CHAT_MODEL_GROUPS.find((g) => g.name === group);
        if (byGroup) return byGroup;
      }
      const model = this.conversation?.model;
      const targetModel = CHAT_MODELS.find((m) => m.name === model);
      return CHAT_MODEL_GROUPS.find((g) => g.name === targetModel?.modelGroup);
    },
    modelGroupName(): string {
      return this.modelGroup?.getDisplayName?.() || '';
    },
    brandName(): string {
      return this.$store.state.site?.title || 'AceData';
    },
    brandLogo(): string | undefined {
      return this.$store.state.site?.logo || this.$store.state.site?.favicon || undefined;
    }
  },
  async mounted() {
    // Shared conversations may contain private content — keep them out of
    // search indexes even though the link itself is public.
    this.setNoIndex();
    await this.fetchShared();
  },
  beforeUnmount() {
    const robots = document.querySelector('meta[name="robots"]');
    if (robots) {
      robots.setAttribute('content', 'index, follow');
    }
  },
  methods: {
    async fetchShared() {
      this.loading = true;
      this.error = false;
      if (!this.shareId) {
        this.error = true;
        this.loading = false;
        return;
      }
      try {
        this.conversation = await chatOperator.getSharedConversation(this.shareId);
        if (typeof document !== 'undefined' && this.conversation?.title) {
          document.title = this.conversation.title;
        }
      } catch (e) {
        console.error('getSharedConversation failed', this.shareId, e);
        this.error = true;
      } finally {
        this.loading = false;
      }
    },
    goToApp() {
      this.$router.push('/');
    },
    setNoIndex() {
      if (typeof document === 'undefined') return;
      let robots = document.querySelector('meta[name="robots"]');
      if (!robots) {
        robots = document.createElement('meta');
        robots.setAttribute('name', 'robots');
        document.head.appendChild(robots);
      }
      robots.setAttribute('content', 'noindex, nofollow');
    }
  }
});
</script>

<style lang="scss" scoped>
.shared-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color, #fff);
}

.shared-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
  background-color: var(--el-bg-color, #fff);

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;

    .brand-logo {
      height: 28px;
      width: auto;
    }
    .brand-name {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }
}

.shared-body {
  flex: 1;
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
  padding: 24px 20px 48px;
  box-sizing: border-box;
}

.skeleton {
  margin-top: 24px;
}

.unavailable {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  padding: 80px 20px;

  .unavailable-icon {
    font-size: 40px;
    color: var(--el-text-color-secondary);
  }
  .unavailable-title {
    font-size: 22px;
    font-weight: 600;
    margin: 0;
  }
  .unavailable-hint {
    color: var(--el-text-color-secondary);
    margin: 0 0 8px;
  }
}

.conversation-head {
  margin-bottom: 24px;

  .conversation-title {
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 10px;
    line-height: 1.3;
    word-break: break-word;
  }
  .conversation-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--el-text-color-secondary);
    font-size: 13px;

    .meta-icon {
      height: 18px;
      width: 18px;
      border-radius: 4px;
    }
    .meta-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 10px;
      background-color: var(--el-fill-color-light, #f5f7fa);
    }
  }
}

.shared-footer {
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid var(--el-border-color-lighter, #ebeef5);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;

  .footer-note {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
}
</style>
