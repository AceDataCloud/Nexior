<template>
  <codemirror :model-value="code" :disabled="!editable" :extensions="extensions" />
</template>

<script lang="ts">
import { Codemirror } from 'vue-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { defineComponent } from 'vue';
import { Extension } from '@codemirror/state';

interface IData {
  extensions: Extension[];
}

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
    }
  },
  data(): IData {
    return {
      extensions: [json(), oneDark]
    };
  }
});
</script>
