<template>
  <div class="panel">
    <el-skeleton v-if="loading && repositories === undefined" />
    <div v-else class="repositories">
      <div class="repository" @click="onNewRepository">
        <div class="icons">
          <font-awesome-icon icon="fa-solid fa-plus" class="icon" />
        </div>
        <div class="title">
          {{ $t('chatdoc.message.startNewChat') }}
        </div>
      </div>
      <div
        v-for="(repository, repositoryIndex) in repositories"
        :key="repositoryIndex"
        :class="{ repository: true, active: repository.id === repositoryId }"
        @click="onClick(repository.id)"
      >
        <div class="icons">
          <font-awesome-icon icon="fa-regular fa-comment" class="icon" />
        </div>
        <div class="title">
          <span v-if="repository?.deleting">
            {{ `${$t('chatdoc.message.confirmDelete')}?` }}
          </span>
          <span v-else-if="repository?.editing">
            <el-input v-model="repository.title" @keydown.enter="onConfirm(repository)" />
          </span>
          <span v-else-if="repository?.title || repository?.messages">{{
            repository?.title || repository?.messages[repository?.messages.length - 1]?.content
          }}</span>
        </div>
        <div class="operations">
          <font-awesome-icon
            v-if="!repository?.editing && !repository.deleting"
            icon="fa-solid fa-edit"
            class="icon icon-edit"
            @click.stop="repository.editing = true"
          />
          <font-awesome-icon
            v-if="!repository?.editing && !repository.deleting"
            icon="fa-solid fa-trash"
            class="icon icon-delete"
            @click.stop="repository.deleting = true"
          />
          <font-awesome-icon
            v-if="repository?.editing || repository.deleting"
            icon="fa-solid fa-check"
            class="icon icon-confirm"
            @click.stop="onConfirm(repository)"
          />
          <font-awesome-icon
            v-if="repository?.editing || repository.deleting"
            icon="fa-solid fa-xmark"
            class="icon icon-cancel"
            @click.stop="
              repository.editing = false;
              repository.deleting = false;
            "
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSkeleton, ElInput } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ROUTE_CHAT_CONVERSATION, ROUTE_CHAT_CONVERSATION_NEW } from '@/router/constants';
import { Status } from '@/store/common/models';
import { IChatdocRepository } from '@/models';

export default defineComponent({
  name: 'SidePanel',
  components: {
    ElInput,
    FontAwesomeIcon,
    ElSkeleton
  },
  props: {},
  emits: ['click'],
  computed: {
    repositoryId() {
      return this.$route.params?.id?.toString();
    },
    repositories() {
      return this.$store.state.chatdoc.repositories;
    },
    applications() {
      return this.$store.state.chatdoc.applications;
    },
    loading() {
      return this.$store.state.chatdoc.getRepositoriesStatus === Status.Request;
    }
  },
  methods: {
    async onNewRepository() {
      this.$router.push({
        name: ROUTE_CHAT_CONVERSATION_NEW
      });
    },
    async onConfirm(repository: IChatdocRepository) {
      // if (repository?.deleting) {
      //   await chatdocOperator.deleteRepository(repository.id);
      //   await this.$store.dispatch('chatdoc/getRepositories');
      // } else if (repository?.editing) {
      //   await chatdocOperator.updateRepository(repository);
      //   await this.$store.dispatch('chatdoc/getRepositories');
      // } else {
      //   repository.editing = true;
      // }
    },
    onClick(id: string) {
      if (!id) {
        return;
      }
      this.$router.push({
        name: ROUTE_CHAT_CONVERSATION_NEW,
        params: {
          repositoryId: this.repositoryId
        }
      });
      this.$emit('click', id);
    }
  }
});
</script>

<style lang="scss" scoped>
.panel {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 15px;
  width: 300px;
  height: 100%;
  border-right: 1px solid #eee;
  overflow-y: scroll;

  .repositories {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    .repository {
      width: 100%;
      height: 55px;
      display: flex;
      flex-direction: row;
      padding: 10px;
      margin-bottom: 5px;
      border: 1px dashed hsl(0, 0%, 93%);
      line-height: 30px;
      border-radius: 10px;
      color: #666;
      cursor: pointer;

      &.active,
      &:hover {
        background-color: #eee;
      }

      .icons {
        width: 30px;
        padding-left: 10px;
        .icon {
          font-size: 14px;
        }
      }
      .title {
        flex: 1;
        font-size: 14px;
        line-height: 32px;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-right: 8px;
        color: #666;
      }
      .operations {
        width: 40px;
        .icon {
          cursor: pointer;
          font-size: 14px;
          margin-right: 6px;
        }
      }
    }
  }
}
</style>
