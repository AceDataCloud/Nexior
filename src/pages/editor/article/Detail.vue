<template>
  <el-row :gutter="20">
    <el-col :span="16" :offset="4">
      <div class="px-4 pt-4">
        <div id="vditor" class="vditor" />
      </div>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import Vditor from '@/libs/vditor/index';
import { Breadcrumb } from '@/components/common/index';
import { defaultOptions } from '@/settings/editor';
import '@/libs/vditor/assets/scss/index.scss';
import { defineComponent } from 'vue';
import { ArticleService } from '@/services';
import { IArticle, IArticleDetailResponse } from '@/services/article/types';

interface IData {
  id: string | string[];
  vditor: null | Vditor;
  item: null | IArticle;
  loading: boolean;
}

export default defineComponent({
  components: {
    Breadcrumb
  },
  data(): IData {
    return {
      id: this.$route.params.id,
      vditor: null,
      item: null,
      loading: false
    };
  },
  async mounted() {
    ArticleService.get(this.id).then(({ data: data }: { data: IArticleDetailResponse }): void => {
      console.log('data', data);
      this.item = data;
      this.loading = false;
      if (this.vditor && this.item) {
        this.vditor.setValue(this.item.content);
      }
    });
    this.initVditor();
  },
  computed: {},
  methods: {
    initVditor() {
      const options = {
        width: '100%',
        height: '0',
        tab: '\t',
        mode: 'ir',
        icon: 'ant',
        debugger: false,
        after: () => {
          if (this.vditor?.getValue) {
            return;
          }
          if (this.item?.content) {
            this.vditor?.setValue(this.item.content);
          }
        }
      };
      this.vditor = new Vditor('vditor', {
        ...defaultOptions,
        ...options
      });
      // this.vditor.focus();
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
