<template>
  <vue-markdown v-highlight :source="renderedContent" class="markdown-body bg-transparent pt-[3px] text-[inherit]" />
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import VueMarkdown from './VueMarkdown.vue';
import { highlight } from '@/utils';
import 'highlight.js/styles/night-owl.css';

// Some upstream models occasionally stream a tool call as raw JSON inside
// the assistant's text (instead of via the structured tool_calls channel
// the worker can route to a ToolActivity widget). The result is a long
// single-line `{"command":"python - <<'PY'\nfrom pypdf ..."}` blob with
// literal `\n` characters showing in the rendered text. Detect a small
// closed set of single-key JSON tool-call shapes and rewrite them into a
// proper fenced code block so the body reads cleanly.
const TOOL_CALL_KEYS: ReadonlyArray<{ key: string; lang: string }> = [
  { key: 'command', lang: 'bash' },
  { key: 'bash', lang: 'bash' },
  { key: 'shell', lang: 'bash' },
  { key: 'script', lang: 'bash' },
  { key: 'code', lang: 'python' },
  { key: 'python', lang: 'python' }
];

function rewriteInlineToolCallJson(source: string): string {
  if (!source || source.indexOf('{"') === -1) return source;
  // Walk fenced code spans (``` ... ```) and only transform text outside
  // them — never rewrite content the model deliberately put in a code
  // block.
  const parts = source.split(/(```[\s\S]*?```)/);
  for (let i = 0; i < parts.length; i += 2) {
    parts[i] = rewriteSegment(parts[i]);
  }
  return parts.join('');
}

function rewriteSegment(segment: string): string {
  // Match a single-key JSON object whose key matches one of TOOL_CALL_KEYS
  // and whose value is a string. The pattern is intentionally tight: the
  // object must take up the whole line (optionally indented) so we do not
  // touch JSON the user genuinely wrote inside prose.
  const re = /(^|\n)([ \t]*)(\{\s*"([a-zA-Z_]+)"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\})(?=\s*(?:\n|$))/g;
  return segment.replace(re, (match, lead: string, indent: string, _whole: string, key: string, raw: string) => {
    const entry = TOOL_CALL_KEYS.find((e) => e.key === key);
    if (!entry) return match;
    let decoded: string;
    try {
      decoded = JSON.parse('"' + raw + '"');
    } catch {
      return match;
    }
    return `${lead}${indent}\`\`\`${entry.lang}\n${decoded}\n\`\`\``;
  });
}

export default defineComponent({
  name: 'MarkdownRenderer',
  directives: {
    highlight
  },
  components: {
    VueMarkdown
  },
  props: {
    content: {
      type: String,
      required: false,
      default: ''
    }
  },
  setup(props) {
    const renderedContent = computed(() => rewriteInlineToolCallJson(props.content || ''));
    return { renderedContent };
  }
});
</script>

<style lang="scss">
@import 'github-markdown-css/github-markdown.css';
</style>

<style lang="scss" scoped>
.markdown-body {
  ol {
    list-style: initial;
  }

  pre code {
    color: white;
  }
}
</style>
