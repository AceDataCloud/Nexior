<template>
  <div class="navigation-item">
    <div class="icon">
      <font-awesome-icon :icon="icon" class="icon-rotate" />
    </div>
    <div v-if="!editing && !deleting" class="title">
      {{ title }}
    </div>
    <div v-if="deleting && !editing" class="title">
      {{ `${$t('conversation.message.confirmDelete')}"${title}"?` }}
    </div>
    <div v-if="editing && !deleting" class="title">
      <el-input v-model="newTitle" @keydown.enter="onConfirm" />
    </div>
    <div v-if="!editing && !deleting" class="edit">
      <font-awesome-icon icon="fa-solid fa-pen-to-square" class="icon-edit" @click="editing = true" />
    </div>
    <div v-if="!editing && !deleting" class="delete">
      <font-awesome-icon icon="fa-solid fa-trash" class="icon-delete" @click="deleting = true" />
    </div>
    <div v-if="editing || deleting" class="confirm">
      <font-awesome-icon icon="fa-solid fa-check" class="icon-confirm" @click="onConfirm" />
    </div>
    <div v-if="editing || deleting" class="cancel">
      <font-awesome-icon icon="fa-solid fa-xmark" class="icon-cancel" @click="onCancel" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ElInput } from 'element-plus';

export default defineComponent({
  name: 'ConversationNavigatorItem',
  components: {
    FontAwesomeIcon,
    ElInput
  },
  props: {
    icon: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    }
  },
  emits: ['update:title', 'delete'],
  data() {
    return {
      deleting: false,
      editing: false,
      newTitle: this.title
    };
  },
  methods: {
    onChangeTitle(val: string) {
      this.newTitle = val;
    },
    onConfirm() {
      if (this.editing) {
        this.$emit('update:title', this.newTitle);
        this.editing = false;
      } else if (this.deleting) {
        this.$emit('delete');
        this.deleting = false;
      }
    },
    onCancel() {
      if (this.editing) {
        this.editing = false;
      } else if (this.deleting) {
        this.deleting = false;
      }
    }
  }
});
</script>

<style lang="scss">
.navigation-item {
  display: flex;
  flex-direction: row;
  cursor: pointer;
  height: 44px;
  margin-top: 5px;
  padding: 0 15px;
  line-height: 44px;
  border-radius: 3px;
  &:hover {
    background-color: hsla(240, 9%, 59%, 0.1);
  }
  .icon {
    width: 30px;
    height: 30px;
    min-width: 30px;
  }
  .title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .edit,
  .delete,
  .confirm,
  .cancel {
    width: 25px;
    height: 30px;
    min-width: 25px;
    text-align: right;
  }
}
</style>
