<template>
  <el-container id="footer" class="footer">
    <el-row class="w-full">
      <el-col class="container" :span="18" :offset="3">
        <el-row>
          <el-col :span="24" class="text-center">
            <p>
              <a href="https://platform.acedata.cloud">{{ $t('common.entity.website') }}</a> ©
              {{ new Date().getFullYear() }}
              {{ $t('common.entity.copyright') }}
              ·
              <a
                href="https://github.com/AceDataCloud/Nexior"
                target="_blank"
                rel="noopener noreferrer"
                class="github-link"
                :title="$t('common.nav.github')"
              >
                <font-awesome-icon :icon="faGithub" />
              </a>
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
import { faGithub } from '@fortawesome/free-brands-svg-icons';

export default defineComponent({
  name: 'BottomFooter',
  components: {
    ElContainer,
    ElRow,
    ElCol,
    FontAwesomeIcon
  },
  data() {
    return {
      faGithub
    };
  },
  computed: {},
  methods: {}
});
</script>

<style lang="scss" scoped>
.container {
  margin: auto;
  max-width: 1200px;
  padding: 30px 0 20px 0;
}

.footer {
  background-color: var(--el-color-primary);
  color: white;
  padding: 0;
  .title {
    font-size: 1.2rem;
    font-weight: 400;
  }
  a {
    text-decoration: none;
    color: white;
  }
  .github-link {
    display: inline-flex;
    align-items: center;
    margin-left: 4px;
    transition: opacity 0.3s;

    &:hover {
      opacity: 0.7;
    }
  }
}
</style>
