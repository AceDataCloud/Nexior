<template>
  <div class="title">
    {{ proxy?.title }}
  </div>
  <div class="introduction">
    <p>{{ proxy?.introduction }}</p>
  </div>
  <div class="options">
    <el-button
      v-if="showFirstOption"
      ref="option"
      type="primary"
      :plain="activeOption !== 'first'"
      class="option"
      @click="activeOption = 'first'"
      >{{ $t('proxy.message.firstFree') }}</el-button
    >
    <el-button
      v-for="(pkg, pkgIndex) in proxy?.packages"
      ref="option"
      :key="pkgIndex"
      type="primary"
      :plain="activePackage?.id !== pkg.id"
      class="option"
      @click="
        activeOption = 'package';
        activePackage = pkg;
      "
    >
      {{ pkg.amount }}{{ $t(`proxy.unit.${proxy.unit}`) }}
    </el-button>
    <el-button
      v-if="showCustomOption"
      ref="option"
      type="primary"
      :plain="activeOption !== 'custom'"
      class="option"
      @click="activeOption = 'custom'"
      >{{ $t('proxy.message.custom') }}</el-button
    >
  </div>
  <div class="price">
    <span v-if="activeOption === 'first'" class="value">￥0</span>
    <span v-if="activeOption === 'first'" class="remark">
      ({{ $t('proxy.message.present') + `${proxy.free_amount}` + $t(`proxy.unit.${proxy.unit}`) }})
    </span>
    <span v-if="activeOption === 'custom'" class="value">￥{{ proxy?.price }}</span>
    <span v-if="activeOption === 'custom'" class="remark">{{ '/' + $t(`proxy.unit.${proxy.unit}`) }}</span>
    <span v-if="activeOption === 'package'" class="value"> ￥{{ activePackage?.price }} </span>
    <span v-if="activeOption === 'package' && activePackage" class="remark">
      ({{
        $t('proxy.message.around') +
        '￥' +
        (activePackage?.price / activePackage?.amount).toFixed(2) +
        '/' +
        $t(`proxy.unit.${proxy.unit}`)
      }})
    </span>
  </div>
</template>

<script lang="ts">
import { IProxy, IPackage } from '@/operators';
import { defineComponent } from 'vue';
import urlJoin from 'url-join';
import { ElButton } from 'element-plus';

interface IData {
  activeOption: string | undefined;
  activePackage: IPackage | undefined;
}

export default defineComponent({
  name: 'ProxyInfo',
  components: {
    ElButton
  },
  props: {
    proxy: {
      type: Object as () => IProxy,
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
      return this.proxy.free_amount !== 0;
    },
    showPackageOption() {
      return this.proxy && this.proxy.packages && this.proxy?.packages?.length > 0;
    },
    showCustomOption() {
      return this.proxy.price === 0 || this.proxy?.price;
    }
  },
  mounted() {
    if (this.showFirstOption) {
      this.activeOption = 'first';
    } else if (this.showPackageOption) {
      this.activeOption = 'package';
      // @ts-ignore
      this.activePackage = this.proxy.packages[0];
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
