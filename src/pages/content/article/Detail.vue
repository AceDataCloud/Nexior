<template>
  <el-row :gutter="20">
    <el-col :span="16" :offset="4">
      <loading :loading="loading" />
      <div class="px-4 pt-4">
        <success-info v-model:show="succeed" :content="$t('content.message.saved')"></success-info>
        <div id="vditor" class="vditor" />
      </div>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import Vditor from '@/libs/vditor/index';
import { Breadcrumb, Loading, SuccessInfo } from '@/components/common/index';
import { defaultOptions } from '@/settings/editor';
import '@/libs/vditor/assets/scss/index.scss';
import { defineComponent } from 'vue';
import ArticleService from '@/services/content/article/service';
import { IArticle, IArticleDetailResponse } from '@/services/content/article/types';

interface IData {
  id: string | string[];
  vditor: null | Vditor;
  item: null | IArticle;
  loading: boolean;
  succeed: boolean;
}

export default defineComponent({
  components: {
    Breadcrumb,
    Loading,
    SuccessInfo
  },
  data(): IData {
    return {
      id: this.$route.params.id,
      vditor: null,
      item: null,
      loading: false,
      succeed: false
    };
  },
  async mounted() {
    this.loading = true;
    ArticleService.get(this.id).then(({ data: data }: { data: IArticleDetailResponse }): void => {
      this.item = data;
      this.loading = false;
      if (this.vditor?.initialized && this.item) {
        this.vditor.setValue(this.item);
      }
    });
    this.initVditor();
    this.listenKeyboard();
  },
  computed: {},
  methods: {
    listenKeyboard() {
      document.addEventListener(
        'keydown',
        (e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.onSave();
          }
        },
        false
      );
    },
    initVditor() {
      const options = {
        width: '100%',
        height: '0',
        tab: '\t',
        mode: 'ir',
        icon: 'ant',
        debugger: false,
        after: () => {
          if (this.vditor?.getValue()) {
            return;
          }
          if (this.item?.content) {
            if (!this.item.title) {
              this.item.title = this.$t('content.text.notitle');
            }
            this.vditor?.setValue(this.item);
          }
        }
      };
      this.vditor = new Vditor('vditor', {
        ...defaultOptions,
        ...options
      });
    },
    onSave() {
      const title = this.vditor?.getTitle(this.$t('content.text.notitle'));
      const content = this.vditor?.getContent();
      ArticleService.update(this.id, {
        title: title,
        content: content
      }).then(({ data: data }: { data: IArticleDetailResponse }): void => {
        this.item = data;
        if (this.vditor && this.item) {
          if (!this.item.title) {
            this.item.title = this.$t('content.text.notitle');
          }
          this.vditor.setValue(this.item);
        }
        this.succeed = true;
      });
    }
  }
});
</script>

<style lang="scss">
.vditor {
  box-shadow: 0 1px 7px #ddd;
  border: none;
  margin-bottom: 100px;
  margin-top: 20px;
}

.vditor-toolbar-wrapper {
  background-color: #f5f5f5;
  width: 100%;
  height: 35px;
  position: fixed;
  padding-left: 0 !important;
  top: 60px;
  z-index: 1000;
  left: 0;
}

.vditor-toolbar {
  background-color: #f5f5f5;
  border-bottom: none;
  left: 50%;
  height: 35px;
  position: absolute;
  transform: translateX(-50%);
  width: 700px;
  margin: auto;
}

.vditor-toolbar--pin {
  // position: fixed;
  top: 60px;
}

.vditor-reset {
  padding-top: 80px !important;
  padding-bottom: 80px !important;
  &:focus {
    background-color: #fff !important;
  }
}
</style>
