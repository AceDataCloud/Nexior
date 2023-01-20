<template>
  <el-row class="wrapper">
    <el-col :span="22" :offset="1">
      <div class="left">
        <api-list />
      </div>
      <div class="main">
        <api-usage :id="id" />
      </div>
      <div class="right">
        <api-try v-model:api-key="apiKey" />
      </div>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ApiList from '@/components/document/ApiList.vue';
import ApiUsage from '@/components/document/ApiUsage.vue';
import ApiTry from '@/components/document/ApiTry.vue';

export default defineComponent({
  components: {
    ApiList,
    ApiUsage,
    ApiTry
  },
  data() {
    return {
      apiKey: ''
    };
  },
  computed: {
    id() {
      return this.$route.params.id.toString();
    }
  },
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
    width: calc(100% - 760px);
    height: 100%;
    padding: 30px;
  }

  .right {
    float: left;
    width: 480px;
    height: 100%;
    box-shadow: -1px 0 0 #eee;
  }
}
</style>
