<template>
  <el-container id="footer" class="footer pt-7">
    <el-row class="w-full">
      <el-col class="container" :span="18" :offset="3">
        <el-row class="mb-8">
          <el-col :md="12" :xs="24" class="p-t text-left mb-8">
            <h2 class="title mb-4">
              {{ $t('common.about.title1') }}
            </h2>
            <p class="mb-2">
              <font-awesome-icon icon="fa-solid fa-location-dot" class="mr-1" />
              {{ $t('common.about.address') }}
            </p>
            <p class="mb-2">
              <font-awesome-icon icon="fa-solid fa-envelope" class="mr-1" />
              {{ 'office&#64;acedata.cloud' }}
            </p>
          </el-col>
          <el-col :span="6" :xs="12" class="p-t text-left">
            <h2 class="title mb-4">
              {{ $t('common.about.title2') }}
            </h2>
            <p class="mb-2">
              <a href="/services"> {{ $t('common.about.link1') }} </a>
            </p>
            <p class="mb-2">
              <a href="/documents"> {{ $t('common.about.link2') }} </a>
            </p>
            <p class="mb-2">
              <a href="/profile"> {{ $t('common.about.link4') }} </a>
            </p>
            <p class="mb-2">
              <a href="https://hub.acedata.cloud" target="_blank"> {{ $t('common.about.link5') }} </a>
            </p>
          </el-col>
          <el-col :span="6" :xs="12" class="p-t text-left">
            <h2 class="title mb-4">
              {{ $t('common.about.title3') }}
            </h2>
            <p class="mb-2">
              <a href="/console/distributions"> {{ $t('common.about.link6') }} </a>
            </p>
            <p class="mb-2">
              <a href="/support"> {{ $t('common.about.link7') }} </a>
            </p>
            <p class="mb-2">
              <a href="/terms"> {{ $t('common.about.link8') }} </a>
            </p>
            <p class="mb-2">
              <a href="/privacy"> {{ $t('common.about.link9') }} </a>
            </p>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12" :offset="6" class="p-t text-center">
            <p>
              <a href="https://acedata.cloud">{{ $t('common.entity.website') }}</a> ©
              {{ new Date().getFullYear() }}
              {{ $t('common.entity.copyright') }}
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
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'BottomFooter',
  components: {
    ElContainer,
    ElRow,
    FontAwesomeIcon,
    ElCol
  },
  data() {
    return {};
  },
  computed: {},
  methods: {}
});
</script>

<style lang="scss" scoped>
.container {
  margin: auto;
  max-width: 1200px;
  padding: 60px 0 20px 0;
}

.footer {
  background-color: var(--el-color-primary);
  color: white;
  padding: 0;
  .title {
    font-size: 1.2rem;
    font-weight: 400;
  }
}
</style>
