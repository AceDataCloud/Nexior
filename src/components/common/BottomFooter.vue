<template>
  <el-container id="footer" class="footer pt-7">
    <el-row class="w-full">
      <el-col class="container" :span="18" :offset="3">
        <el-row>
          <el-col :span="12" :offset="6" class="p-t text-center">
            <p>
              <span
                ><a href="https://zhishuyun.com">{{ $t('common.entity.website') }}</a> © {{ new Date().getFullYear() }}
                {{ $t('common.entity.copyright') }}
              </span>
              <span class="ml-2">
                <a href="https://beian.miit.gov.cn/">京ICP备18021371号-2 </a>
              </span>
            </p>
          </el-col>
        </el-row>
      </el-col>
    </el-row>
  </el-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'BottomFooter',
  data() {
    return {};
  },
  computed: {},
  methods: {}
});
</script>

<style lang="scss">
$height: 80px;
.footer {
  height: $height;
  background-image: radial-gradient(circle at 15% -3%, #365280, #080e17 116%);
  color: white;
}
</style>
