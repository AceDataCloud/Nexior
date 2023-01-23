<template>
  <codemirror :model-value="code" :disabled="!editable" :extensions="extensions" />
</template>

<script lang="ts">
import { Codemirror } from 'vue-codemirror';
import { json } from '@codemirror/lang-json';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { php } from '@codemirror/lang-php';
import { java } from '@codemirror/lang-java';
import { oneDark } from '@codemirror/theme-one-dark';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'CodeSnippet',
  components: {
    Codemirror
  },
  props: {
    code: {
      type: String,
      required: true
    },
    editable: {
      type: Boolean,
      required: false
    },
    lang: {
      type: String,
      required: false,
      default: 'JSON'
    }
  },
  computed: {
    extensions() {
      let result = [];
      result.push(oneDark);
      if (this.lang === 'JSON') {
        result.push(json());
      }
      if (this.lang === 'Python') {
        result.push(python());
      }
      if (this.lang === 'Java') {
        result.push(java());
      }
      if (this.lang === 'JavaScript') {
        result.push(javascript());
      }
      if (this.lang === 'PHP') {
        result.push(php());
      }
      return result;
    }
  }
});
</script>
