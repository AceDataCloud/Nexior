<template>
  <div class="markdown-with-citations">
    <vue-markdown
      v-highlight
      :source="enrichedContent"
      class="markdown-body bg-transparent pt-[3px] text-[inherit]"
      @mouseover="onChipHover"
      @mouseleave="onChipLeave"
    />
    <!-- Single shared popover instance, virtually anchored to the
         chip the cursor is currently on. Cheaper than spawning one
         popover per chip on long answers; also avoids fighting the
         markdown renderer (which produces plain HTML, not Vue nodes). -->
    <el-popover
      v-if="hoveredCitation && popoverAnchor"
      :virtual-ref="popoverAnchor"
      virtual-triggering
      trigger="hover"
      :visible="popoverVisible"
      placement="top"
      :width="340"
      popper-class="citation-popover"
      :show-arrow="true"
      :hide-after="120"
    >
      <citation-card :citation="hoveredCitation" />
    </el-popover>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { ElPopover } from 'element-plus';
import VueMarkdown from './VueMarkdown.vue';
import CitationCard from '@/components/chat/CitationCard.vue';
import { highlight } from '@/utils';
import type { IChatCitation } from '@/models';
import 'highlight.js/styles/night-owl.css';

/**
 * Marker token the worker injects in place of every `<acite>` tag. We
 * substitute it for an inline name-tag chip BEFORE handing the source
 * to the markdown renderer so the chip lives at exactly the position
 * the model wanted it. The id charset matches the worker's parser
 * (`tagParser.ts`'s `parseAciteTag`) so a marker that survives
 * upstream round-trips through here losslessly.
 */
const CITATION_MARKER = /\[\^acite:([A-Za-z0-9_-]{1,32})\]/g;

interface IData {
  hoveredCitation: IChatCitation | null;
  popoverAnchor: HTMLElement | null;
  popoverVisible: boolean;
}

export default defineComponent({
  name: 'MarkdownRenderer',
  directives: {
    highlight
  },
  components: {
    VueMarkdown,
    CitationCard,
    ElPopover
  },
  props: {
    content: {
      type: String,
      required: false,
      default: ''
    },
    /**
     * Sidecar map of citations referenced by `[^acite:<id>]` markers
     * inside `content`. Streamed onto the assistant message by
     * `Conversation.vue` and persisted on `IChatMessage.citations` so
     * reload re-renders the same chips. Markers WITHOUT a matching
     * entry are suppressed entirely (rendered as a 0-width span) —
     * this prevents the brief "[?]"-then-"[Google Drive]" flicker that
     * was visible when the SSE stream delivered the text delta one
     * tick before the citation event.
     */
    citations: {
      type: Object as PropType<Record<string, IChatCitation>>,
      required: false,
      default: () => ({})
    }
  },
  data(): IData {
    return {
      hoveredCitation: null,
      popoverAnchor: null,
      popoverVisible: false
    };
  },
  computed: {
    /** `content` with every marker swapped for an inline chip HTML. */
    enrichedContent(): string {
      const src = this.content || '';
      if (!src.includes('[^acite:')) return src;
      const cites = this.citations || {};
      return src.replace(CITATION_MARKER, (_match, rawId: string) => {
        const cite = cites[rawId];
        // No metadata yet — suppress the chip entirely. Once the
        // citation SSE event lands, Vue re-renders this computed and
        // the chip pops in. Beats showing "[?]" or raw "[acite:1]" in
        // the meantime.
        if (!cite) return '';

        const label = labelFor(cite);
        const url = cite.url ? escapeAttr(cite.url) : '';
        const titleAttr = escapeAttr(cite.title || cite.source || cite.url || rawId);
        const idAttr = escapeAttr(rawId);
        const favicon = faviconUrl(cite);
        const iconHtml = favicon
          ? `<img class="citation-chip__icon" src="${escapeAttr(favicon)}" alt="" referrerpolicy="no-referrer" loading="lazy" />`
          : '';
        // The chip itself is an anchor so click works without JS, even
        // when the popover is suppressed (touch / no-hover devices).
        // `data-citation-id` is what `onChipHover` reads for the popover.
        const inner = `<a class="citation-chip__link"${url ? ` href="${url}"` : ''} target="_blank" rel="noopener noreferrer" tabindex="-1">${iconHtml}<span class="citation-chip__label">${escapeAttr(label)}</span></a>`;
        return `<span class="citation-chip" data-citation-id="${idAttr}" title="${titleAttr}">${inner}</span>`;
      });
    }
  },
  methods: {
    /**
     * Single delegated mouseover handler for every chip rendered inside
     * the markdown body. Looks up the metadata in `citations`, sets the
     * hover state, and points the shared `<el-popover>` at the chip via
     * Element Plus' `virtual-ref` trigger. Dramatically lighter than
     * spawning one popover per chip on a 30-citation answer.
     */
    onChipHover(event: MouseEvent): void {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const chip = target.closest<HTMLElement>('.citation-chip');
      if (!chip) {
        this.popoverVisible = false;
        return;
      }
      const id = chip.dataset.citationId;
      if (!id) return;
      const cite = (this.citations || {})[id];
      if (!cite) return;
      this.hoveredCitation = cite;
      this.popoverAnchor = chip;
      this.popoverVisible = true;
    },
    onChipLeave(): void {
      this.popoverVisible = false;
    }
  }
});

/**
 * Pick the human-readable tag label. Order of preference:
 *   1. `source` ("Google Drive", "GitHub", "Notion") — short, branded,
 *      what the model meant.
 *   2. URL hostname stripped of `www.` — "openai.com", "wikipedia.org".
 *   3. Truncated `title` — last-resort, may be long.
 * Truncated to 24 chars to keep the chip from breaking wrapping
 * behaviour on narrow lines.
 */
function labelFor(c: IChatCitation): string {
  const raw =
    c.source ||
    (() => {
      try {
        return new URL(c.url).host.replace(/^www\./, '');
      } catch {
        return '';
      }
    })() ||
    c.title ||
    'source';
  return raw.length > 24 ? raw.slice(0, 23) + '\u2026' : raw;
}

/**
 * Resolve the inline favicon URL for a chip. Preference:
 *   1. Citation-supplied `icon` (the model can specify a brand logo).
 *   2. Google's S2 favicon CDN keyed by the URL host (free, public,
 *      no signup, returns a transparent fallback for unknown sites).
 * Empty string when the URL is unparseable — the chip just won't show
 * an icon, which is fine.
 */
function faviconUrl(c: IChatCitation): string {
  if (c.icon) return c.icon;
  try {
    const host = new URL(c.url).host;
    if (!host) return '';
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
  } catch {
    return '';
  }
}

/** Tiny attribute-context HTML escape — enough for our chip output. */
function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
</script>

<style lang="scss">
@import 'github-markdown-css/github-markdown.css';

/* Element Plus mounts the popover content under document.body, so the
   styles MUST be unscoped to apply. Kept narrow to `.citation-popover`
   to avoid leaking into other popovers. */
.el-popover.citation-popover {
  padding: 0 !important;
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow:
    0 10px 32px rgba(15, 23, 42, 0.14),
    0 2px 6px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(15, 23, 42, 0.06) !important;
}

@media (prefers-color-scheme: dark) {
  .el-popover.citation-popover {
    background: #1f2937 !important;
    border-color: rgba(255, 255, 255, 0.06) !important;
    box-shadow:
      0 10px 32px rgba(0, 0, 0, 0.45),
      0 2px 6px rgba(0, 0, 0, 0.3);
  }
}
</style>

<style lang="scss" scoped>
.markdown-with-citations {
  position: relative;
}

.markdown-body {
  ol {
    list-style: initial;
  }

  pre code {
    color: white;
  }

  /* Inline citation chip rendered in place of `[^acite:<id>]` markers.
     Pill-shaped name tag (e.g. `Google Drive`) instead of a numeric
     `[1]` superscript — readers can tell at a glance what backed the
     claim without hovering. Sits on the text baseline (no superscript
     vertical-shift) so chips embedded in table cells / list items
     don't push their row taller than its neighbours. */
  :deep(.citation-chip) {
    display: inline-block;
    margin: 0 2px;
    padding: 0;
    line-height: 1;
    user-select: none;
    /* Prevent the chip's contents from getting split across two lines
       — happens when a label is long and the chip lands at a line
       boundary. The label itself is already truncated to 24 chars. */
    white-space: nowrap;
    vertical-align: -1px;

    .citation-chip__link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      height: 18px;
      padding: 0 8px 0 6px;
      border-radius: 999px;
      background: rgba(39, 113, 134, 0.1);
      color: #1f5a6b;
      font-size: 0.78em;
      font-weight: 500;
      text-decoration: none;
      transition:
        background 0.15s ease,
        color 0.15s ease,
        transform 0.15s ease;

      &:hover {
        background: rgba(39, 113, 134, 0.18);
        color: #144859;
        text-decoration: none;
        transform: translateY(-0.5px);
      }
    }

    .citation-chip__icon {
      width: 12px;
      height: 12px;
      flex: 0 0 12px;
      object-fit: contain;
      border-radius: 2px;
      /* Hide broken-icon glyph if the favicon CDN 404s (rare). */
      &[src=''] {
        display: none;
      }
    }

    .citation-chip__label {
      letter-spacing: 0.01em;
    }
  }
}

@media (prefers-color-scheme: dark) {
  .markdown-body :deep(.citation-chip) .citation-chip__link {
    background: rgba(148, 197, 211, 0.14);
    color: #c7e0e8;

    &:hover {
      background: rgba(148, 197, 211, 0.22);
      color: #e6f3f7;
    }
  }
}
</style>
