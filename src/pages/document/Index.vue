<template>
  <el-row class="wrapper">
    <el-col :span="22" :offset="1">
      <div class="left">
        <api-list />
      </div>
      <div class="main">
        <h2>{{ $t('common.title.documentIntroduction') }}</h2>
      </div>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ApiList from '@/components/document/ApiList.vue';

export default defineComponent({
  components: {
    ApiList
  },
  data() {
    return {};
  },
  computed: {},
  mounted() {},
  methods: {}
});
</script>

<style lang="scss" scoped>
.wrapper {
  width: 100%;
  overflow: hidden;

  .left {
    float: left;
    width: 280px;
    height: 100%;
    box-shadow: 1px 0 0 #eee;
  }

  .main {
    float: left;
    width: calc(100% - 280px);
    height: 100%;
    padding: 30px;
  }
}
</style>
