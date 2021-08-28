import { Constants } from 'vditor/src/ts/constants';
export const defaultOptions = {
  after: undefined,
  cache: {
    enable: true
  },
  cdn: Constants.CDN,
  classes: {
    preview: ''
  },
  comment: {
    enable: false
  },
  counter: {
    enable: true,
    type: 'markdown'
  },
  debugger: false,
  fullscreen: {
    index: 90
  },
  height: 'auto',
  hint: {
    delay: 200,
    emoji: {
      '+1': '👍',
      '-1': '👎',
      confused: '😕',
      eyes: '👀️',
      heart: '❤️',
      rocket: '🚀️',
      smile: '😄',
      tada: '🎉️'
    },
    emojiPath: `${Constants.CDN}/dist/images/emoji`,
    extend: [],
    parse: true
  },
  icon: 'ant',
  lang: 'zh_CN',
  mode: 'ir',
  outline: {
    enable: false,
    position: 'left'
  },
  placeholder: '',
  preview: {
    actions: ['desktop', 'mobile', 'mp-wechat', 'zhihu'],
    delay: 1000,
    hljs: Constants.HLJS_OPTIONS,
    markdown: Constants.MARKDOWN_OPTIONS,
    math: Constants.MATH_OPTIONS,
    maxWidth: 800,
    mode: 'both',
    theme: Constants.THEME_OPTIONS
  },
  resize: {
    enable: false,
    position: 'bottom'
  },
  theme: 'classic',
  toolbar: [
    'headings',
    'bold',
    'italic',
    'strike',
    'link',
    'emoji',
    '|',
    'list',
    'ordered-list',
    'check',
    'outdent',
    'indent',
    '|',
    'quote',
    'line',
    'code',
    'inline-code',
    'insert-before',
    'insert-after',
    '|',
    'table',
    '|',
    'undo',
    'redo',
    '|',
    'fullscreen',
    'edit-mode',
    'code-theme',
    'content-theme',
    {
      name: 'more',
      toolbar: ['both', 'outline', 'export', 'preview']
    }
  ],
  toolbarConfig: {
    hide: false,
    pin: false
  },
  typewriterMode: false,
  undoDelay: 800,
  upload: {
    extraData: {},
    fieldName: 'file[]',
    filename: (name: string) => name.replace(/\W/g, ''),
    linkToImgUrl: '',
    max: 10 * 1024 * 1024,
    multiple: true,
    url: '',
    withCredentials: false
  },
  value: '',
  width: 'auto'
};
