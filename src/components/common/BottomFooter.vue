<template>
  <el-container id="footer" class="footer pt-7">
    <el-row class="w-full">
      <el-col class="container" :span="18" :offset="3">
        <el-row>
          <el-col :span="12" :offset="6" class="p-t text-center">
            <p>
              <span
                ><a href="https://acedata.cloud">{{ $t('common.entity.website') }}</a> © {{ new Date().getFullYear() }}
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
import { ElContainer, ElRow, ElCol } from 'element-plus';

export default defineComponent({
  name: 'BottomFooter',
  components: {
    ElContainer,
    ElRow,
    ElCol
  },
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
  background: radial-gradient(circle at 0 2%, #111827, #1a125d 99%);
  color: white;
}
</style>
