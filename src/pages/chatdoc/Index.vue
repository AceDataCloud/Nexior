<template>
  <layout>
    <template #chatdoc>
      <div class="wrapper">
        <div class="title">
          {{ $t('chatdoc.title.repositories') }}
        </div>
        <div class="introduction">
          {{ $t('chatdoc.message.introductionForRepository') }}
        </div>
        <div class="status">
          <api-status
            :initializing="initializing"
            :application="application"
            :need-apply="needApply"
            :api-id="apiId"
            @refresh="$store.dispatch('chatdoc/getApplications')"
          />
        </div>
        <el-row class="repositories" :gutter="15">
          <el-col :xl="4" :md="6" :sm="12" :xs="24">
            <el-card class="repository text-center" shadow="hover" @click="onCreate">
              <create-repository />
              <p class="operation">{{ $t('chatdoc.title.createRepository') }}</p>
            </el-card>
          </el-col>
          <el-col
            v-for="(repository, repositoryIndex) in repositories"
            :key="repositoryIndex"
            :xl="4"
            :md="6"
            :sm="12"
            :xs="24"
          >
            <el-card class="repository" shadow="hover" @click="onClick(repository)">
              <el-dropdown v-if="false">
                <font-awesome-icon class="more" :icon="['fas', 'book']" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="onDelete(repository.id)">{{
                      $t('common.button.delete')
                    }}</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <h2 class="name">{{ repository.name }}</h2>
              <p class="id">
                <font-awesome-icon :icon="['fas', 'book']" />
                ID: {{ repository.id }}
              </p>
              <p class="description">
                {{ repository.description }}
              </p>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </template>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Layout from '@/layouts/Chatdoc.vue';
import { ElCard, ElRow, ElCol, ElDropdown, ElDropdownItem, ElDropdownMenu, ElMessage } from 'element-plus';
import { IApplication, IChatdocRepository } from '@/operators';
import { ROUTE_CHATDOC_MANAGE } from '@/router';
import CreateRepository from '@/components/chatdoc/CreateRepository.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import ApiStatus from '@/components/common/ApiStatus.vue';
import { Status } from '@/store/common/models';
import { API_ID_CHATDOC_REPOSITORIES } from '@/operators/chatdoc/constants';

export default defineComponent({
  name: 'ChatdocKnowledge',
  components: {
    Layout,
    ElCard,
    ElRow,
    ElCol,
    CreateRepository,
    FontAwesomeIcon,
    ElDropdown,
    ElDropdownItem,
    ElDropdownMenu,
    ApiStatus
  },
  data() {
    return {};
  },
  computed: {
    apiId() {
      return API_ID_CHATDOC_REPOSITORIES;
    },
    repositories() {
      return this.$store.state.chatdoc.repositories;
    },
    needApply() {
      return this.$store.state.chatdoc.getApplicationsStatus === Status.Success && !this.application;
    },
    applications() {
      return this.$store.state.chatdoc.applications;
    },
    application() {
      return this.applications?.find(
        (application: IApplication) => application.api?.id === API_ID_CHATDOC_REPOSITORIES
      );
    },
    initializing() {
      return this.$store.state.chatdoc.getApplicationsStatus === Status.Request;
    }
  },
  async mounted() {},
  methods: {
    onCreate() {
      console.log('onCreate');
    },
    onClick(repository: IChatdocRepository) {
      this.$router.push({
        name: ROUTE_CHATDOC_MANAGE,
        params: {
          repositoryId: repository.id
        }
      });
    },
    onDelete(id: string) {
      this.$store.dispatch('chatdoc/deleteRepository', { id }).then(() => {
        ElMessage.success(this.$t('chatdoc.message.deleteRepositorySuccess'));
        this.$store.dispatch('chatdoc/getRepositories');
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.wrapper {
  width: 100%;
  height: 100%;
  padding: 20px;
  background-color: #f2f3f5;
}

.title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
}

.introduction {
  margin-bottom: 20px;
  font-size: 14px;
  color: #666;
}

.status {
  margin-bottom: 10px;
  width: fit-content;
}

.repository {
  width: 100%;
  height: 150px;
  margin-bottom: 20px;
  cursor: pointer;
  position: relative;

  .el-dropdown {
    position: absolute;
    right: 20px;
    top: 20px;
  }

  .operation {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 10px;
  }

  .name {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 10px;
  }

  .id {
    font-size: 12px;
    color: #333;
  }

  .description {
    font-size: 12px;
    color: #666;
  }
}
</style>
