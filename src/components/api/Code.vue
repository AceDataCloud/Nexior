<template>
  <div class="wrapper">
    <div class="options mb-2">
      <div
        v-for="(option, optionKey) in options"
        :key="optionKey"
        :class="{
          option: true,
          active: lang === option.name
        }"
        @click="lang = option.name"
      >
        <el-image :src="option.icon" class="icon" />
        <p class="name">{{ option.name }}</p>
      </div>
    </div>
    <div v-if="code" class="code">
      <code-snippet :code="code" :lang="lang" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import javascript from 'programming-languages-logos/src/javascript/javascript.svg';
import python from 'programming-languages-logos/src/python/python.svg';
import java from 'programming-languages-logos/src/java/java.svg';
import php from 'programming-languages-logos/src/php/php.svg';
import { IApi, IForm, IRequest } from '@/operators/api/models';
import urlJoin from 'url-join';
import Mustache from 'mustache';
import pythonTemplate from '@/assets/templates/python.tpl';
import javascriptTemplate from '@/assets/templates/javascript.tpl';
import phpTemplate from '@/assets/templates/php.tpl';
import javaTemplate from '@/assets/templates/java.tpl';
import CodeSnippet from '../common/CodeSnippet.vue';
import queryString from 'query-string';

interface IOption {
  name: ILang;
  icon: string;
}

const LANG_PYTHON = 'Python';
const LANG_JAVA = 'Java';
const LANG_JAVASCRIPT = 'JavaScript';
const LANG_PHP = 'PHP';

type ILang = typeof LANG_PYTHON | typeof LANG_JAVA | typeof LANG_JAVASCRIPT | typeof LANG_PHP;

interface IData {
  lang: ILang | undefined;
  options: IOption[];
}

interface IRenderData {
  headers: {
    key: string;
    value: string;
  }[];
  body: {
    key: string;
    value: string | object | number | object[];
  }[];
  method: IRequest['method'] | Lowercase<IRequest['method']> | Uppercase<IRequest['method']>;
  url: string;
}

export default defineComponent({
  name: 'ApiCode',
  components: {
    CodeSnippet
  },
  props: {
    api: {
      type: Object as () => IApi,
      required: true
    },
    form: {
      type: Object as () => IForm,
      required: true
    }
  },
  data(): IData {
    return {
      lang: undefined,
      options: [
        {
          name: LANG_PYTHON,
          icon: python
        },
        {
          name: LANG_JAVASCRIPT,
          icon: javascript
        },
        {
          name: LANG_JAVA,
          icon: java
        },
        {
          name: LANG_PHP,
          icon: php
        }
      ]
    };
  },
  computed: {
    method() {
      return this.api.request.method;
    },
    url() {
      const getQueryString = () => {
        if (this.form.queries) {
          return `?${queryString.stringify(this.form?.queries)}`;
        }
        return '';
      };
      return urlJoin(this.api?.endpoint, this.api?.path, getQueryString());
    },
    headers() {
      let result = [];
      for (const key in this.form.headers) {
        result.push({
          key,
          value: this.form.headers[key]
        });
      }
      if (result.length > 0) {
        const last = result[result.length - 1];
        result[result.length - 1] = {
          ...last,
          last: true
        };
      }
      return result;
    },
    body() {
      let result = [];
      for (const key in this.form.body) {
        result.push({
          key,
          value: this.form.body[key]
        });
      }
      if (result.length > 0) {
        const last = result[result.length - 1];
        result[result.length - 1] = {
          ...last,
          last: true
        };
      }
      return result;
    },
    code(): string | undefined {
      let template = undefined;
      let renderData: IRenderData = {
        headers: this.headers,
        body: this.body,
        url: this.url,
        method: this.method
      };
      if (this.lang === LANG_PYTHON) {
        template = pythonTemplate;
        renderData = {
          ...renderData,
          method: renderData.method.toLowerCase() as Lowercase<IRenderData['method']>
        };
      } else if (this.lang === LANG_JAVASCRIPT) {
        template = javascriptTemplate;
      } else if (this.lang === LANG_PHP) {
        template = phpTemplate;
      } else if (this.lang === LANG_JAVA) {
        template = javaTemplate;
      }
      if (template) return Mustache.render(template, renderData);
      return undefined;
    }
  },
  mounted() {
    this.lang = this.options[0].name;
  }
});
</script>

<style lang="scss" scoped>
.wrapper {
  width: 100%;
  padding: 15px;
  padding-bottom: 0;
  overflow-x: scroll;
  .options {
    width: fit-content;
    overflow: hidden;
    .option {
      margin: 0 5px;
      float: left;
      width: 70px;
      height: 70px;
      text-align: center;
      border: 1px solid transparent;
      padding: 10px;
      border-radius: 10px;
      display: inline-flex;
      flex-direction: column;
      text-align: center;
      align-items: center;
      &:hover,
      &.active {
        border-color: #ccc;
        cursor: pointer;
      }
      .icon {
        width: 30px;
        height: 30px;
        margin-bottom: 10px;
      }
      .name {
        color: #666;
        font-size: 11px;
        font-weight: bold;
      }
    }
  }
}
</style>
