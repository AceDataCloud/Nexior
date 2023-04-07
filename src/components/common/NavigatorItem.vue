<template>
  <div class="navigation-item">
    <div class="icon">
      <font-awesome-icon :icon="icon" class="icon-rotate" />
    </div>
    <div class="title">
      {{ title }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'NavigatorItem',
  components: {
    FontAwesomeIcon
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
}
</style>
