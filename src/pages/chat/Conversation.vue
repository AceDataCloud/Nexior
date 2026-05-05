<template>
  <layout @change-conversation="onChangeConversation($event)">
    <template #chat>
      <div class="toolbar">
        <div class="toolbar-left">
          <model-selector class="selector" @model-group-changed="onChangeConversation(undefined)" />
          <byok-badge class="byok-badge" />
        </div>
        <div class="toolbar-actions">
          <el-tooltip v-if="false" :content="$t('chat.agent.tooltip')" placement="bottom">
            <el-button class="toolbar-btn" text @click="agentManagerVisible = true">
              <font-awesome-icon icon="fa-solid fa-desktop" />
              <span v-if="agentConnected" class="agent-dot"></span>
            </el-button>
          </el-tooltip>
        </div>
      </div>
      <desktop-agent-manager
        v-if="agentManagerVisible"
        v-model="agentManagerVisible"
        :connected="agentConnected"
        :agent-name="agentName"
        :tool-count="agentToolCount"
        :connected-at="agentConnectedAt"
      />
      <div :class="{ dialogue: true, empty: messages.length === 0 }">
        <div v-if="messages.length > 0" class="messages">
          <message
            v-for="(message, messageIndex) in messages"
            :key="messageIndex"
            :message="message"
            :messages="messages"
            :question="question"
            :application="application"
            class="message"
            @update:question="question = $event"
            @edit="onEdit"
            @restart="onRestart"
            @answer-ask-user-question="onAnswerAskUserQuestion"
            @skip-ask-user-question="onSkipAskUserQuestion"
          />
        </div>
        <div class="starter">
          <composer
            v-model:question="question"
            :answering="answering"
            :ready="ready"
            :references="references"
            @update:references="references = $event"
            @submit="onSubmit"
            @stop="onStop"
          />
          <disclaimer class="disclaimer" />
        </div>
      </div>
    </template>
  </layout>
</template>

<script lang="ts">
import axios from 'axios';
import { defineComponent } from 'vue';
import Message from '@/components/chat/Message.vue';
import { CHAT_MODEL_GROUPS, CHAT_MODELS, ROLE_ASSISTANT, ROLE_USER } from '@/constants';
import {
  IChatMessageState,
  IChatConversationResponse,
  IChatConversation,
  IChatMessage,
  IChatReference,
  BaseError
} from '@/models';
import Composer from '@/components/chat/Composer.vue';
import ModelSelector from '@/components/chat/ModelSelector.vue';
import DesktopAgentManager from '@/components/chat/DesktopAgentManager.vue';
import BYOKBadge from '@/components/chat/BYOKBadge.vue';
import { ERROR_CODE_CANCELED, ERROR_CODE_NOT_APPLIED, ERROR_CODE_UNKNOWN } from '@/constants/errorCode';
import { Status } from '@/models';
import Disclaimer from '@/components/chat/Disclaimer.vue';
import Layout from '@/layouts/Chat.vue';
import { isImageUrl } from '@/utils/is';
import { IChatMessageContentItem } from '@/models';
import { chatOperator, agentOperator } from '@/operators';
import { ElTooltip, ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export interface IData {
  drawer: boolean;
  question: string;
  upload: boolean;
  /**
   * User-attached references (uploaded images / files) for the next
   * outgoing message. Each entry carries the CDN URL plus the original
   * filename so the message bubble can render `report.pdf` instead of
   * the opaque URL. The chat API gets the URLs only — see `onRequest`.
   */
  references: IChatReference[];
  answering: boolean;
  messages: IChatMessage[];
  canceler: AbortController | undefined;
  agentManagerVisible: boolean;
  agentConnected: boolean;
  agentName: string;
  agentToolCount: number;
  agentConnectedAt: string;
  /**
   * Set right before pushing the URL for a freshly-completed chat so the
   * `conversationId` watcher can recognise the change as “already loaded
   * locally” and skip the otherwise-redundant `retrieve` call.
   */
  skipNextRestoreId: string | undefined;
}

export default defineComponent({
  name: 'ChatConversation',
  components: {
    Composer,
    Disclaimer,
    ModelSelector,
    DesktopAgentManager,
    'byok-badge': BYOKBadge,
    Message,
    Layout,
    ElTooltip,
    ElButton,
    FontAwesomeIcon
  },
  data(): IData {
    return {
      drawer: false,
      question: '',
      references: [],
      upload: false,
      answering: false,
      canceler: undefined,
      agentManagerVisible: false,
      agentConnected: false,
      agentName: '',
      agentToolCount: 0,
      agentConnectedAt: '',
      skipNextRestoreId: undefined,
      messages: []
    };
  },
  computed: {
    modelGroup() {
      return this.$store.state.chat.modelGroup;
    },
    model() {
      return this.$store.state.chat.model;
    },
    conversationId(): string | undefined {
      return this.$route.params.id?.toString();
    },
    conversation() {
      return this.$store.state.chat.conversations?.find(
        (conversation: IChatConversation) => conversation.id === this.conversationId
      );
    },
    service() {
      return this.$store.state.chat.service;
    },
    application() {
      return this.$store.state.chat.application;
    },
    applications() {
      return this.$store.state.chat.applications;
    },
    credential() {
      return this.$store.state.chat?.credential;
    },
    needApply() {
      return this.$store.state.chat.status.getApplications === Status.Success && !this.application;
    },
    conversations() {
      return this.$store.state.chat.conversations;
    },
    initializing() {
      return this.$store.state.chat.status.getApplications === Status.Request;
    },
    ready(): boolean {
      // Disable sending until token/application/credential are all initialized,
      // otherwise the first submit races init and hits `You have not applied for this service...`.
      return !this.initializing && !!this.credential?.token && !!this.application;
    }
  },
  watch: {
    async references(val) {
      console.log('references changed', val);
    },
    /**
     * Mirror the unsubmitted composer text into vuex on every
     * keystroke so a route-level remount (clicking ChatGPT in the
     * sidebar while editing a draft on Claude) can pick it back up
     * via ``onConsumePendingDraft`` in the new component instance.
     * Cleared once the message is submitted (see ``onRequest``).
     */
    question(val: string) {
      this.$store.commit('chat/setPendingDraft', val || '');
    },
    async modelGroup(val) {
      console.debug('modelGroup changed', val);
      // Side-panel list is server-filtered by model_group, so any change
      // here forces a refresh. Reset local store first so the panel does
      // not flash the previous group's rows during the round-trip.
      this.$store.commit('chat/setConversations', []);
      await this.$store.dispatch('chat/getConversations');
    },
    // First-mount race: `Main.vue` picks the application & creates the
    // credential in parallel with this component's mount, so any work
    // that needs `credential.token` has to wait for it reactively
    // rather than running in mounted().
    'credential.token': {
      immediate: true,
      async handler(val: string | undefined) {
        if (!val) return;
        if (this.modelGroup?.name) {
          await this.$store.dispatch('chat/getConversations');
        }
        await this.onRestoreCurrentConversation();
        this.onCheckAgentStatus();
      }
    },
    // URL is the source of truth for which conversation is open. Side-
    // panel clicks dispatch onChangeConversation -> router.push -> here.
    async conversationId(val: string | undefined) {
      console.debug('conversationId changed', val);
      if (!val) {
        this.resetConversation();
        return;
      }
      await this.onRestoreCurrentConversation();
    }
  },
  async mounted() {
    await this.onGetService();
    await this.onGetApplication();
    this.onConsumePendingDraft();
    this.onApplyQueryFromUrl();
  },
  methods: {
    resetConversation() {
      this.messages = [];
      this.question = '';
      this.references = [];
    },
    // Idempotent restore for the URL-pinned conversation. Bails on
    // missing token (credential.token watcher will retry), missing :id
    // (new chat), or the skip flag set by `onRequest` after a stream
    // completes (we already have the messages locally).
    async onRestoreCurrentConversation() {
      const id = this.conversationId;
      if (!id || !this.credential?.token) return;
      if (this.skipNextRestoreId === id) {
        this.skipNextRestoreId = undefined;
        return;
      }
      await this.onRestoreConversation(id);
    },
    async onCheckAgentStatus() {
      const token = this.credential?.token;
      if (!token) return;
      try {
        const { data } = await agentOperator.status(token);
        this.agentConnected = data?.connected === true;
        this.agentName = data?.name || '';
        this.agentToolCount = data?.tool_count || 0;
        this.agentConnectedAt = data?.connected_at || '';
      } catch {
        this.agentConnected = false;
      }
    },
    /**
     * Restore the unsubmitted composer draft after a route-level
     * remount (typically: user clicks a different chat group in the
     * sidebar — Claude → ChatGPT). The draft was mirrored into
     * ``store.chat.pendingDraft`` keystroke-by-keystroke by the
     * ``question`` watcher, and lives in-memory only (NOT in
     * ``persist.ts``) so it doesn't leak across browser sessions.
     *
     * Skips when:
     *   - There's a ``:id`` in the route — restoring an existing
     *     chat already populates its own state; the pending draft
     *     belonged to a different (new) conversation.
     *   - The composer is non-empty — preserves anything the user
     *     just started typing in this fresh mount.
     *   - The pending draft is empty.
     */
    onConsumePendingDraft() {
      if (this.conversationId) return;
      if (this.question && this.question.trim().length > 0) return;
      const draft: string | undefined = this.$store.state.chat?.pendingDraft;
      if (!draft) return;
      this.question = draft;
    },
    /**
     * Cross-site entry-point: AuthFrontend's connector "Try It" chips
     * (PR https://github.com/AceDataCloud/AuthFrontend/pull/83) open
     * this page with ``?query=<prompt>`` so the prompt arrives
     * pre-filled in the composer.
     *
     * Behaviour:
     *   - Only fires on a NEW conversation (no `:id` in the route).
     *     A restored conversation already has its own state — we
     *     don't want to clobber the composer mid-edit.
     *   - When ``?query=`` is present we DO override an in-memory
     *     pendingDraft from a prior group, because a fresh
     *     deep-link is the user's most recent intent.
     *   - Does NOT auto-submit. Studio shows the prompt; user reads,
     *     optionally tweaks, presses Enter. This matches the
     *     ChatGPT / Claude suggestion-chip UX and prevents a
     *     refresh-storm of duplicate sends.
     *   - Strips ``query`` (and the cross-site ``user_id`` /
     *     analytics ``source`` / ``connector`` / ``suggestion_id``
     *     params) from the URL via ``router.replace`` so a manual
     *     refresh does not re-prefill the composer with stale text.
     */
    onApplyQueryFromUrl() {
      const raw = this.$route.query?.query;
      const queryStr = Array.isArray(raw) ? raw[0] : raw;
      if (!queryStr || typeof queryStr !== 'string') return;
      if (this.conversationId) return;
      // Override pendingDraft from a stale prior group, but still
      // never clobber a draft the user is actively typing in this
      // mount — same guard as before, only relaxed against the
      // mirrored ``pendingDraft`` (which we want to overwrite when
      // the user explicitly clicked a deep-link).
      if (this.question && this.question.trim().length > 0) {
        const draft: string | undefined = this.$store.state.chat?.pendingDraft;
        const isMirroredDraft = draft != null && this.question === draft;
        if (!isMirroredDraft) return;
      }
      this.question = queryStr;
      // Drop the deep-link params so a refresh / share doesn't replay
      // the prompt. Keep any unrelated query keys the route may carry
      // in the future. ``user_id`` is already stripped by Nexior's
      // crossSiteUser router guard before we get here, but be
      // defensive.
      const STRIP = new Set(['query', 'source', 'suggestion_id', 'connector']);
      const remaining: Record<string, string | string[]> = {};
      for (const [k, v] of Object.entries(this.$route.query || {})) {
        if (STRIP.has(k)) continue;
        if (v == null) continue;
        remaining[k] = v as string | string[];
      }
      // ``replace`` (vs ``push``) so the deep-link entry is replaced
      // by the canonical URL — Back button doesn't bring the user to
      // the prefilled state.
      this.$router.replace({ path: this.$route.path, query: remaining });
    },
    async onGetService() {
      console.debug('start onGetService');
      await this.$store.dispatch('chat/getService');
      console.debug('end onGetService');
    },
    async onGetApplication() {
      console.debug('start onGetApplication');
      await this.$store.dispatch('chat/getApplications');
      console.debug('end onGetApplication');
    },
    async onDraft(question: string) {
      this.question = question;
      this.onSubmit();
    },
    async onStop() {
      if (this.canceler) {
        this.canceler.abort();
        this.answering = false;
      }
    },
    async onRestart(targetMessage: IChatMessage) {
      // 1. Clear the following message
      const targetIndex = this.messages.findIndex((message) => message === targetMessage);
      const problemMessage = this.messages[targetIndex - 1];
      // @ts-ignore
      let updatedMessages = [];
      if (targetIndex !== -1) {
        // @ts-ignore
        updatedMessages = this.messages.slice(0, targetIndex - 1);
        this.messages = this.messages.slice(0, targetIndex);
        this.references = [];
        if (typeof problemMessage.content === 'string') {
          this.question = problemMessage.content;
        } else if (Array.isArray(problemMessage.content)) {
          for (const item of problemMessage.content) {
            if (item.type === 'image_url' || item.type === 'file_url') {
              const ref = item.type === 'image_url' ? item.image_url : item.file_url;
              const url = typeof ref === 'string' ? ref : ref?.url;
              if (url) {
                this.references.push(item.name ? { url, name: item.name } : { url });
              }
            } else if (item.type === 'text' && item.text) {
              this.question = item.text;
            }
          }
        }
      }
      console.debug('onRestart!', this.question, JSON.stringify(this.references));
      // 2. Update the messages
      const token = this.credential?.token;
      const question = this.question.trim();
      // reset question and references
      if (!token || !question) {
        console.error('no token or endpoint or question');
        this.messages.push({
          error: {
            code: ERROR_CODE_NOT_APPLIED
          },
          role: ROLE_ASSISTANT,
          state: IChatMessageState.FAILED
        });
        return;
      }
      let conversationId = this.conversationId;
      chatOperator
        .updateConversation(
          {
            id: this.conversationId,
            // @ts-ignore
            messages: updatedMessages
          },
          {
            token
          }
        )
        .then(async () => {
          await this.$store.dispatch('chat/setConversation', {
            id: conversationId,
            messages: this.messages
          });
          console.debug('finished update conversation', this.messages);
          // 3. Send restart questions
          console.debug('onRestart', this.question);
          await this.onRequest();
        })
        .catch((error) => {
          this.handleRequestError(error);
        });
    },
    async onEdit(targetMessage: IChatMessage, questionValue: string) {
      // 1. Clear the following message
      const targetIndex = this.messages.findIndex((message) => message === targetMessage);
      if (targetIndex !== -1) {
        this.messages = this.messages.slice(0, targetIndex);
      }
      this.question = questionValue;
      // 2. Update the messages
      const token = this.credential?.token;
      // reset question and references
      if (!token) {
        console.error('no token or endpoint or question');
        this.messages.push({
          error: {
            code: ERROR_CODE_NOT_APPLIED
          },
          role: ROLE_ASSISTANT,
          state: IChatMessageState.FAILED
        });
        return;
      }
      let conversationId = this.conversationId;
      chatOperator
        .updateConversation(
          {
            id: this.conversationId,
            messages: this.messages
          },
          {
            token
          }
        )
        .then(async () => {
          await this.$store.dispatch('chat/setConversation', {
            id: conversationId,
            messages: this.messages
          });
          console.debug('finished update conversation', this.messages);
          // 3. Send edited questions
          this.messages.push({
            content: this.question,
            role: ROLE_USER
          });
          console.debug('onEdit', this.question);
          await this.onRequest();
        })
        .catch((error) => {
          this.handleRequestError(error);
        });
    },
    // Build a `/<prefix>/conversations[/<id>]` path from the matched
    // parent route (e.g. `/chatgpt`, `/grok`). We can't use
    // `router.push({ params: { id } })` here because Vue Router 4 keeps
    // the *current* route name on a params-only push — and the new-chat
    // route's path template has no `:id` slot, so the URL silently
    // doesn't change when navigating from /chatgpt/conversations to
    // /chatgpt/conversations/<id> (and vice versa).
    conversationsPath(id?: string): string {
      const prefix = this.$route.matched[0]?.path ?? '';
      return id ? `${prefix}/conversations/${id}` : `${prefix}/conversations`;
    },
    async onNewConversation() {
      // Single-source-of-truth: drive everything off the URL. Pushing
      // the bare `/conversations` path drops the `:id` segment. The
      // `conversationId` watcher then resets messages/question/refs.
      if (this.conversationId) {
        await this.$router.push(this.conversationsPath());
      } else {
        // Already on /chatgpt/conversations — no route change to trigger
        // the watcher, so reset locally.
        this.resetConversation();
      }
    },
    async onRestoreConversation(id: string) {
      console.debug('onRestoreConversation id', id);
      // 1. Pull from store cache, or lazy-fetch full history from aichat2.
      //    Side-panel summaries do NOT include `messages`, so we always
      //    need a `retrieve` call the first time a conversation is opened.
      let conversation: IChatConversation | undefined = this.conversations?.find((c: IChatConversation) => c.id === id);
      if (!conversation || !conversation.messages) {
        const fetched = await this.$store.dispatch('chat/getConversation', id);
        if (fetched) conversation = fetched;
      }
      // 2. Switch model + model group to whatever this conversation used.
      const model = conversation?.model;
      const targetModel = CHAT_MODELS.find((m) => m.name === model);
      const targetModelGroup = CHAT_MODEL_GROUPS.find((g) => g.name === targetModel?.modelGroup);
      if (targetModelGroup) this.$store.dispatch('chat/setModelGroup', targetModelGroup);
      if (targetModel) this.$store.dispatch('chat/setModel', targetModel);
      this.messages = conversation?.messages || [];
      this.onScrollDown();
    },
    async onChangeConversation(id?: string) {
      console.log('onChangeConversation in conversation', id);
      // stop the current request
      await this.onStop();
      // Drive everything off the URL — router push triggers the
      // conversationId watcher which then loads/resets state. This makes
      // back/forward, refresh, and shareable URLs all behave correctly.
      const target = id || '';
      if (target === (this.conversationId || '')) {
        // Same id (or both empty): nothing for the router to do, fall
        // through to the explicit handlers so e.g. clicking "new" while
        // already on a new chat still resets state.
        if (!target) await this.onNewConversation();
        return;
      }
      await this.$router.push(this.conversationsPath(target));
    },
    async onSubmit() {
      if (this.references.length > 0) {
        const content: IChatMessageContentItem[] = [
          {
            type: 'text',
            text: this.question.trim()
          }
        ];
        for (const ref of this.references) {
          // Carry the original filename forward so the chat bubble shows
          // e.g. `report.pdf` instead of the opaque CDN URL
          // (Message.vue reads `item.name` first).
          const item: IChatMessageContentItem = isImageUrl(ref.url)
            ? { type: 'image_url', image_url: ref.url }
            : { type: 'file_url', file_url: ref.url };
          if (ref.name) item.name = ref.name;
          content.push(item);
        }
        this.messages.push({
          content,
          role: ROLE_USER
        });
      } else {
        this.messages.push({
          content: this.question.trim(),
          role: ROLE_USER
        });
      }
      console.debug('onSubmit', this.question, this.references);
      await this.onRequest();
    },
    // Get answers to questions
    async onRequest() {
      console.debug('start to get answer', this.messages);
      const token = this.credential?.token;
      const question = this.question.trim();
      // Wire format only takes URL strings; the names live on the
      // rendered message item via `IChatReference.name`.
      const references = this.references.map((r) => r.url);
      console.debug('validated', question, references);
      // reset question and references
      this.question = '';
      this.references = [];
      if (!token || !question) {
        console.error('no token or endpoint or question');
        this.messages.push({
          error: {
            code: ERROR_CODE_NOT_APPLIED
          },
          role: ROLE_ASSISTANT,
          state: IChatMessageState.FAILED
        });
        return;
      }
      let conversationId = this.conversationId;
      this.messages.push({
        content: '',
        role: ROLE_ASSISTANT,
        state: IChatMessageState.PENDING
      });
      console.debug('start to get answer', this.messages);
      this.onScrollDown();
      // request server to get answer
      this.answering = true;
      this.canceler = new AbortController();
      this._streamAssistantTurn(
        {
          question,
          model: this.model.name,
          references,
          id: this.conversationId,
          stateful: true
        },
        token,
        conversationId
      );
    },
    /**
     * Resume a paused conversation by submitting a tool result for the
     * `ask_user_question` block on the last assistant message. Marks the
     * pending block as `done` locally (so the card collapses immediately
     * to the readonly summary), pushes a fresh pending assistant message,
     * and runs the next streaming turn against `tool_results`.
     */
    async onAnswerAskUserQuestion(payload: { tool_use_id: string; output: string }) {
      const token = this.credential?.token;
      if (!token || !this.conversationId) {
        console.error('cannot resume: no token or no conversation id');
        return;
      }
      // Locally fold the pending block so the card flips to the collapsed
      // summary instantly (the worker will fold its own copy on the resume
      // request — both stay in sync).
      const lastAssistant = [...this.messages].reverse().find((m) => m.role === ROLE_ASSISTANT);
      if (lastAssistant && Array.isArray(lastAssistant.content)) {
        const block = (lastAssistant.content as IChatMessageContentItem[]).find(
          (b) => b.type === 'tool_use' && b.tool_id === payload.tool_use_id
        );
        if (block) {
          block.status = 'done';
          block.output = payload.output;
          delete block.pending_question;
        }
      }
      // Push fresh pending assistant message for the resumed turn.
      this.messages.push({
        content: '',
        role: ROLE_ASSISTANT,
        state: IChatMessageState.PENDING
      });
      this.onScrollDown();
      this.answering = true;
      this.canceler = new AbortController();
      this._streamAssistantTurn(
        {
          id: this.conversationId,
          model: this.model.name,
          stateful: true,
          tool_results: [{ tool_use_id: payload.tool_use_id, output: payload.output }]
        },
        token,
        this.conversationId
      );
    },
    /**
     * Visual-only "skip" of an ask_user_question card. Marks the pending
     * block as done with a sentinel error output so the card collapses
     * locally; no resume request is sent. The next user message they type
     * goes through the worker's "user skipped" branch (see contract §5).
     */
    onSkipAskUserQuestion(payload: { tool_use_id: string }) {
      const lastAssistant = [...this.messages].reverse().find((m) => m.role === ROLE_ASSISTANT);
      if (!lastAssistant || !Array.isArray(lastAssistant.content)) return;
      const block = (lastAssistant.content as IChatMessageContentItem[]).find(
        (b) => b.type === 'tool_use' && b.tool_id === payload.tool_use_id
      );
      if (!block) return;
      block.status = 'done';
      block.is_error = true;
      block.output = block.output || '';
      delete block.pending_question;
    },
    /**
     * Shared SSE-driven assistant-turn streamer. Handles deltas, tool_use,
     * cards, citations, ask_user_question, and final state transitions.
     * Caller is responsible for pushing the pending assistant message,
     * resetting `answering`/`canceler`, and providing the request body.
     */
    _streamAssistantTurn(
      body: Parameters<typeof chatOperator.chatConversation>[0],
      token: string,
      initialConversationId: string | undefined
    ) {
      let conversationId = initialConversationId;
      // Track content parts for tool-calling interleaving
      const contentParts: IChatMessageContentItem[] = [];
      const toolMap = new Map<string, IChatMessageContentItem>();
      let currentText = '';
      // The aichat2 operator emits `response.answer` as the full
      // accumulated text since the start of the turn. Whenever we flush
      // currentText as its own content block (because a tool_use or a
      // card arrives mid-stream and has to land between text segments),
      // bump this offset so the next text_delta only contains the
      // *remaining* text instead of duplicating everything we already
      // pushed.
      let answerOffset = 0;

      chatOperator
        .chatConversation(body, {
          token,
          stream: (response: IChatConversationResponse) => {
            console.debug('stream response', response);
            const lastMessage = this.messages[this.messages.length - 1];

            // Handle tool-calling events
            if (response.type === 'thinking' && response.content) {
              // Streamed chain-of-thought from a reasoning model.
              // Accumulate on the assistant message; rendered above the
              // visible answer by `<thinking-block>` in `Message.vue`.
              const target = this.messages[this.messages.length - 1];
              target.thinking = (target.thinking ?? '') + response.content;
            } else if (response.type === 'tool_use_start' && response.tool_id) {
              // Flush any accumulated text before tool
              if (currentText) {
                contentParts.push({ type: 'text', text: currentText });
                currentText = '';
                answerOffset = response.answer?.length ?? 0;
              }
              const toolItem: IChatMessageContentItem = {
                type: 'tool_use',
                tool_id: response.tool_id,
                tool_name: response.tool_name,
                tool_display_name: response.tool_display_name,
                input: response.input,
                status: 'running'
              };
              contentParts.push(toolItem);
              toolMap.set(response.tool_id, toolItem);
            } else if (response.type === 'tool_result' && response.tool_id) {
              const toolItem = toolMap.get(response.tool_id);
              if (toolItem) {
                toolItem.output = response.output;
                toolItem.is_error = response.is_error;
                toolItem.duration_ms = response.duration_ms;
                toolItem.status = 'done';
                // Strip stale pending_question after fold (defensive — the
                // worker shouldn't emit tool_result for an awaiting block,
                // but if it does, the card must collapse cleanly).
                delete toolItem.pending_question;
              }
            } else if (response.type === 'ask_user_question' && response.tool_id && response.payload) {
              // Worker pauses the turn for a user reply. Find the matching
              // tool_use block on the in-flight assistant message and flip
              // it to `awaiting_input`; the renderer will swap in
              // <AskUserQuestionCard>. SSE then ends with terminal_reason
              // 'awaiting_user_input'.
              const toolItem = toolMap.get(response.tool_id);
              if (toolItem) {
                toolItem.status = 'awaiting_input';
                toolItem.pending_question = response.payload;
              }
            } else if (response.type === 'artifact' && response.artifact) {
              if (response.artifact.type === 'image' || response.artifact.mimeType?.startsWith('image/')) {
                contentParts.push({
                  type: 'image_url',
                  image_url: response.artifact.url,
                  name: response.artifact.name,
                  mimeType: response.artifact.mimeType
                });
              } else {
                contentParts.push({
                  type: 'file_url',
                  file_url: response.artifact.url,
                  name: response.artifact.name,
                  mimeType: response.artifact.mimeType
                });
              }
            } else if (response.type === 'card' && response.card) {
              // Rich-output entity card from the worker's <acard> stream
              // parser. Flush any text we'd accumulated up to this
              // point as its own block first so the card lands at the
              // right position in the message; this mirrors how
              // tool_use blocks bracket the text stream.
              if (currentText) {
                contentParts.push({ type: 'text', text: currentText });
                currentText = '';
                answerOffset = response.answer?.length ?? 0;
              }
              contentParts.push({ type: 'card', card: response.card });
            } else if (response.type === 'citation' && response.citation) {
              // Source citation footnote from the worker's <acite>
              // stream parser. Unlike `card`, citations DO NOT split
              // the text stream — the worker injected a stable marker
              // token `[^acite:<id>]` into the text where the chip
              // should land, so we just stash the metadata on the
              // assistant message's sidecar `citations` map. The
              // markdown renderer pairs marker → metadata at render
              // time. Last-write-wins on duplicate ids matches the
              // worker's semantics (the model is taught to reuse the
              // same id for the same source).
              const target = this.messages[this.messages.length - 1];
              target.citations = { ...(target.citations ?? {}), [response.citation.id]: response.citation };
            } else if (response.delta_answer) {
              currentText = (response.answer || '').slice(answerOffset);
            }

            // Build display content: parts + trailing text
            const displayParts: IChatMessageContentItem[] = [...contentParts];
            if (currentText) {
              displayParts.push({ type: 'text', text: currentText });
            }

            if (displayParts.length > 0) {
              this.messages[this.messages.length - 1] = {
                role: ROLE_ASSISTANT,
                content: displayParts,
                thinking: lastMessage?.thinking,
                citations: lastMessage?.citations,
                state:
                  lastMessage?.state !== IChatMessageState.FINISHED ? IChatMessageState.ANSWERING : lastMessage?.state
              };
            } else {
              this.messages[this.messages.length - 1] = {
                role: ROLE_ASSISTANT,
                content: response.answer,
                thinking: lastMessage?.thinking,
                citations: lastMessage?.citations,
                state:
                  lastMessage?.state !== IChatMessageState.FINISHED ? IChatMessageState.ANSWERING : lastMessage?.state
              };
            }
            conversationId = response?.id;
          },
          signal: this.canceler!.signal
        })
        .then(async () => {
          console.debug('finished fetch answer', this.messages);
          this.messages[this.messages.length - 1].state = IChatMessageState.FINISHED;
          console.debug('finished fetch answer', JSON.stringify(this.messages));
          await this.$store.dispatch('chat/setConversation', {
            id: conversationId,
            messages: this.messages
          });
          this.answering = false;
          if (conversationId) {
            this.skipNextRestoreId = conversationId;
            await this.$router.push(this.conversationsPath(conversationId));
          }
          this.onScrollDown();
          await this.$store.dispatch('chat/getConversations');
          await this.$store.dispatch('chat/getApplications');
        })
        .catch((error) => {
          this.handleRequestError(error);
        });
    },
    async handleRequestError(error: any) {
      console.error('error happened', error);
      if (this.messages && this.messages.length > 0) {
        this.messages[this.messages.length - 1].state = IChatMessageState.FAILED;
      }
      if (error.name === 'AbortError') {
        console.error('aborted');
        return;
      } else if (error instanceof BaseError) {
        console.debug('BaseError', error);
        this.messages[this.messages.length - 1].error = {
          code: error.code,
          message: error.detail
        };
      } else if (axios.isCancel(error)) {
        this.messages[this.messages.length - 1].error = {
          code: ERROR_CODE_CANCELED
        };
      } else {
        if (this.messages && this.messages.length > 0) {
          this.messages[this.messages.length - 1].error = {
            code: ERROR_CODE_UNKNOWN
          };
        }
      }
      this.answering = false;
    },
    // Swipe the message to the bottom
    async onScrollDown() {
      setTimeout(() => {
        const container = document.querySelector('.messages') as HTMLDivElement;
        if (!container || !this.messages || this.messages.length === 0) {
          return;
        }
        container.scrollTop = container?.scrollHeight;
      }, 0);
    }
  }
});
</script>

<style lang="scss" scoped>
.toolbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 100;
}

.selector {
  width: max-content;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.byok-badge {
  flex-shrink: 0;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.toolbar-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  color: var(--el-text-color-secondary);
  padding: 6px 10px;
  height: 32px;
  line-height: 1;

  &:hover {
    color: var(--el-color-primary);
  }

  .agent-dot {
    position: absolute;
    top: 2px;
    right: -2px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--el-color-success);
  }

  .external-icon {
    font-size: 9px;
    opacity: 0.55;
    margin-left: -2px;
  }
}
@media (max-width: 767px) {
  .setting {
    display: none;
  }
}

.dialogue {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  position: relative;
  .disclaimer {
    width: 100%;
    text-align: center;
    font-size: 12px;
    margin: 10px 0 8px;
    color: var(--el-text-color-secondary);
  }
  &.empty {
    position: relative;
    .starter {
      position: absolute;
      width: 100%;
      max-width: 920px;
      top: 52%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 0 16px;
    }
  }
  .messages {
    padding: 12px calc(50% - 400px) 0;
    flex: 1;
    overflow-y: auto;
    @media (max-width: 1159px) {
      width: 100%;
      padding: 12px 12px 0;
    }
    .message {
      margin-bottom: 15px;
    }
  }
  .starter {
    height: fit-content;
    overflow: hidden;
    padding: 0 calc(50% - 400px) 8px;
    @media (max-width: 1159px) {
      width: 100%;
      padding: 0 12px 8px;
    }
  }
}

.bottom {
  width: 100%;
}

@media (max-width: 767px) {
  .toolbar {
    padding: 0 8px 0 54px;
  }

  .toolbar-actions {
    margin-right: 36px;
  }

  .dialogue.empty .starter {
    top: 55%;
  }
}
</style>
