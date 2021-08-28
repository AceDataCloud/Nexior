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
import Vditor from 'vditor';
import { Breadcrumb } from '@/components/common/index';
import { defaultOptions } from '@/settings/editor';
import 'vditor/src/assets/scss/index.scss';
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
  margin-top: 30px;
}

.vditor-toolbar {
  background-color: #f5f5f5;
  border-bottom: none;
  position: fixed;
  padding-left: 0 !important;
  top: 65px;
  z-index: 1000;
  left: 50%;
  transform: translateX(-50%);
}

.vditor-toolbar--pin {
  // position: fixed;
  top: 60px;
}

.vditor-ir pre.vditor-reset {
  padding-top: 80px !important;
  padding-bottom: 80px !important;
  &:focus {
    background-color: #fff;
  }
}
</style>
