<template>
  <div class="title">
    <el-button type="primary" size="small" class="mb-1">{{ $t('application.field.api') }}</el-button>
    {{ api?.title }}
  </div>
  <div class="introduction">
    <p>{{ api?.introduction }}</p>
  </div>
  <div class="options">
    <el-button
      v-if="showFirstOption"
      ref="option"
      type="primary"
      :plain="activeOption !== 'first'"
      class="option"
      @click="activeOption = 'first'"
      >{{ $t('api.message.firstFree') }}</el-button
    >
    <el-button
      v-for="(pkg, pkgIndex) in api?.packages"
      ref="option"
      :key="pkgIndex"
      type="primary"
      :plain="!(activeOption == 'package' && activePackage?.id === pkg.id)"
      class="option"
      @click="
        activeOption = 'package';
        activePackage = pkg;
      "
    >
      {{ pkg.amount }}{{ $t(`api.unit.${api.unit}`) }}
    </el-button>
    <el-button
      v-if="showCustomOption"
      ref="option"
      type="primary"
      :plain="activeOption !== 'custom'"
      class="option"
      @click="activeOption = 'custom'"
      >{{ $t('api.message.custom') }}</el-button
    >
  </div>
  <div class="price">
    <span v-if="activeOption === 'first'" class="value">￥0</span>
    <span v-if="activeOption === 'first'" class="remark">
      ({{ $t('api.message.present') + `${api.free_amount}` + $t(`api.unit.${api.unit}`) }})
    </span>
    <span v-if="activeOption === 'custom'" class="value">￥{{ api?.price }}</span>
    <span v-if="activeOption === 'custom'" class="remark">{{ '/' + $t(`api.unit.${api.unit}`) }}</span>
    <span v-if="activeOption === 'package'" class="value"> ￥{{ activePackage?.price }} </span>
    <span v-if="activeOption === 'package' && activePackage" class="remark">
      ({{
        $t('api.message.around') +
        '￥' +
        (activePackage?.price / activePackage?.amount).toFixed(2) +
        '/' +
        $t(`api.unit.${api.unit}`)
      }})
    </span>
  </div>
</template>

<script lang="ts">
import { IApi, IPackage } from '@/operators';
import { defineComponent } from 'vue';
import urlJoin from 'url-join';
import { ElButton } from 'element-plus';

interface IData {
  activeOption: string | undefined;
  activePackage: IPackage | undefined;
}

export default defineComponent({
  name: 'ApiPreview',
  components: {
    ElButton
  },
  props: {
    api: {
      type: Object as () => IApi,
      required: true
    }
  },
  data(): IData {
    return {
      activeOption: undefined,
      activePackage: undefined
    };
  },
  computed: {
    showFirstOption() {
      return this.api.free_amount !== 0;
    },
    showPackageOption() {
      return this.api && this.api.packages && this.api?.packages?.length > 0;
    },
    showCustomOption() {
      return this.api.price === 0 || this.api?.price;
    }
  },
  mounted() {
    if (this.showFirstOption) {
      this.activeOption = 'first';
    } else if (this.showPackageOption) {
      this.activeOption = 'package';
      // @ts-ignore
      this.activePackage = this.api.packages[0];
    } else if (this.showCustomOption) {
      this.activeOption = 'custom';
    }
  },
  methods: {
    urlJoin,
    onSelect(option: string, pkg?: IPackage) {
      this.activeOption = option;
      this.activePackage = pkg;
    }
  }
});
</script>

<style lang="scss" scoped>
.title {
  font-size: 26px;
  font-weight: 500;
  line-height: 1.2;
  margin-bottom: 10px;
}

.introduction {
  font-size: 14px;
  margin-bottom: 15px;
  color: #666;
}

.options {
  .option {
    border-radius: 5px !important;
  }
  margin-bottom: 10px;
}

.price {
  .value {
    font-weight: bold;
    color: #ff5441;
    font-size: 24px;
  }

  .remark {
    font-size: 14px;
    color: #999;
    display: inline-block;
    margin-left: 5px;
  }
}
</style>
