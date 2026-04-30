<template>
  <layout @change-conversation="onChangeConversation($event)">
    <template #chat>
      <div class="toolbar">
        <model-selector class="selector" @model-group-changed="onChangeConversation(undefined)" />
        <div class="toolbar-actions">
          <el-tooltip v-if="false" :content="$t('chat.agent.tooltip')" placement="bottom">
            <el-button class="toolbar-btn" text @click="agentManagerVisible = true">
              <font-awesome-icon icon="fa-solid fa-desktop" />
              <span v-if="agentConnected" class="agent-dot"></span>
            </el-button>
          </el-tooltip>
          <el-tooltip :content="$t('chat.skill.tooltip')" placement="bottom">
            <el-button
              :class="['toolbar-btn', { active: activeSkillCount > 0 }]"
              text
              @click="skillManagerVisible = true"
            >
              <font-awesome-icon icon="fa-solid fa-wand-magic-sparkles" />
              <span v-if="activeSkillCount > 0" class="toolbar-count">{{ Math.min(activeSkillCount, 9) }}</span>
            </el-button>
          </el-tooltip>
          <el-tooltip :content="$t('chat.mcp.tooltip')" placement="bottom">
            <el-button :class="['toolbar-btn', { active: enabledMcpCount > 0 }]" text @click="mcpManagerVisible = true">
              <font-awesome-icon icon="fa-solid fa-cubes-stacked" />
              <span v-if="enabledMcpCount > 0" class="toolbar-count">{{ Math.min(enabledMcpCount, 9) }}</span>
            </el-button>
          </el-tooltip>
          <el-tooltip
            v-if="hasConnectorProviders || presetConnections.length > 0"
            :content="$t('chat.connector.tooltip')"
            placement="bottom"
          >
            <el-button
              :class="['toolbar-btn', { active: enabledConnectorCount > 0 }]"
              text
              @click="connectorManagerVisible = true"
            >
              <font-awesome-icon icon="fa-solid fa-plug" />
              <span v-if="enabledConnectorCount > 0" class="toolbar-count">{{
                Math.min(enabledConnectorCount, 9)
              }}</span>
            </el-button>
          </el-tooltip>
        </div>
      </div>
      <mcp-manager
        v-if="mcpManagerVisible"
        v-model="mcpManagerVisible"
        :auth-connections="customOauthConnections"
        :enabled-connection-ids="enabledConnectionIds"
        @change="onMcpChange"
        @update:enabled-connection-ids="onUpdateEnabledConnectionIds"
        @refresh-connections="onLoadAuthConnections"
      />
      <connector-manager
        v-if="connectorManagerVisible"
        v-model="connectorManagerVisible"
        :auth-connections="presetConnections"
        :enabled-connection-ids="enabledConnectionIds"
        @change="onConnectorChange"
        @update:enabled-connection-ids="onUpdateEnabledConnectionIds"
        @refresh-connections="onLoadAuthConnections"
      />
      <skill-manager
        v-if="skillManagerVisible"
        v-model="skillManagerVisible"
        :active-skills="activeSkills"
        :token="credential?.token"
        @change="onSkillChange"
      />
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
import { IChatMessageState, IChatConversationResponse, IChatConversation, IChatMessage, BaseError } from '@/models';
import Composer from '@/components/chat/Composer.vue';
import ModelSelector from '@/components/chat/ModelSelector.vue';
import McpManager from '@/components/chat/McpManager.vue';
import ConnectorManager from '@/components/chat/ConnectorManager.vue';
import SkillManager from '@/components/chat/SkillManager.vue';
import DesktopAgentManager from '@/components/chat/DesktopAgentManager.vue';
import { ERROR_CODE_CANCELED, ERROR_CODE_NOT_APPLIED, ERROR_CODE_UNKNOWN } from '@/constants/errorCode';
import { Status } from '@/models';
import Disclaimer from '@/components/chat/Disclaimer.vue';
import Layout from '@/layouts/Chat.vue';
import { isImageUrl } from '@/utils/is';
import { IChatMessageContentItem, IMcpServer, IConnector, IConnection } from '@/models';
import { chatOperator, mcpServerOperator, connectorOperator, agentOperator, connectionOperator } from '@/operators';
import { ElTooltip, ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export interface IData {
  drawer: boolean;
  question: string;
  upload: boolean;
  references: string[];
  answering: boolean;
  messages: IChatMessage[];
  canceler: AbortController | undefined;
  mcpManagerVisible: boolean;
  mcpServers: IMcpServer[];
  connectorManagerVisible: boolean;
  connectors: IConnector[];
  hasConnectorProviders: boolean;
  authConnections: IConnection[];
  enabledConnectionIds: string[];
  skillManagerVisible: boolean;
  activeSkills: string[];
  agentManagerVisible: boolean;
  agentConnected: boolean;
  agentName: string;
  agentToolCount: number;
  agentConnectedAt: string;
}

export default defineComponent({
  name: 'ChatConversation',
  components: {
    Composer,
    Disclaimer,
    ModelSelector,
    McpManager,
    ConnectorManager,
    SkillManager,
    DesktopAgentManager,
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
      mcpManagerVisible: false,
      mcpServers: [] as IMcpServer[],
      connectorManagerVisible: false,
      connectors: [] as IConnector[],
      hasConnectorProviders: false,
      authConnections: [] as IConnection[],
      enabledConnectionIds: [] as string[],
      skillManagerVisible: false,
      activeSkills: [] as string[],
      agentManagerVisible: false,
      agentConnected: false,
      agentName: '',
      agentToolCount: 0,
      agentConnectedAt: '',
      messages:
        this.$store.state.chat.conversations?.find(
          (conversation: IChatConversation) => conversation.id === this.$route.params.id?.toString()
        )?.messages || []
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
    },
    enabledMcpCount(): number {
      const local = this.mcpServers.filter((s: IMcpServer) => s.is_enabled).length;
      const remote = this.customOauthConnections.filter((c) => this.enabledConnectionIds.includes(c.id)).length;
      return local + remote;
    },
    enabledMcpIds(): string[] {
      const local = this.mcpServers.filter((s: IMcpServer) => s.is_enabled).map((s: IMcpServer) => s.id);
      const remote = this.customOauthConnections
        .filter((c) => this.enabledConnectionIds.includes(c.id))
        .map((c) => c.id);
      return Array.from(new Set([...local, ...remote]));
    },
    enabledConnectorCount(): number {
      const legacy = this.connectors.filter((c: IConnector) => c.is_enabled).length;
      const remote = this.presetConnections.filter((c) => this.enabledConnectionIds.includes(c.id)).length;
      return legacy + remote;
    },
    enabledConnectorProviders(): string[] {
      const legacy = this.connectors.filter((c: IConnector) => c.is_enabled).map((c: IConnector) => c.provider);
      const remote = this.presetConnections
        .filter((c) => this.enabledConnectionIds.includes(c.id))
        .map((c) => c.provider);
      return Array.from(new Set([...legacy, ...remote]));
    },
    customOauthConnections(): IConnection[] {
      return this.authConnections.filter((c) => c.kind === 'custom_oauth');
    },
    presetConnections(): IConnection[] {
      return this.authConnections.filter((c) => c.kind === 'preset');
    },
    activeSkillCount(): number {
      return this.activeSkills.length;
    }
  },
  watch: {
    async references(val) {
      console.log('references changed', val);
    },
    async modelGroup(val) {
      console.debug('modelGroup changed', val);
    },
    async conversationId(val) {
      console.debug('conversationId changed', val);
    }
  },
  async mounted() {
    await this.onGetService();
    await this.onGetApplication();
    await this.onGetConversations();
    await this.onLoadMcpServers();
    await this.onLoadConnectors();
    await this.onLoadAuthConnections();
    this.onLoadEnabledConnectionIds();
    this.onLoadPersistedSkills();
    this.onCheckAgentStatus();
  },
  methods: {
    async onLoadMcpServers() {
      const token = this.credential?.token;
      if (!token) return;
      try {
        const { data } = await mcpServerOperator.list(token);
        this.mcpServers = data.items || [];
      } catch {
        // silently fail - MCP is optional
      }
    },
    async onMcpChange() {
      await this.onLoadMcpServers();
    },
    async onLoadConnectors() {
      const token = this.credential?.token;
      if (!token) return;
      try {
        const [connectorsRes, providersRes] = await Promise.all([
          connectorOperator.list(token),
          connectorOperator.listProviders(token)
        ]);
        this.connectors = connectorsRes.data.items || [];
        this.hasConnectorProviders = (providersRes.data.providers || []).length > 0;
      } catch {
        // silently fail - connectors are optional
      }
    },
    async onConnectorChange() {
      await this.onLoadConnectors();
    },
    async onLoadAuthConnections() {
      try {
        const { data } = await connectionOperator.list();
        this.authConnections = data.items || [];
      } catch {
        // silently fail - the user might not have any connections yet,
        // or auth.acedata.cloud might be unreachable. Either way the
        // chat still works without them.
      }
    },
    onLoadEnabledConnectionIds() {
      try {
        const stored = localStorage.getItem('chat_enabled_connection_ids');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            this.enabledConnectionIds = parsed.filter((x): x is string => typeof x === 'string');
          }
        }
      } catch {
        // ignore corrupt localStorage
      }
    },
    onUpdateEnabledConnectionIds(ids: string[]) {
      this.enabledConnectionIds = ids;
      try {
        localStorage.setItem('chat_enabled_connection_ids', JSON.stringify(ids));
      } catch {
        // ignore quota errors
      }
    },
    onLoadPersistedSkills() {
      try {
        const stored = localStorage.getItem('chat_active_skills');
        if (stored) {
          this.activeSkills = JSON.parse(stored);
        }
      } catch {
        // ignore
      }
    },
    onSkillChange(skills: string[]) {
      this.activeSkills = skills;
      localStorage.setItem('chat_active_skills', JSON.stringify(skills));
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
    async onGetConversations() {
      console.debug('start onGetConversations');
      await this.$store.dispatch('chat/getConversations');
      console.debug('end onGetConversations');
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
        // @ts-ignore
        this.references = [];
        if (typeof problemMessage.content === 'string') {
          this.question = problemMessage.content;
        } else if (Array.isArray(problemMessage.content)) {
          for (let i = 0; i < problemMessage?.content.length; i++) {
            if (problemMessage.content[i].type === 'image_url') {
              if (typeof problemMessage?.content?.[i]?.image_url === 'string') {
                // @ts-ignore
                this.references.push(problemMessage?.content?.[i]?.image_url);
              } else {
                // @ts-ignore
                this.references.push(problemMessage?.content?.[i]?.image_url?.url);
              }
            }
            if (problemMessage.content[i].type === 'file_url') {
              if (typeof problemMessage?.content?.[i]?.file_url === 'string') {
                // @ts-ignore
                this.references.push(problemMessage?.content?.[i]?.file_url);
              } else {
                // @ts-ignore
                this.references.push(problemMessage?.content?.[i]?.file_url?.url);
              }
            }
            if (problemMessage.content[i].type === 'text') {
              // @ts-ignore
              this.question = problemMessage.content[i].text;
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
    async onNewConversation() {
      this.$router.push({
        params: {
          id: ''
        }
      });
      this.messages = [];
      this.question = '';
      this.references = [];
    },
    async onRestoreConversation(id: string) {
      console.debug('onRestoreConversation id', id);
      const conversation = this.conversations?.find((conversation: IChatConversation) => conversation.id === id);
      // change the model and model group
      const model = conversation?.model;
      console.debug('conversation model', model);
      const targetModel = CHAT_MODELS.find((m) => m.name === model);
      console.debug('target model', targetModel);
      const targetModelGroup = CHAT_MODEL_GROUPS.find((g) => g.name === targetModel?.modelGroup);
      console.debug('target model group', targetModelGroup);
      this.$store.dispatch('chat/setModelGroup', targetModelGroup);
      this.$store.dispatch('chat/setModel', targetModel);
      console.debug('conversation', conversation);
      console.debug('conversation messages', this.messages);
      this.messages = conversation?.messages || [];
      this.onScrollDown();
    },
    async onChangeConversation(id?: string) {
      console.log('onChangeConversation in conversation', id);
      // stop the current request
      await this.onStop();
      // if id is undefined, create a new conversation
      if (!id) {
        this.onNewConversation();
      } else {
        this.onRestoreConversation(id);
      }
    },
    async onSubmit() {
      if (this.references.length > 0) {
        let content = [];
        content.push({
          type: 'text',
          text: this.question.trim()
        });
        for (let i = 0; i < this.references.length; i++) {
          if (isImageUrl(this.references[i])) {
            content.push({
              type: 'image_url',
              image_url: this.references[i]
            });
          } else {
            content.push({
              type: 'file_url',
              file_url: this.references[i]
            });
          }
        }
        this.messages.push({
          // @ts-ignore
          content: content,
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
      const references = this.references;
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
      // Track content parts for tool-calling interleaving
      const contentParts: IChatMessageContentItem[] = [];
      const toolMap = new Map<string, IChatMessageContentItem>();
      let currentText = '';

      chatOperator
        .chatConversation(
          {
            question,
            model: this.model.name,
            references,
            id: this.conversationId,
            stateful: true,
            tools_enabled: true,
            mcp_servers: this.enabledMcpIds.length > 0 ? this.enabledMcpIds : undefined,
            connectors: this.enabledConnectorProviders.length > 0 ? this.enabledConnectorProviders : undefined,
            skills: this.activeSkills.length > 0 ? this.activeSkills : undefined
          },
          {
            token,
            stream: (response: IChatConversationResponse) => {
              console.debug('stream response', response);
              const lastMessage = this.messages[this.messages.length - 1];

              // Handle tool-calling events
              if (response.type === 'tool_use_start' && response.tool_id) {
                // Flush any accumulated text before tool
                if (currentText) {
                  contentParts.push({ type: 'text', text: currentText });
                  currentText = '';
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
              } else if (response.delta_answer) {
                currentText = response.answer;
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
                  state:
                    lastMessage?.state !== IChatMessageState.FINISHED ? IChatMessageState.ANSWERING : lastMessage?.state
                };
              } else {
                this.messages[this.messages.length - 1] = {
                  role: ROLE_ASSISTANT,
                  content: response.answer,
                  state:
                    lastMessage?.state !== IChatMessageState.FINISHED ? IChatMessageState.ANSWERING : lastMessage?.state
                };
              }
              conversationId = response?.id;
            },
            signal: this.canceler.signal
          }
        )
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
            await this.$router.push({
              params: {
                id: conversationId
              }
            });
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

  &.active {
    color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
  }

  .toolbar-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    padding: 0 5px;
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
    color: #fff;
    background-color: var(--el-color-primary);
    border-radius: 9999px;
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
