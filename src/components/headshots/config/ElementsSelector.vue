<template>
  <div class="field">
    <!-- <h2 class="title">{{ $t('headshots.field.elements') }}</h2> -->
    <el-tabs v-model="tab">
      <el-tab-pane
        v-for="(element, elementKey) in elements"
        :key="elementKey"
        :label="element.displayName"
        :name="elementKey"
        class="pane"
      >
        <div
          v-for="(item, itemKey) in element.items"
          :key="itemKey"
          :class="{
            item: true,
            active: value === item.value
          }"
          @click="onToggle(item.value)"
        >
          <el-image :src="item.image" fit="fill" class="preview" />
          <span class="name">{{ item.label }}</span>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElTabs, ElTabPane, ElImage } from 'element-plus';

interface IElementItem {
  image: string;
  label: string;
  value: string;
  advanced?: boolean;
}

interface IElement {
  displayName: string;
  items: IElementItem[];
}

interface IData {
  tab: string;
  value: string;
  elements: Record<string, IElement>;
}

export default defineComponent({
  name: 'StylizeSelector',
  components: {
    ElTabs,
    ElTabPane,
    ElImage
  },
  data(): IData {
    return {
      tab: 'styles',
      value: '',
      elements: {
        styles: {
          displayName: this.$t('headshots.styleCategory.styles'),
          items: [
            {
              image: 'https://static.aipedias.com/aicamera/common/20241008/20241008202314260779439.png',
              label: this.$t('headshots.styleTag.malePportrait'),
              value: 'male_portrait'
            },
            {
              image: 'https://static.aipedias.com/aicamera/common/20241008/202410082022241e9755548.png',
              label: this.$t('headshots.styleTag.malePportrait2'),
              value: 'male_portrait2'
            },
            {
              image: 'https://static.aipedias.com/aicamera/common/20241101/20241101170130d78f66521.png',
              label: this.$t('headshots.styleTag.kindergarten'),
              value: 'kindergarten'
            },
            {
              image: 'https://static.aipedias.com/aicamera/common/20240923/20240923123233accf60398.webp',
              label: this.$t('headshots.styleTag.logoTshirt'),
              value: 'logo_tshirt'
            },
            {
              image: 'https://static.aipedias.com/aicamera/common/20241025/202410252012329472d0656.jpg',
              label: this.$t('headshots.styleTag.wedding'),
              value: 'wedding'
            },
            {
              image: 'https://static.aipedias.com/aicamera/common/20240915/20240915145045254931400.webp',
              label: this.$t('headshots.styleTag.businessPphoto'),
              value: 'business_photo'
            },
            {
              image: 'https://static.aipedias.com/aicamera/common/20240810/20240810194526040341795.jpg',
              label: this.$t('headshots.styleTag.bobSuit'),
              value: 'bob_suit'
            },
            {
              image: 'https://static.aipedias.com/aicamera/common/20240717/20240717152654e0b348173.webp',
              label: this.$t('headshots.styleTag.femalePortrait'),
              value: 'female_portrait'
            }
          ]
        }
      }
    };
  },
  watch: {
    value(val: string) {
      console.debug('set template', val);
      this.$store.commit('headshots/setConfig', {
        ...this.$store.state.headshots?.config,
        template: val
      });
    }
  },
  mounted() {
    if (!this.value) {
      this.value = '';
    }
    console.debug('set template', this.value);
    this.$store.commit('headshots/setConfig', {
      ...this.$store.state.headshots?.config,
      template: this.value
    });
  },
  methods: {
    onToggle(selectedValue: string) {
      if (this.value === selectedValue) {
        this.value = '';
      } else {
        this.value = selectedValue;
      }
      console.debug('set template', this.value);
      this.$store.commit('headshots/setConfig', {
        ...this.$store.state.headshots?.config,
        template: this.value
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.title {
  font-size: 14px;
  margin-bottom: 10px;
}
.pane {
  display: flex;
  flex-direction: row;
  justify-content: left;
  align-items: center;
  flex-wrap: wrap;
  height: auto;
  max-height: 220px;
  overflow-y: scroll;
  .item {
    $height: 110px;
    $width: 70px;
    position: relative;
    width: $width;
    height: $height;
    margin-right: 8px;
    margin-bottom: 8px;
    border-width: 3px;
    border-style: solid;
    border-color: var(--el-border-color);
    border-radius: 5px;
    overflow: hidden;
    cursor: pointer;

    &.hidden {
      display: none;
    }

    &.active {
      border-color: var(--el-color-primary);
    }

    .preview {
      width: $width;
      height: $height;
    }
    .name {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      color: white;
      font-size: 10px;
      text-align: center;
      padding: 0 5px;
    }
  }
}
</style>
