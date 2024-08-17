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
          <application-status
            :show-price="false"
            :initializing="initializing"
            :application="application"
            :need-apply="needApply"
            :service="service"
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
import { IChatdocRepository } from '@/models';
import { ROUTE_CHATDOC_MANAGE } from '@/router';
import CreateRepository from '@/components/chatdoc/CreateRepository.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import ApplicationStatus from '@/components/application/Status.vue';
import { Status } from '@/models';

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
    ApplicationStatus
  },
  data() {
    return {};
  },
  computed: {
    repositories() {
      return this.$store.state.chatdoc.repositories;
    },
    needApply() {
      return this.$store.state.chatdoc.status.getApplications === Status.Success && !this.application;
    },
    application() {
      return this.$store.state.chatdoc.application;
    },
    service() {
      return this.$store.state.chatdoc.service;
    },
    initializing() {
      return this.$store.state.chatdoc.status.getApplications === Status.Request;
    }
  },
  async mounted() {},
  methods: {
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
  background-color: var(--el-bg-color-page);
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
  color: var(--el-text-color-primary);
}

.introduction {
  margin-bottom: 20px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.status {
  margin-bottom: 10px;
  width: fit-content;
}

.repositories {
  flex: 1;
  overflow-y: scroll;
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
      color: var(--el-text-color-regular);
    }

    .description {
      font-size: 12px;
      color: var(--el-text-color-regular);
    }
  }
}
</style>
