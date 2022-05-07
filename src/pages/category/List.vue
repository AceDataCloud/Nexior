<template>
  <el-row class="categories">
    <el-col :span="24">
      <el-row>
        <el-col :span="18" :offset="3">
          <el-row :gutter="20">
            <el-col v-for="(category, categoryIndex) in categories" :key="categoryIndex" :span="6">
              <div class="category" @click="onDetail(category.alias)">
                <div class="left">
                  <img :src="category.logo" />
                </div>
                <div class="right">
                  <h2 class="name">{{ category.name }}</h2>
                  <p class="info">{{ category.courses?.length }} {{ $t('common.entity.course') }}</p>
                </div>
              </div>
            </el-col>
          </el-row>
        </el-col>
      </el-row>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { categoryService } from '@/services/category/service';
import { ICategory, ICategoryListResponse } from '@/services/category/types';
import { defineComponent } from 'vue';

interface IData {
  categories: ICategory[];
  loading: boolean;
}
export default defineComponent({
  name: 'CategoryList',
  data(): IData {
    return {
      categories: [],
      loading: false
    };
  },
  async mounted() {
    this.loading = true;
    console.debug('start to load all categories');
    categoryService.getAll().then(({ data: data }: { data: ICategoryListResponse }) => {
      this.categories = data.items;
      this.loading = false;
    });
  },
  methods: {
    onDetail(alias?: string) {
      this.$router.push({
        name: 'course-list',
        query: {
          category: alias
        }
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.categories {
  // background-color: #0f1725;
  background-image: radial-gradient(circle at 0 0, #223c6a, rgba(15, 23, 37, 0) 56%),
    linear-gradient(180deg, #0f1725, #0f1725);
  padding: 40px 0;
  .category {
    width: 100%;
    background-color: #13233c;
    height: 90px;
    color: white;
    border-radius: 10px;
    margin: 15px 0;
    border-width: 2px;
    border-style: solid;
    border-color: #13233c;
    cursor: pointer;
    .left,
    .right {
      float: left;
    }
    &:hover {
      border-color: rgba(50, 138, 241, 0.2);
    }

    .left {
      width: 80px;
      img {
        width: 60px;
        margin: 10px;
      }
      margin-right: 10px;
    }
    .right {
      width: calc(100% - 90px);
      margin-top: 15px;
      .name {
        font-size: 20px;
        font-weight: bold;
      }
    }
  }
}
</style>
