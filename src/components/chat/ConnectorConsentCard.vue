<template>
  <div class="connector-consent-card" :class="{ 'is-resolved': resolved }">
    <div class="ccc-header">
      <font-awesome-icon icon="fa-solid fa-shield-halved" class="header-icon" />
      <span class="header-title">{{ $t('chat.consent.title') }}</span>
    </div>
    <p v-if="payload.rationale" class="ccc-rationale">{{ payload.rationale }}</p>

    <div
      v-for="req in requirements"
      :key="req.requirement_index"
      class="ccc-requirement"
      :class="{ 'is-satisfied': req.satisfied }"
    >
      <div v-if="showMatchLabel(req)" class="ccc-req-match">
        {{ req.match === 'any' ? $t('chat.consent.matchAny') : $t('chat.consent.matchAll') }}
      </div>
      <ConnectorEntryRow
        v-for="entry in req.entries"
        :key="entry.connector"
        :entry="entry"
        :disabled="resolved"
        @authorize="onAuthorize"
      />
    </div>

    <div v-if="!resolved && hasUnsatisfied" class="ccc-actions">
      <el-button text @click="onSkip">
        {{ $t('chat.consent.skip') }}
      </el-button>
    </div>

    <div v-if="resolved" class="ccc-resolved-banner">
      {{ resolvedSummary }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import type { IConsentRequestEntry, IConsentRequestPayload, IConsentRequestRequirement } from '@/models';
import ConnectorEntryRow from './ConnectorEntryRow.vue';
import { buildConsentOutput, unsatisfiedConnectors } from './connectorConsent';

interface IData {
  resolvedAuthorized: string[];
  resolvedSkipped: string[];
}

export default defineComponent({
  name: 'ConnectorConsentCard',
  components: { ConnectorEntryRow, ElButton, FontAwesomeIcon },
  props: {
    /** Tool-use block id; sent back as `tool_use_id` on resume. */
    toolUseId: {
      type: String,
      required: true
    },
    payload: {
      type: Object as PropType<IConsentRequestPayload>,
      required: true
    },
    /**
     * When `true`, render the read-only resolved view. `previousOutput`
     * (the JSON string the user submitted previously) MUST be provided so
     * the card can show what was authorized vs skipped.
     */
    resolved: {
      type: Boolean,
      default: false
    },
    previousOutput: {
      type: String,
      default: ''
    }
  },
  emits: ['submit', 'authorize'],
  data(): IData {
    return {
      resolvedAuthorized: [],
      resolvedSkipped: []
    };
  },
  computed: {
    requirements(): IConsentRequestRequirement[] {
      return this.payload?.requirements ?? [];
    },
    hasUnsatisfied(): boolean {
      return this.requirements.some((r) => !r.satisfied);
    },
    resolvedSummary(): string {
      if (this.resolvedAuthorized.length > 0) {
        return this.$t('chat.consent.resolvedAuthorized', {
          list: this.resolvedAuthorized.join(', ')
        }) as string;
      }
      return this.$t('chat.consent.resolvedSkipped') as string;
    }
  },
  watch: {
    resolved: {
      immediate: true,
      handler(val: boolean) {
        if (val) this.parsePreviousOutput();
      }
    },
    previousOutput: {
      immediate: false,
      handler() {
        if (this.resolved) this.parsePreviousOutput();
      }
    }
  },
  methods: {
    showMatchLabel(req: IConsentRequestRequirement): boolean {
      // Only meaningful when there are 2+ candidates AND the requirement
      // hasn't been auto-satisfied (one connected entry hides the
      // "either of these" prompt).
      return req.entries.length > 1 && !req.satisfied;
    },
    onAuthorize(entry: IConsentRequestEntry) {
      // PR-6 wires the OAuth return path. For now the parent decides what
      // happens — typically `window.open(entry.install_url, '_blank')`.
      this.$emit('authorize', { tool_use_id: this.toolUseId, entry });
    },
    onSkip() {
      const skipped = unsatisfiedConnectors(this.payload);
      const output = buildConsentOutput(this.payload, [], skipped);
      this.$emit('submit', { tool_use_id: this.toolUseId, output });
    },
    parsePreviousOutput() {
      this.resolvedAuthorized = [];
      this.resolvedSkipped = [];
      if (!this.previousOutput) return;
      try {
        const parsed = JSON.parse(this.previousOutput) as {
          authorized?: unknown;
          skipped?: unknown;
        };
        if (Array.isArray(parsed.authorized)) {
          this.resolvedAuthorized = parsed.authorized.filter((x): x is string => typeof x === 'string');
        }
        if (Array.isArray(parsed.skipped)) {
          this.resolvedSkipped = parsed.skipped.filter((x): x is string => typeof x === 'string');
        }
      } catch {
        // Output isn't valid JSON; fall back to the generic "skipped" copy.
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.connector-consent-card {
  margin: 8px 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: var(--el-bg-color);
  padding: 16px 18px 14px;
  font-size: 14px;
  max-width: 100%;
  box-shadow:
    0 4px 16px -8px rgba(0, 0, 0, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.04);
  animation: consentEnter 280ms cubic-bezier(0.16, 1, 0.3, 1);
}

.connector-consent-card.is-resolved {
  background: var(--el-fill-color-light);
  box-shadow: none;
  animation: none;
}

@keyframes consentEnter {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.ccc-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
}

.header-icon {
  color: var(--el-color-primary);
  font-size: 16px;
}

.header-title {
  font-size: 15px;
  letter-spacing: 0.01em;
}

.ccc-rationale {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
}

.ccc-requirement {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 0;
  border-top: 1px solid var(--el-border-color-lighter);

  &:first-of-type {
    border-top: none;
    padding-top: 4px;
  }
}

.ccc-req-match {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.ccc-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.ccc-resolved-banner {
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--el-color-info-light-9);
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.5;
}
</style>
