<template>
  <div class="wrapper">
    <div class="options">
      <div v-for="(option, optionKey) in options" :key="optionKey" class="option">
        <el-image :src="option.icon" class="icon" />
        <p class="name">{{ option.name }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import javascript from 'programming-languages-logos/src/javascript/javascript.svg';
import python from 'programming-languages-logos/src/python/python.svg';
import java from 'programming-languages-logos/src/java/java.svg';
import go from 'programming-languages-logos/src/go/go.svg';
import { IApi, IForm } from '@/operators/api/models';
import urlJoin from 'url-join';

interface IOption {
  name: string;
  icon: string;
}

interface IData {
  options: IOption[];
}

export default defineComponent({
  name: 'ApiCode',
  props: {
    api: {
      type: Object as () => IApi,
      required: true
    },
    form: {
      type: Object as () => IForm,
      required: true
    }
  },
  data(): IData {
    return {
      options: [
        {
          name: 'Python',
          icon: python
        },
        {
          name: 'JavaScript',
          icon: javascript
        },
        {
          name: 'Java',
          icon: java
        },
        {
          name: 'Go',
          icon: go
        }
      ]
    };
  },
  computed: {
    url() {
      return urlJoin(this.api?.endpoint, this.api?.path);
    },
    contentType() {
      return (this.form?.headers || {})['content-type'];
    },
    pythonSample() {}
  },
  watch: {}
});
</script>

<style lang="scss">
.wrapper {
  width: 100%;
  padding: 15px;
  overflow-x: scroll;
  .options {
    width: fit-content;
    overflow: hidden;
    .option {
      margin: 0 5px;
      float: left;
      width: 70px;
      height: 70px;
      text-align: center;
      border: 1px solid transparent;
      padding: 10px;
      border-radius: 10px;
      display: inline-flex;
      flex-direction: column;
      text-align: center;
      align-items: center;
      &:hover {
        border-color: #ccc;
        cursor: pointer;
      }
      .icon {
        width: 30px;
        height: 30px;
        margin-bottom: 10px;
      }
      .name {
        color: #666;
        font-size: 11px;
        font-weight: bold;
      }
    }
  }
}
</style>
