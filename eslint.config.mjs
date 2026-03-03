import pluginVue from 'eslint-plugin-vue';
import prettier from 'eslint-plugin-prettier/recommended';
import tsParser from '@typescript-eslint/parser';
import vueParser from 'vue-eslint-parser';

export default [
  ...pluginVue.configs['flat/recommended'],
  prettier,
  {
    files: ['src/**/*.{ts,tsx,vue,js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: vueParser,
      parserOptions: {
        parser: tsParser
      }
    },
    rules: {
      'vue/valid-define-props': 'off',
      'prettier/prettier': 'error',
      'vue/multi-word-component-names': 'off'
    }
  },
  {
    ignores: ['dist/', 'node_modules/', 'android/', 'ios/', 'public/']
  }
];
