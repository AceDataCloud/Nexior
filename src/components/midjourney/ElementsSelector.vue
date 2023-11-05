<!-- eslint-disable vue/no-use-v-if-with-v-for -->
<template>
  <div class="field">
    <h2 class="title">绘制风格</h2>
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
            hidden: !advanced && item?.advanced,
            item: true,
            active: value.includes(item.value)
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
  value: string[];
  elements: Record<string, IElement>;
}

export default defineComponent({
  name: 'StylizeSelector',
  components: {
    ElTabs,
    ElTabPane,
    ElImage
  },
  props: {
    modelValue: {
      type: Object as () => string[],
      required: true
    },
    advanced: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  data(): IData {
    return {
      tab: 'styles',
      value: this.modelValue,
      elements: {
        styles: {
          displayName: '风格',
          items: [
            {
              image: 'https://cdn.zhishuyun.com/94ab394d-2fa3-4fe8-b3b3-41be85720fdb.png',
              label: '水彩',
              value: 'Watercolour'
            },
            {
              image: 'https://cdn.zhishuyun.com/c3904cc5-3184-4639-be76-46f4860c1277.png',
              label: '油画',
              value: 'Oil painting'
            },
            {
              image: 'https://cdn.zhishuyun.com/a0b764bb-13b1-419b-a8e8-855ee7ffc28a.png',
              label: '老照片',
              value: 'Old Photograph'
            },
            {
              image: 'https://cdn.zhishuyun.com/04f17d89-d913-4700-a422-99fa97fa79c9.png',
              label: '单线图',
              value: 'One-line drawing'
            },
            {
              image: 'https://cdn.zhishuyun.com/281cfaac-ec59-4f5c-ab2b-f15d7481d752.png',
              label: '素描',
              value: 'Sketch Drawing'
            },
            {
              image: 'https://cdn.zhishuyun.com/091d68cf-533c-4b76-90be-d5983b9ba80b.png',
              label: '水粉',
              value: 'Gouache'
            },
            {
              image: 'https://cdn.zhishuyun.com/a652c6b2-f0f6-4ef4-bf1b-9053e1daf85b.png',
              label: '电影风格',
              value: 'Film style'
            },
            {
              image: 'https://cdn.zhishuyun.com/0aaafc79-9094-4a97-a07d-a01f88d276b1.png',
              label: '写实的',
              value: 'Photorealistic'
            },
            {
              image: 'https://cdn.zhishuyun.com/aa6489ad-8b40-46ae-83a6-f636772084e9.png',
              label: '徽标',
              value: 'Logo'
            },
            {
              image: 'https://cdn.zhishuyun.com/e3e96805-6bcd-4608-b012-a8931e75662a.png',
              label: '卡通',
              value: 'Cartoon'
            },
            {
              image: 'https://cdn.zhishuyun.com/11d53af4-ec2d-4256-8ddc-18105df57047.png',
              label: '大理石雕像',
              value: 'Marble Statue'
            },
            {
              image: 'https://cdn.zhishuyun.com/d0109889-d2a6-49ee-9f5c-49f2033966d8.png',
              label: '1800年代',
              value: '1800s'
            },
            {
              image: 'https://cdn.zhishuyun.com/86a3fb48-1ef0-422a-809a-580892aa0b9d.png',
              label: '1980年代',
              value: '1980s'
            },
            {
              image: 'https://cdn.zhishuyun.com/8b07aae4-b6f6-45ad-a556-7206b2945025.png',
              label: '等距动画',
              value: 'Isometric anime',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/3be49d3c-e431-4bce-b2bb-fc53f763b348.png',
              label: '分析性绘图',
              value: 'Analytic drawing',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/4d31c2dc-2a0b-4465-b3e8-bffd7c5fed25.png',
              label: '着色书',
              value: 'Coloring book',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/a19dde67-65b2-4923-8895-9e960cf050ee.png',
              label: '信息图画',
              value: 'Infographic drawing',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/f57db729-8692-4524-a373-b495d14ec77e.png',
              label: '双重曝光',
              value: 'Double exposure',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/f8ff8db0-62dc-4414-b309-7fdf2021e45c.png',
              label: '图示性绘图',
              value: 'Diagrammatic drawing',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/426447cf-dd10-4c91-b928-e7a3aa4c253a.png',
              label: '二维插图',
              value: '2D illustration',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/25e0edfe-776f-4be0-9791-bb729cca81b3.png',
              label: '图解式画像',
              value: 'Diagrammatic portrait',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/819c367c-ad03-4bf8-87a9-38ba53aa00f6.png',
              label: '像素艺术',
              value: 'Pixel art',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/2c4bbd7b-fc59-4f38-b844-762bf2366042.png',
              label: '黑暗幻想',
              value: 'Dark fantasy',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/bd786eed-e3ee-4e3a-9473-acbd1ee4306c.png',
              label: '浮世绘艺术',
              value: 'Ukiyo-e art',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/1951d276-5502-428a-8694-1b311d8a5540.png',
              label: '绗缝纸',
              value: 'Paper quilling',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/4f9bcc9c-8b0e-47f4-87b9-4b4d78a8891a.png',
              label: '剪纸工艺',
              value: 'Paper cut craft'
            },
            {
              image: 'https://cdn.zhishuyun.com/4775f61f-446b-4312-b824-c91c6ecdb372.png',
              label: '虹彩',
              value: 'Iridescent',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/29fbc528-56f0-4eb0-a5a2-2312d53d55b4.png',
              label: '拼布拼贴画',
              value: 'Patchwork collage',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/aa03b06a-fac8-45ec-830f-2a6e7ecab5c2.png',
              label: '欧普艺术',
              value: 'Op art',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/29015f2a-3c9c-43c5-808a-23fbbb7bcf2f.png',
              label: '日本墨水',
              value: 'Japanese ink',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/a65f8f7e-46a9-4ccf-8ee5-720d0c222471.png',
              label: '粉笔画',
              value: 'Pastel drawing'
            },
            {
              image: 'https://cdn.zhishuyun.com/a0cda2b1-b227-4230-8842-feab55edd6c7.png',
              label: '滴漆艺术',
              value: 'Dripping art'
            },
            {
              image: 'https://cdn.zhishuyun.com/c4aab372-ec55-4a7e-af94-4469f45c23c5.png',
              label: '纹身艺术',
              value: 'Tattoo art',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/5040fbb2-6fa7-4e8f-86ac-f23c1c3e291c.png',
              label: '16比特',
              value: '16-Bit',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/b67249a1-36fa-443a-8b41-c167a5002e10.png',
              label: '8比特',
              value: '8-Bit',
              advanced: true
            },

            {
              image: 'https://cdn.zhishuyun.com/1c9600b4-6995-4dcb-b363-40ee38049151.png',
              label: '琥珀色调',
              value: 'Amber',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/e2d34946-3148-4f92-ad73-40f6f1208516.png',
              label: '解剖学绘图',
              value: 'Anatomical Drawing',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/19940f31-037e-4a8f-a71c-605e16ac9631.png',
              label: '古代',
              value: 'Ancient'
            },
            {
              image: 'https://cdn.zhishuyun.com/b714b3d9-2f97-49fb-bf85-99a716bf0c78.png',
              label: '日式动画',
              value: 'Anime',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/d88c3080-cd54-4342-ac91-dac326ee1060.png',
              label: '阿拉伯',
              value: 'Arabic',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/dc54b749-8e69-4252-9b90-fc1448fa9397.png',
              label: '块状的',
              value: 'Blocky',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/d8009295-2f4b-48d8-896e-46d0f5939923.png',
              label: '蓝图',
              value: 'Blueprint',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/5cc39277-16e0-46d6-9310-b0722479713b.png',
              label: '漫画书',
              value: 'Comicbook',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/b9900d01-20bc-408b-9637-779cc22c493c.png',
              label: '加勒比',
              value: 'Caribbean',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/fedabd4e-a9bb-4bb0-a4ec-8fc48bc74c78.png',
              label: '天人般',
              value: 'Celestial',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/00f1f097-1d72-435f-b47d-656f8e194dc2.png',
              label: '纤维素',
              value: 'Cellulose',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/a002bccf-6287-4b28-a5a7-c1cf5cb07734.png',
              label: '炭色风格',
              value: 'Charcoal Style',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/e218ab68-e430-4541-9501-02ee2d7aeda9.png',
              label: '色度',
              value: 'Chromatic',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/bd5a79d9-c73d-46c3-974f-932751ff8e46.png',
              label: '珊瑚',
              value: 'Coral',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/58dd439c-cae7-434f-9a83-ac6aefd6e417.png',
              label: '概念艺术',
              value: 'Concept Art',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/767fe9f3-69d0-4e16-9060-41e6cf1b1fe1.png',
              label: '斐波那契数列',
              value: 'Fibonacci',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/4b78ebb1-5091-43d8-a020-88ffb3719edd.png',
              label: '赛博朋克',
              value: 'Cyberpunk',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/34d35d5c-a2e4-4e8e-aafd-3d3c08499389.png',
              label: '堕落的',
              value: 'Diabolic',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/8e29e2b4-4899-491d-a5dc-5ebbb1ff2758.png',
              label: '衍射分级',
              value: 'Diffraction Grading',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/996c6d93-94aa-438a-96d5-278e22e54f5f.png',
              label: '光速',
              value: 'Lightspeed',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/57f3ad49-0940-44e2-a31a-a4872497bae7.png',
              label: '液体',
              value: 'Liquid',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/a9ff43a9-dadf-4bbc-9a7a-72fd3908d39a.png',
              label: '点状',
              value: 'Dots',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/acff2bf9-1907-4a0f-be23-897c71caf60e.png',
              label: '沙丘',
              value: 'Dune',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/4a2abc45-ba65-4e2d-8399-8d44491c8a64.png',
              label: '滴落的油漆',
              value: 'Dripping Paint',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/7dc4e93f-07a8-45ec-9e8a-89c3f619fd40.png',
              label: '电子电路',
              value: 'Electronic Circuitry',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/cf502cba-ee64-41fd-a388-93f6357fc7cc.png',
              label: '电气的',
              value: 'Electrical',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/fd6a696b-3102-4301-8fce-5a7fd401231a.png',
              label: '未来的',
              value: 'Futuristic',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/0fe8fca5-b3d9-4fab-b390-fff7c0f4f594.png',
              label: '蚀刻',
              value: 'Etching',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/46577726-f0ab-4750-81c6-0d4d865ba4bd.png',
              label: '地外世界',
              value: 'Extraterrestrial',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/faa06af4-9988-4e39-9f13-ecdd29e1e20a.png',
              label: '缝隙艺术',
              value: 'Glitchart',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/4380f6af-aaeb-41fd-bcaf-2efadcc3e08f.png',
              label: '花卉类的',
              value: 'Floral',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/096683c4-8e91-4ef0-8211-8a6dcef5298d.png',
              label: '分形',
              value: 'Fractal',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/10ce713b-a5bc-400b-a0c8-bcec4f7e6548.png',
              label: '前历史性的',
              value: 'Pre Historic',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/6382ad4e-1818-4ab1-b493-10afdb43c196.png',
              label: '原核生物',
              value: 'Prokaryotic',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/48205fb3-e48b-4219-ad53-d307e1e686a7.png',
              label: '恐怖',
              value: 'Horror',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/d0567b20-8f93-4b16-a775-8ca0708a7a50.png',
              label: '冰河时代',
              value: 'Ice Age',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/cc1455a5-c139-400d-8a54-121176f196e1.png',
              label: '侏罗纪',
              value: 'Jurassic',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/84e2bfe2-60bb-4323-936b-18dbb1c8cfa1.png',
              label: '针织的',
              value: 'Knitted',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/2e1ffddf-daa1-4e57-bc92-d16484ef8e34.png',
              label: '波尔卡',
              value: 'Polka',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/9c2670df-3e39-45a7-ad76-ae17502d018f.png',
              label: '乳胶',
              value: 'Latex',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/d4de1735-235d-461d-b93f-2bf3c280ccfe.png',
              label: '粉彩',
              value: 'Pastel',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/37f26555-f634-4964-8bac-ec8a955273d4.png',
              label: '曼陀罗',
              value: 'Mandala',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/f62aa376-1378-45a6-abd0-71bc7bbe49c7.png',
              label: '细菌',
              value: 'Molecular',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/fc135428-1835-453d-afef-aaf72a7cfcbc.png',
              label: '梅卡巴',
              value: 'Merkaba',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/5caf594b-0f0c-455f-b8a8-8c15a189d0dc.png',
              label: '线粒体',
              value: 'Mitochondria',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/088e3067-0abe-4f3d-bcb8-f6937e860d1e.png',
              label: '涂鸦',
              value: 'Graffiti',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/06230561-916a-4bc5-ad85-9386cf27bf1c.png',
              label: '图形小说',
              value: 'Graphic Novel',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/e47f7931-d588-4c4a-87c8-3f7137e7f727.png',
              label: '多维度',
              value: 'Multidimensional',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/d2443c93-3227-4216-afd1-b86287ac5140.png',
              label: '美国国家航空航天局',
              value: 'NASA',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/a86a2f67-273c-4edf-9be9-ceecc983c93d.png',
              label: '星云',
              value: 'Nebula',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/ad1e588c-5892-48ee-a7c2-103c2b4868fc.png',
              label: '霓虹灯',
              value: 'Neon'
            },
            {
              image: 'https://cdn.zhishuyun.com/5a133976-208e-460f-8296-a4ad19809490.png',
              label: '核电',
              value: 'Nuclear',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/c99f5082-314b-49e9-8875-b40319ed3cfc.png',
              label: '轨道',
              value: 'Orbital',
              advanced: true
            },

            {
              image: 'https://cdn.zhishuyun.com/63809059-6ae6-49ff-ad96-ed4ae45a2464.png',
              label: '光线追踪',
              value: 'Ray Tracing',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/cdcf0c05-e7ad-421e-b513-640bcc3d04cc.png',
              label: '现实的',
              value: 'Realistic'
            },
            {
              image: 'https://cdn.zhishuyun.com/019dc7be-b0e2-4da2-94d4-191226d58dbf.png',
              label: '文艺复兴',
              value: 'Renaissance',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/d46d3c03-a924-4a0f-b032-e8dbca6ad37e.png',
              label: '复古',
              value: 'Retro'
            },
            {
              image: 'https://cdn.zhishuyun.com/bc13e200-6865-474b-8fe4-cf0725cf3caf.png',
              label: '日记本',
              value: 'Risograph',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/f8533acc-807b-4f03-8f39-338ee6ff5d53.png',
              label: '折纸',
              value: 'Origami',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/b0ff3593-aef3-4dd2-a5f4-548c6febb2e2.png',
              label: '观赏性',
              value: 'Ornamental',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/002c6a5d-b251-43bb-b713-d133f828c0a4.png',
              label: '太空',
              value: 'Space',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/641327df-93cc-4746-a55e-667dbb8c1563.png',
              label: '飞溅的油漆',
              value: 'Splatter Paint',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/42527f9e-6cf0-40a6-bc9b-361d2baf9bf9.png',
              label: '喷漆',
              value: 'Spray Paint',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/98bf8e01-9dd8-434b-81df-77cfd3627243.png',
              label: '斯格格勒斯',
              value: 'Squiggles',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/26868352-5d9a-4bcc-9926-166927a2be35.png',
              label: '缝合',
              value: 'Stitching',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/23819218-bdbc-4746-a507-7664836a4f59.png',
              label: '静脉',
              value: 'Veins',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/2fd3de3d-7211-4cce-b63b-a857d7621c72.png',
              label: '街头艺术',
              value: 'Street Art',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/80422ede-79fb-4149-bd0a-85bf0ac75a3d.png',
              label: '超现实',
              value: 'Surreal'
            },
            {
              image: 'https://cdn.zhishuyun.com/94956306-55de-470b-8a2a-28354d0e556f.png',
              label: '对称性',
              value: 'Symmetric',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/0098f2a0-b089-4e64-8a86-ffa137605087.png',
              label: '合成波',
              value: 'Synth-wave',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/f50d33b2-9c91-4939-8f2d-7b5ce185d138.png',
              label: '技术性',
              value: 'Technological',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/a446a6eb-444c-4073-8a8e-6f43e65491c2.png',
              label: '创世纪',
              value: 'Tron',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/8026ccad-aa11-4b0d-ad81-eb870a695a81.png',
              label: '热带',
              value: 'Tropical',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/22c16c64-068c-470e-9b80-2849297aad9a.png',
              label: '超现代',
              value: 'Ultra Modern'
            },
            {
              image: 'https://cdn.zhishuyun.com/f67bd4b6-3f43-4da8-bdcb-67cd39cb38f9.png',
              label: '虫洞',
              value: 'Wormhole',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/2e2a1ca9-8791-41c6-9ff0-0ac21a13d1c5.png',
              label: '褶皱的',
              value: 'Wrinkled',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/3507c78d-a065-462c-a17c-fd5ed4677644.png',
              label: '火山型',
              value: 'Volcanic',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/69263783-0610-45b0-9ec4-acac961da092.png',
              label: '湿漆',
              value: 'Wet Paint',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/9022fc82-d6f7-47e2-90b1-ad96fbba5257.png',
              label: '狂野西部',
              value: 'Wild West',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/23de882d-4e5d-40b5-9f00-d0573c443212.png',
              label: '风',
              value: 'Wind',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/e3a58af1-79bc-48f3-871c-36472da2584b.png',
              label: '迷你仿制',
              value: 'Miniature Faking',
              advanced: true
            }
          ]
        },
        lighting: {
          displayName: '光照',
          items: [
            {
              image: 'https://cdn.zhishuyun.com/a4b9110f-e838-4c52-8ab8-f2637ea753df.png',
              label: '重点照明',
              value: 'Accent Lighting'
            },
            {
              image: 'https://cdn.zhishuyun.com/c4c16a69-28d7-4b38-8ea2-3ce49d5c6b07.png',
              label: '背光',
              value: 'Backlight'
            },
            {
              image: 'https://cdn.zhishuyun.com/7fd2cd5c-7671-4b40-85a0-230de9c37234.png',
              label: '黑光',
              value: 'Blacklight',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/a08bff6e-8a0f-4d56-aa91-576f0a9921f2.png',
              label: '黄金时段光线',
              value: 'Golden hour light',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/3cd28696-493f-4b3e-9187-9d1a4c17e95b.png',
              label: '烛光',
              value: 'Candlelight'
            },
            {
              image: 'https://cdn.zhishuyun.com/58c9a17e-f7d5-4481-abc8-9e9b66609a4d.png',
              label: '音乐会照明',
              value: 'Concert Lighting',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/efb8893c-8bd6-4c7d-8e45-6e0626f69479.png',
              label: '白昼的光线',
              value: 'Crepuscular Rays',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/27b90e83-09b0-4339-9b2c-48fe6fe45bdd.png',
              label: '阳光直射',
              value: 'Direct Sunlight'
            },
            {
              image: 'https://cdn.zhishuyun.com/d33cb17d-e2a5-4ca3-b68a-93904d2618d7.png',
              label: '灰尘',
              value: 'Dust',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/3af133d0-5a86-45a9-a16e-f23e6cc68b24.png',
              label: '工作室照明',
              value: 'Studio lighting',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/6bc889b1-a563-4890-9117-7d3ded276caa.png',
              label: '轮辋灯',
              value: 'Rim light',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/d770265a-066b-413f-a405-a52d68e2f1c7.png',
              label: '体积照明',
              value: 'Volumetric Lighting',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/7c83560a-6837-43b2-b296-f74db549accf.png',
              label: '荧光',
              value: 'Fluorescent'
            },
            {
              image: 'https://cdn.zhishuyun.com/6ffc8688-dfd0-4ede-a6bc-91bf8679adc9.png',
              label: '发光',
              value: 'Glowing',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/63bc0645-ab94-4327-84b8-e226020c6c0f.png',
              label: '荧光棒',
              value: 'Glow-stick',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/824111e9-7ebf-47ec-80ef-a6ad0a1d949b.png',
              label: '放射性发光体',
              value: 'Glow Radioactive',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/9d23de16-57b3-42be-89d2-478de2666483.png',
              label: '熔岩的光芒',
              value: 'Lava Glow',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/d801ee47-02a0-455d-b333-76ad73a4fdcd.png',
              label: '月光',
              value: 'Moonlight'
            },
            {
              image: 'https://cdn.zhishuyun.com/6d1400a8-e168-46c9-89e8-5e701f8824b2.png',
              label: '自然照明',
              value: 'Natural Lighting'
            },
            {
              image: 'https://cdn.zhishuyun.com/9bb6c4ce-9076-41eb-8ace-43a4fa7e0c03.png',
              label: '霓虹灯',
              value: 'Neon Lamp'
            },
            {
              image: 'https://cdn.zhishuyun.com/ac3fe310-3639-4fc0-b56e-4d69278bc2ca.png',
              label: '夜总会照明',
              value: 'Nightclub Lighting',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/c9331a92-87d2-43b5-9319-24c8629bffd1.png',
              label: '核废料的光芒',
              value: 'Nuclear Waste Glo',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/40ccdbfb-84a7-49f7-9999-92db58802c65.png',
              label: '量子点',
              value: 'Quantum Dot',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/d5411604-4e66-4187-9b37-48eb683be65e.png',
              label: '聚光灯',
              value: 'Spotlight'
            },
            {
              image: 'https://cdn.zhishuyun.com/b1f16a4b-fb3d-4783-9c66-c3567e79baeb.png',
              label: '边缘光',
              value: 'Edge light',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/97fecbc1-a164-48e2-bdf0-c69975c16d63.png',
              label: '冷光',
              value: 'Cold light'
            },
            {
              image: 'https://cdn.zhishuyun.com/7087f2fe-f48c-4b72-95bc-c697b56e8b0e.png',
              label: '关键照明',
              value: 'Key lighting',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/5ab92c7e-bca1-4fbc-8975-6d9fb3f15626.png',
              label: '环境光',
              value: 'Ambient Light',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/ac80d283-5532-4664-bbe5-42fbb9582a63.png',
              label: '高调照明',
              value: 'High key lighting',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/add3524d-fc90-45a8-9edc-348bb1f79075.png',
              label: '低调照明',
              value: 'Low key lighting',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/42174ff8-3080-4004-9ae2-c2ff919e1145.png',
              label: '激励的照明',
              value: 'Motivated lighting',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/09f3d509-a366-44dc-be3b-b39712d0fac1.png',
              label: '三点式照明',
              value: '3 point lighting',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/794a114e-cd4d-4e83-a187-5e979296d125.png',
              label: '频闪灯',
              value: 'Strobe light',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/9e6ec476-3ac8-4246-964f-a1d89a6d19e9.png',
              label: '太阳光',
              value: 'Sun light'
            },
            {
              image: 'https://cdn.zhishuyun.com/4360a40b-2126-43c2-be8e-e482978e1ea6.png',
              label: '紫外线',
              value: 'Ultraviolet',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/8b6bea86-9ed1-4fc8-9040-8fc2b64abbff.png',
              label: '美丽的照明',
              value: 'Beautiful Lighting',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/a8d1f754-fb35-433d-8a36-e073b0fe6fa2.png',
              label: '穆迪照明',
              value: 'Moody Lighting',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/77270807-ca3b-4d02-a9b4-badf8aa48c36.png',
              label: '柔和照明',
              value: 'Soft Lighting'
            }
          ]
        },
        artists: {
          displayName: '艺术家',
          items: [
            {
              image: 'https://cdn.zhishuyun.com/160cfc29-f258-4795-b663-f687adba19bf.png',
              label: '米开朗基罗',
              value: 'Michelangelo'
            },
            {
              image: 'https://cdn.zhishuyun.com/ed0bf2ad-138d-4c8d-bce9-a98299b1ee83.png',
              label: '莫奈',
              value: 'Monet'
            },
            {
              image: 'https://cdn.zhishuyun.com/58d9b130-e7b2-4eb8-a71e-7108b3bd4c26.png',
              label: '保罗-塞尚',
              value: 'Paul Cezanne',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/1247615a-6e75-49e6-842a-b0fb84016d3d.png',
              label: '马克-罗斯科',
              value: 'Mark Rothko',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/a7d9d9dd-8add-43d3-942e-8d1199fe277f.png',
              label: '保罗-克利',
              value: 'Paul Klee',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/caf5701a-b652-4fab-8467-0c00303d01f3.png',
              label: '毕加索',
              value: 'Picasso'
            },
            {
              image: 'https://cdn.zhishuyun.com/fbb63634-659a-4d2d-bc7b-0fb3399f7061.png',
              label: '皮特-蒙德里安',
              value: 'Piet Mondrian',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/29fb173b-17b4-4b05-a63c-e31ce161fe8c.png',
              label: '皮埃尔-奥古斯特-雷诺',
              value: 'Pierre Auguste Rer',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/556f8a48-0b12-49a7-b150-aed40278d3f6.png',
              label: '伦勃朗',
              value: 'Rembrandt'
            },
            {
              image: 'https://cdn.zhishuyun.com/b44d947e-2a14-4db2-880d-332c1aeeb303.png',
              label: '雷内-马格里特',
              value: 'Rene Magritte',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/0cfcda4a-7e7f-4ec4-ad4f-b4877a900a50.png',
              label: '罗伊-利希滕斯坦',
              value: 'Roy Lichtenstein',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/e592bf88-d9b8-4787-88dd-9ff8e7e9268c.png',
              label: '萨尔瓦多-达利',
              value: 'Salvador Dali',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/3bbde342-565b-4ea0-8a4c-42b3c109c205.png',
              label: '桑德罗-波提切利',
              value: 'Sandro Botticelli',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/bfdf6d50-24ab-4b5c-a3de-c8d77d858b04.png',
              label: '村上隆',
              value: 'Takashi Murakami',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/bc67c0ba-614f-46f0-a6ec-047fa561fc01.png',
              label: '梵高',
              value: 'Van Gogh'
            },
            {
              image: 'https://cdn.zhishuyun.com/984a18fa-8050-4084-95d5-732b7ede8e37.png',
              label: '瓦西里-康定斯基',
              value: 'Wassily Kandinsky',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/48bce45c-6b25-4678-9be8-40707c8e5f43.png',
              label: '马特-科利肖',
              value: 'Mat Collishaw',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/6b2851d0-ec8d-4c07-86ed-1eafdd70e1fe.png',
              label: '草间弥生',
              value: 'Yayoi Kusama',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/9d691d5c-5560-409b-b998-c979b29902e6.png',
              label: '伊戈尔-莫尔斯基',
              value: 'Igor Morski',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/950cb143-ab40-4bee-80f7-092d0c2a7bc4.png',
              label: '新海诚',
              value: 'Shinkai Makoto'
            },
            {
              image: 'https://cdn.zhishuyun.com/94adf414-a1cc-4b84-b52d-18cd2586df17.png',
              label: '皮克斯',
              value: 'Pixar'
            },
            {
              image: 'https://cdn.zhishuyun.com/ccd4d148-e332-4d7e-bbe6-9f1dd68082a8.png',
              label: '京都动漫',
              value: 'Kyoto Anime'
            },
            {
              image: 'https://cdn.zhishuyun.com/b5f5f99a-be40-4fa7-a86a-fd51578a4052.png',
              label: '杰里-平克尼',
              value: 'Jerry Pinkney',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/7a4dba74-21ad-4088-89da-6a48104d811d.png',
              label: '宫崎骏',
              value: 'Hayao Miyazaki'
            },
            {
              image: 'https://cdn.zhishuyun.com/28477b7e-85d4-4803-b525-938aa2ce3383.png',
              label: 'BeatrixPotter',
              value: 'Beatrix Potter',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/13854cb8-c478-43c9-9f51-8ac1933b1498.png',
              label: '乔恩-克拉森',
              value: 'Jon Klassen',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/6685c7e0-ea11-488b-a8a0-610032020dfb.png',
              label: '凯-塞奇',
              value: 'Kay Sage',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/cb0c3490-dcd4-488f-96e0-45b9ee671182.png',
              label: '杰弗里-凯瑟琳-琼斯',
              value: 'Jeffrey Catherine Jones',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/72f000c5-d8d6-4015-acd4-79961e53ac50.png',
              label: '亚科夫-阿加姆',
              value: 'Yaacov Agam',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/f1bd0c4d-af96-4785-99bb-3a70b7f80834.png',
              label: '大卫-霍克尼',
              value: 'David Hockney',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/ad0e89d9-214a-4599-90f1-ee5dc0b5592d.png',
              label: '维克多-莫斯科索',
              value: 'Victor Moscoso',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/c3b004e0-f583-4a75-b6cf-0cc60c89b2cf.png',
              label: '拉斐尔派',
              value: 'Raphaelite'
            },
            {
              image: 'https://cdn.zhishuyun.com/9c59d174-1e1f-4ef9-b657-1beb57f58088.png',
              label: '斯特凡-科德尔',
              value: 'Stefan Koidl',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/09485865-35a8-4456-a34c-65a8a1c8d2c2.png',
              label: '石田穗',
              value: 'Sui Ishida',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/31442dfd-d6a8-4674-aade-8543190251b4.png',
              label: 'Swoon',
              value: 'Swoon',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/842beff4-d333-4388-9880-eec6fd4baa6c.png',
              label: '塔莎-图德',
              value: 'Tasha Tudor',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/68c419f3-6f2c-4fbd-a251-ce289d4a9890.png',
              label: '丁托列托',
              value: 'Tintoretto',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/9a3d95da-5019-4fdd-83b9-ec334e609c9d.png',
              label: '西奥多-罗宾逊',
              value: 'Theodore Robinsor',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/e11cb0a6-2f0e-4d8d-aa0e-8b7378423790.png',
              label: '蒂蒂安',
              value: 'Titian',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/d3e59ba8-10e6-4d58-a732-e35d579cd3fc.png',
              label: '王凌(wlop)',
              value: 'WLOP',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/70f22f51-9328-4070-b9aa-578db7d4c502.png',
              label: 'YanjunCheng',
              value: 'Yanjun Cheng',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/e1203ff8-cb64-409e-8ba6-06f89645a843.png',
              label: '新川洋司',
              value: 'Yoji Shinkawa',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/6b6d7746-e38b-44db-98d8-51d59ed7531f.png',
              label: 'Zhelong Xu',
              value: 'Zhelong Xu',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/13b9621b-ff7e-4377-9550-0ca82d0f1afb.png',
              label: '阿莱娜-艾娜米',
              value: 'Alena Aenami',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/26d30765-3201-49e9-a4a9-c7c3b8c071ef.png',
              label: '安顿-法德维',
              value: 'Annton Fadeevi',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/9b4c2bc7-16a8-4807-ad0e-ee9bdc80f1a0.png',
              label: '查理-鲍特',
              value: 'Charlie Bowater',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/2f50d67e-3d7e-4e06-a198-5926ce7f357d.png',
              label: '科里-洛夫蒂斯',
              value: 'Cory Loftis',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/47823270-16a6-49cc-a11d-99122a037c68.png',
              label: 'Fenghua Zhong',
              value: 'Fenghua Zhong',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/1a66b5fd-cbf9-4e09-b817-6effed77b5c2.png',
              label: '格雷格-鲁特考斯基',
              value: 'Greg Rutkowski',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/d05a459a-132b-45a8-b2f3-a978eeeb44af.png',
              label: 'Hong SoonSang',
              value: 'Hong SoonSang',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/020dbf7f-f026-47bd-90f1-4049407409a1.png',
              label: '丹尼斯-斯托克',
              value: 'Dennis Stock',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/9c1ccc1d-121e-4182-aea0-04eac840869d.png',
              label: '米歌尔-利索夫斯基',
              value: 'Michal Lisowski',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/3292404b-e654-4c06-bcd6-5e47a2adf329.png',
              label: '保罗-莱尔',
              value: 'Paul Lehr',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/079c6053-23ad-4dc9-8166-64c5fe2f1e1a.png',
              label: '罗斯-特兰',
              value: 'Ross Tran',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/0f267ba1-c031-4008-9ead-630a4bec886a.png',
              label: '安东-皮耶克',
              value: 'Anton Pieck',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/574dd25f-2116-4718-aed6-7d9be3636e22.png',
              label: '卡尔-巴克斯',
              value: 'Carl Barks',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/38dcdfb5-0003-46f4-8c9d-5857c95f9e59.png',
              label: '阿尔方斯-穆夏',
              value: 'Alphonse Mucha',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/65f2af96-e875-41f8-9797-3d34dbdf0ea4.png',
              label: '安迪-沃霍尔',
              value: 'Andy Warhol',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/801224a0-da77-4095-8799-d288d1ec3c3d.png',
              label: '班克斯',
              value: 'Banksy',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/925c6c86-9b69-45ce-a10d-a2c64d4e0db2.png',
              label: '弗朗西斯科-德-戈雅',
              value: 'Francisco De Goya',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/fbb81b10-c579-4dcc-a76a-c099dc0b6c20.png',
              label: '卡拉瓦乔',
              value: 'Caravaggio',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/116efedd-42ea-404e-959e-607a9766001a.png',
              label: '选戈-里维拉',
              value: 'Diego Rivera',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/6f2c1d37-f8ae-4d72-8db1-d9fb04df7114.png',
              label: '大卫-霍克尼',
              value: 'David Hockney',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/b74b6b97-f6d7-4a34-840c-a81c69b9d941.png',
              label: '马克-夏加尔',
              value: 'Marc Chagall'
            },
            {
              image: 'https://cdn.zhishuyun.com/f18ac9a3-a986-4670-813b-6fb81060ed48.png',
              label: '埃德加-德加',
              value: 'Edgar Degas',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/275b32e5-9995-46cc-babc-43a0d1aa5d19.png',
              label: '尤金-德拉克洛瓦',
              value: 'Eugene Delacroix',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/500edde5-973c-4ba4-aae1-1a3d53a9b27f.png',
              label: '弗朗西斯-培根',
              value: 'Francis Bacon',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/f7b5cc34-a796-4f45-823c-07122ec46ef6.png',
              label: '弗里达-卡洛',
              value: 'Frida Kahlo',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/7e41ead3-f54f-4d5f-8353-b2770d75c41b.png',
              label: '加拉尔德-布罗姆',
              value: 'Garald Brom',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/4a46247a-cd9b-48fd-b247-8268d9a891bf.png',
              label: '古斯塔夫-克里姆特',
              value: 'Gustav Klimt',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/3793eae9-61e9-4f16-9c0c-a77c194c45bc.png',
              label: '亨利-马蒂斯',
              value: 'Henri Matisse',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/dffa261d-755b-483d-88b7-058c09efd6af.png',
              label: '杰克-科比',
              value: 'Jack Kirby',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/4cda1423-455b-463f-981d-b2af8ae1dd95.png',
              label: '杰克逊-波洛克',
              value: 'Jackson Pollock',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/d318e4bc-d69f-4e7a-b6ae-49557e3cd569.png',
              label: '约翰内斯-维梅尔',
              value: 'Johannes Vermeer',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/4ee7f9d2-01c0-4043-90f3-0174878a2ce7.png',
              label: '让-米歌尔-巴斯奇亚',
              value: 'Jean Michel Basquiat',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/f60eb307-78b3-4f5e-bfd9-07603bc383c9.png',
              label: '马塞尔-杜尚',
              value: 'Marcel Duchamp',
              advanced: true
            }
          ]
        },
        material: {
          displayName: '材质',
          items: [
            {
              image: 'https://cdn.zhishuyun.com/f2ce056d-6a89-4b40-b026-5a60cbb1efda.png',
              label: '铝合金',
              value: 'Aluminum'
            },
            {
              image: 'https://cdn.zhishuyun.com/069c6b1f-0666-4df6-bde6-a1729b33ade1.png',
              label: '砖块',
              value: 'Brick'
            },
            {
              image: 'https://cdn.zhishuyun.com/39f2cbb9-be6a-4669-a7c3-b01dfbb2b563.png',
              label: '铜质',
              value: 'Bronze'
            },
            {
              image: 'https://cdn.zhishuyun.com/42b30429-2733-41a5-aa4c-e3e0cd50528a.png',
              label: '碳纤维',
              value: 'Carbon Fiber'
            },
            {
              image: 'https://cdn.zhishuyun.com/90eeef27-6bdb-4f36-8e17-f1bb49881258.png',
              label: '纸板',
              value: 'Cardboard'
            },
            {
              image: 'https://cdn.zhishuyun.com/470235fb-19a8-4ba8-ac9b-236abecf0985.png',
              label: '纤维素',
              value: 'Cellulose'
            },
            {
              image: 'https://cdn.zhishuyun.com/a8621e16-b046-4300-ab24-09602f734cb9.png',
              label: '陶瓷',
              value: 'Ceramic'
            },
            {
              image: 'https://cdn.zhishuyun.com/af14acf6-92ff-42f8-ae14-ce4b63237bd5.png',
              label: '棉花',
              value: 'Cotton'
            },
            {
              image: 'https://cdn.zhishuyun.com/d93e6f18-3729-46cc-aa96-9662f2abae3d.png',
              label: '布料',
              value: 'Fabric'
            },
            {
              image: 'https://cdn.zhishuyun.com/660533aa-dac7-4968-b27e-0f085b9a67a5.png',
              label: '光纤',
              value: 'Fiber Optic'
            },
            {
              image: 'https://cdn.zhishuyun.com/94be6d51-5cb3-4362-8274-7d833a88bb79.png',
              label: '箔',
              value: 'Foil'
            },
            {
              image: 'https://cdn.zhishuyun.com/b89e102d-2fef-4619-8427-94c6bfbeb832.png',
              label: '纱线',
              value: 'Yarn',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/b72ef152-11a7-4c51-b6b4-dc4308995f9e.png',
              label: '玻璃',
              value: 'Glass'
            },
            {
              image: 'https://cdn.zhishuyun.com/bca80e91-46ba-4793-b29c-1b5c47b201d7.png',
              label: '金色',
              value: 'Gold',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/3d1e4da5-404b-4f89-8e06-988de47208bd.png',
              label: '软糖',
              value: 'Gummies',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/8afba6b0-a8a5-49c9-bfc5-ebd7b0e12443.png',
              label: '乳胶',
              value: 'Latex'
            },
            {
              image: 'https://cdn.zhishuyun.com/d5c39f1c-1be0-4065-80af-e1cb4e627cf2.png',
              label: '皮革制品',
              value: 'Leather'
            },
            {
              image: 'https://cdn.zhishuyun.com/6e41e8bd-cb0b-4504-8655-a3b1b32ac11c.png',
              label: '镁合金',
              value: 'Magma'
            },
            {
              image: 'https://cdn.zhishuyun.com/f816fffa-4a7f-4d60-afcb-e19b0c36d176.png',
              label: '金属质地',
              value: 'Metallic'
            },
            {
              image: 'https://cdn.zhishuyun.com/74c9fe01-37e6-4d05-831a-5778eb34c521.png',
              label: '镍',
              value: 'Nickel',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/85186eac-1806-4739-9289-8d76aac359b3.png',
              label: '尼龙',
              value: 'Nylon'
            },
            {
              image: 'https://cdn.zhishuyun.com/355d9507-62fa-4c69-986f-def2f2f930c5.png',
              label: '纸张',
              value: 'Paper'
            },
            {
              image: 'https://cdn.zhishuyun.com/6c2626b2-191e-4b85-a97d-e561a2b5c79b.png',
              label: '塑胶',
              value: 'Plastic',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/ff0d301d-8181-463c-a276-9b4805321afd.png',
              label: '石英',
              value: 'Quartz'
            },
            {
              image: 'https://cdn.zhishuyun.com/7b90754d-2fa5-490e-a73b-d2887525d2e6.png',
              label: '包裹',
              value: 'Wrap',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/7411e62a-546e-4cd2-8446-73c4fb8f103b.png',
              label: '木制的',
              value: 'Wooden'
            },
            {
              image: 'https://cdn.zhishuyun.com/44e8830f-4be2-471d-a9d4-aaf4913e7451.png',
              label: '粘液',
              value: 'Slime',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/16b10e75-a7e7-4b87-804a-2bfc9c18096f.png',
              label: '雕刻',
              value: 'Engraving'
            },
            {
              image: 'https://cdn.zhishuyun.com/b66ec7e2-fd82-4edd-a523-34b87872f544.png',
              label: '象牙',
              value: 'Ivory'
            },
            {
              image: 'https://cdn.zhishuyun.com/098b954d-1197-414e-b4bd-68e3928b9eb3.png',
              label: '玄武岩',
              value: 'Basalt',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/b948dd7d-939b-48b5-b37c-09e0ebd6ede6.png',
              label: '松木',
              value: 'Pine',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/4c56fc7d-94c8-4055-9d6e-3bc6662c92d7.png',
              label: '钻石',
              value: 'Diamond'
            },
            {
              image: 'https://cdn.zhishuyun.com/70de6b75-bb29-4b2a-ae8a-016db33c8184.png',
              label: '紫水晶',
              value: 'Amethyst',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/8d2b60e1-c98c-4de2-8a67-4b10c0d2482a.png',
              label: '红宝石',
              value: 'Ruby',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/c0f01b99-32a6-4c34-a2d8-448fab08f126.png',
              label: '抛光',
              value: 'High polished',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/5091142a-3959-40f3-9ea5-f41a29584735.png',
              label: '拉丝',
              value: 'Brushed',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/3f84ddc5-5afe-41d1-85cc-2ded7a44d859.png',
              label: '哑光',
              value: 'Matte',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/655f5114-b3dd-4b9a-a3cb-94a1a814fb11.png',
              label: '缎面',
              value: 'Satin',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/6ec4178e-86e6-4026-aa86-e14eb4e92097.png',
              label: '喷砂',
              value: 'Sandblasted',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/1c9a4277-5550-4cd4-852a-c785d8505a0f.png',
              label: '乌木',
              value: 'Ebony',
              advanced: true
            }
          ]
        },
        camera: {
          displayName: '拍摄',
          items: [
            {
              image: 'https://cdn.zhishuyun.com/9bcf851a-7b94-4554-864b-edcbe0f67017.png',
              label: '虚化',
              value: 'Bokeh'
            },
            {
              image: 'https://cdn.zhishuyun.com/f4599568-5889-4da9-8852-8b5361c54412.png',
              label: '航拍视角',
              value: 'Aerial view'
            },
            {
              image: 'https://cdn.zhishuyun.com/bea180e2-9078-42bd-9392-b0ee2b372430.png',
              label: 'DSLR拍摄',
              value: 'Shot by DSLR',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/42444cbd-5442-4093-8911-645272c08863.png',
              label: '360全景图',
              value: '360Panorama'
            },
            {
              image: 'https://cdn.zhishuyun.com/99875464-0be7-44da-adf5-958d2c73eb31.png',
              label: '全景图',
              value: 'Panorama'
            },
            {
              image: 'https://cdn.zhishuyun.com/e3c3a204-9210-44da-b6fc-5f9a1fea52e0.png',
              label: '长焦镜头',
              value: 'Telephoto Lens'
            },
            {
              image: 'https://cdn.zhishuyun.com/7bd1f91d-cd6d-48d1-9f07-68382a54a552.png',
              label: '微距拍摄',
              value: 'Macro shot'
            },
            {
              image: 'https://cdn.zhishuyun.com/09aca457-2d96-4f60-b5ec-9fedf7a3fcb9.png',
              label: '显微镜',
              value: 'Microscopy'
            },
            {
              image: 'https://cdn.zhishuyun.com/fb39b4ab-d728-456b-8905-b4c0302f4094.png',
              label: '放大倍数',
              value: 'Magnification'
            },
            {
              image: 'https://cdn.zhishuyun.com/b9956b79-70b1-44af-bca3-5eddd412615a.png',
              label: '特写',
              value: 'Close up'
            },
            {
              image: 'https://cdn.zhishuyun.com/2c6b2c92-f790-44e1-bc65-b3182aa484bd.png',
              label: '全身',
              value: 'Full body'
            },
            {
              image: 'https://cdn.zhishuyun.com/05c7f5a8-4a79-4a1c-a4a9-792862ad118c.png',
              label: '肖像',
              value: 'Portrait'
            },
            {
              image: 'https://cdn.zhishuyun.com/aeb48a08-f0b6-47db-8c5d-ae6f0f92b93d.png',
              label: '侧身像',
              value: 'Profile'
            },
            {
              image: 'https://cdn.zhishuyun.com/dd655235-8f80-43b2-823f-bdb44864bee1.png',
              label: '针孔镜头',
              value: 'Pinhole Lens',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/7ad3f221-96f6-4014-953e-853c429d5d57.png',
              label: '广视角',
              value: 'Wide view'
            },
            {
              image: 'https://cdn.zhishuyun.com/698fbcc7-5ad1-40cb-a926-95189dc9e59b.png',
              label: '望远镜镜头',
              value: 'Telescope Lens',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/2e41309b-f006-483f-9843-e15f4ced6be7.png',
              label: '卫星图像',
              value: 'Satellite Imagery'
            },
            {
              image: 'https://cdn.zhishuyun.com/79ad137d-3015-4335-a4e3-2ed29f9b850b.png',
              label: '头部特写',
              value: 'Headshot'
            },
            {
              image: 'https://cdn.zhishuyun.com/d06164a9-ba01-457f-b8cc-f0b38a87b4d5.png',
              label: '极端特写',
              value: 'Extreme closeup',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/b8e10ef3-b37c-45f0-b930-be729c8d17a1.png',
              label: '超广角',
              value: 'Ultrawide shot'
            },
            {
              image: 'https://cdn.zhishuyun.com/21eaa8a4-a8f1-448d-9f00-ff8fb0213046.png',
              label: '鸟瞰图',
              value: 'Bird view',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/43fadf68-dad1-45d2-bc22-54b1b2792a00.png',
              label: '顶视图',
              value: 'Top view',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/f8953e9e-6daf-4a70-a691-6f89e91f0b97.png',
              label: '前视图',
              value: 'Front view',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/f2228145-dc8f-4e06-be21-5d18bf50f7cf.png',
              label: '侧面图',
              value: 'Side view',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/b218d1cc-60a7-4f62-a719-b852cd6ebf03.png',
              label: '后视图',
              value: 'Back view',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/186522ef-7b09-40d8-a712-43dde1266bbf.png',
              label: '脸部特写',
              value: 'Face shot'
            },
            {
              image: 'https://cdn.zhishuyun.com/6a0c1136-2817-42bb-b1e3-c65a130e70cf.png',
              label: '胸部以上',
              value: 'Chest shot'
            },
            {
              image: 'https://cdn.zhishuyun.com/8ac3bf91-2066-420d-8da1-5d6214ad2668.png',
              label: '腰部以上',
              value: 'Waist shot'
            },
            {
              image: 'https://cdn.zhishuyun.com/2558b92f-cb3b-410e-85cd-791eb7d29c60.png',
              label: '长距拍摄',
              value: 'Extra long shot'
            },
            {
              image: 'https://cdn.zhishuyun.com/0f5c9250-55a4-4eed-8ddf-af18cb52e243.png',
              label: '仰视',
              value: 'look up'
            },
            {
              image: 'https://cdn.zhishuyun.com/5e0df52d-e986-4851-b6ae-dc0be744713d.png',
              label: '等距视图',
              value: 'isometricview',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/0d6491dd-1f64-423c-b63b-0f2e96a258e5.png',
              label: '高角度视图',
              value: 'High angle view',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/5b68beee-c079-4a8e-84c5-cb3cc0f6c77b.png',
              label: '低角度视图',
              value: 'Low angle view',
              advanced: true
            }
          ]
        },
        emotion: {
          displayName: '情绪',
          items: [
            {
              image: 'https://cdn.zhishuyun.com/033c9cd1-f5cc-448f-8d0a-e6559bbd57e3.png',
              label: '开心',
              value: 'Happy'
            },
            {
              image: 'https://cdn.zhishuyun.com/d07fbadd-78e4-4a98-bcf8-45b4805c9239.png',
              label: '兴奋',
              value: 'Excited'
            },
            {
              image: 'https://cdn.zhishuyun.com/aa94049d-e8fc-4e0e-97b1-afa174d99b88.png',
              label: '生气',
              value: 'Angry'
            },
            {
              image: 'https://cdn.zhishuyun.com/ede7f1d3-5ce2-4b8f-9cb9-c4bd47b80cae.png',
              label: '悲伤',
              value: 'ped'
            },
            {
              image: 'https://cdn.zhishuyun.com/88f9e6ba-2961-497e-ae00-9af36fa2c2d4.png',
              label: '厌恶',
              value: 'Disgusted'
            },
            {
              image: 'https://cdn.zhishuyun.com/fe91b67b-2430-424a-bf72-1a299e61f049.png',
              label: '惊讶',
              value: 'supnned'
            },
            {
              image: 'https://cdn.zhishuyun.com/24dcfb80-d987-48b0-9595-82276b2a1f94.png',
              label: '期待',
              value: 'Hopeful'
            },
            {
              image: 'https://cdn.zhishuyun.com/f2628539-bdf5-471d-9ceb-f0731c46b593.png',
              label: '不安',
              value: 'Anxious'
            },
            {
              image: 'https://cdn.zhishuyun.com/f280d69a-eb1b-4259-b56d-66510f38ec82.png',
              label: '欣喜若狂',
              value: 'Elated'
            },
            {
              image: 'https://cdn.zhishuyun.com/94b78236-ba14-4aab-8985-3921b2146fc9.png',
              label: '害怕',
              value: 'Fearful'
            },
            {
              image: 'https://cdn.zhishuyun.com/68576d87-224f-463f-85c9-5fbeb386a035.png',
              label: '讨厌',
              value: 'Hateful'
            },
            {
              image: 'https://cdn.zhishuyun.com/e0413400-096f-4072-8faf-5ef82f8cc265.png',
              label: '喜怒无常',
              value: 'Apoow',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/c0f4b0f4-1399-468f-873a-a04f4b7929f8.png',
              label: '黑暗',
              value: 'Dark',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/297d5f3f-ebc9-4c9f-b656-07359b313871.png',
              label: '残酷',
              value: 'Brutal',
              advanced: true
            }
          ]
        },
        chinese: {
          displayName: '国风',
          items: [
            {
              image: 'https://cdn.zhishuyun.com/b29020e5-532d-4b30-94b0-cf5405242fc6.png',
              label: '汉服',
              value: 'Hanfu'
            },
            {
              image: 'https://cdn.zhishuyun.com/e00eb48c-8240-4468-ac15-1a9d3349b636.png',
              label: '旗袍',
              value: 'Cheongsam'
            },
            {
              image: 'https://cdn.zhishuyun.com/87d89bc5-cb61-4780-8894-c1564bdebd66.png',
              label: '中式服饰',
              value: 'Chinese costume'
            },
            {
              image: 'https://cdn.zhishuyun.com/811453d2-2715-44fe-8609-b0d184486b19.png',
              label: '中式礼服',
              value: 'Chinese dress'
            },
            {
              image: 'https://cdn.zhishuyun.com/2463a720-b803-4d0d-9cac-6a7d5b61001d.png',
              label: '武侠',
              value: 'Wuxia'
            },
            {
              image: 'https://cdn.zhishuyun.com/2fbee5a1-8a5c-4bfb-a52c-895ff3f53c3c.png',
              label: '凤凰',
              value: 'Chinese phoenix'
            },
            {
              image: 'https://cdn.zhishuyun.com/53fd3a51-7739-493f-aff0-daaea74b942c.png',
              label: '功夫',
              value: 'Kungfu'
            },
            {
              image: 'https://cdn.zhishuyun.com/bc4c6bb0-82a5-4bbb-b4e3-96a14c52aed3.png',
              label: '昆曲',
              value: 'Kunqu opera',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/291ca1c1-069e-4067-8b9d-1c5c11c2ff14.png',
              label: '景泰蓝',
              value: 'Cloisonne',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/17e87115-06ec-4f7b-9b8e-daf782cd4d59.png',
              label: '瓷器',
              value: 'Porcelain'
            },
            {
              image: 'https://cdn.zhishuyun.com/c9cc4712-24b9-4ff8-926b-02bd626df9a9.png',
              label: '刺绣',
              value: 'Embroidered'
            },
            {
              image: 'https://cdn.zhishuyun.com/7da286ae-d1e6-4a21-8ba5-10ff7bf9d379.png',
              label: '玉',
              value: 'Jade'
            },
            {
              image: 'https://cdn.zhishuyun.com/11a2d9f8-3c29-4b0b-ae10-525928f71bce.png',
              label: '中式亭',
              value: 'Chinese pavilion',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/639b5e99-8210-4525-b63f-8b89019d07f3.png',
              label: '梅花',
              value: 'Plum flower'
            },
            {
              image: 'https://cdn.zhishuyun.com/cc87764c-2754-4cb7-8bc3-1070b31ec62b.png',
              label: '紫禁城',
              value: 'Forbidden city',
              advanced: true
            },
            {
              image: 'https://cdn.zhishuyun.com/26d2f2aa-ca26-4c0e-a8c7-86a81aafc475.png',
              label: '牡丹',
              value: 'Peony',
              advanced: true
            }
          ]
        },
        special: {
          displayName: '特效',
          items: [
            {
              image: 'https://cdn.zhishuyun.com/0ca0fd15-cc8d-420e-acf5-6c489e03c7ff.png',
              label: '虚幻引擎',
              value: 'Unreal engine'
            },
            {
              image: 'https://cdn.zhishuyun.com/ead8ba11-6634-409e-8fea-7b31ca3974bc.png',
              label: 'Octane渲染',
              value: 'Octane render'
            },
            {
              image: 'https://cdn.zhishuyun.com/209f1bd9-5d44-4699-97ad-fdde73304efb.png',
              label: 'C4D渲染',
              value: 'Maxon cinema 4D'
            },
            {
              image: 'https://cdn.zhishuyun.com/93c31b69-7af4-4d1f-99d6-114a34133613.png',
              label: 'QM渲染',
              value: 'Quixel megascans render'
            },
            {
              image: 'https://cdn.zhishuyun.com/9883f161-5069-414b-9d23-bd63806c5205.png',
              label: 'Corona室内渲染',
              value: 'Corona render'
            },
            {
              image: 'https://cdn.zhishuyun.com/9c28e4af-28b2-4b97-abd4-e4f42d014f3a.png',
              label: 'V-ray渲染',
              value: 'V-ray'
            },
            {
              image: 'https://cdn.zhishuyun.com/01d71ceb-7d17-4318-9914-a6a5fe0abc11.png',
              label: '建筑渲染',
              value: 'Architectural visualisation'
            },
            {
              image: 'https://cdn.zhishuyun.com/e7f2cd21-2efc-4e18-b38d-3c2cbd95c5ec.png',
              label: '戏剧性对比度',
              value: 'Dramatic contrast'
            },
            {
              image: 'https://cdn.zhishuyun.com/8f113377-ba6e-4fb0-bd56-df8635ab6345.png',
              label: '黑金色调',
              value: 'Gold and black tone'
            },
            {
              image: 'https://cdn.zhishuyun.com/6da8b72d-5a67-4c06-b915-8c0b5314d9c8.png',
              label: '粉白色调',
              value: 'White and pink tone'
            },
            {
              image: 'https://cdn.zhishuyun.com/09abd535-8ab6-451f-8bce-29859429244b.png',
              label: '红黑色调',
              value: 'Red and black tone'
            },
            {
              image: 'https://cdn.zhishuyun.com/81115846-7676-4edb-b7cf-df816c90de7f.png',
              label: '宽虹氛围',
              value: 'Neon shades'
            },
            {
              image: 'https://cdn.zhishuyun.com/dfcc7a8a-e145-4824-b12b-bd29292daa5f.png',
              label: '鲜艳',
              value: 'Rich color'
            },
            {
              image: 'https://cdn.zhishuyun.com/38b05148-73c6-4db3-bddd-b972f27f4671.png',
              label: '单色',
              value: 'Monotone'
            },
            {
              image: 'https://cdn.zhishuyun.com/6f6704da-1854-43d7-811f-3145fea96909.png',
              label: '低纯度色调',
              value: 'The low-purity tone'
            },
            {
              image: 'https://cdn.zhishuyun.com/3724b5ef-e7dd-4234-b2a2-f71c6b69b4ac.png',
              label: '高纯度色调',
              value: 'The high-purity tone'
            }
          ]
        }
      }
    };
  },
  watch: {
    modelValue(val) {
      this.value = val;
    },
    value: {
      handler(val) {
        this.$emit('update:modelValue', val);
      },
      deep: true
    }
  },
  mounted() {
    if (!this.value) {
      this.value = [];
    }
    this.$emit('update:modelValue', this.value);
  },
  methods: {
    onToggle(value: string) {
      if (this.value.includes(value)) {
        this.value.splice(this.value.indexOf(value), 1);
        this.$emit('update:modelValue', this.value);
        return;
      } else {
        this.value.push(value);
        this.$emit('update:modelValue', this.value);
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.pane {
  display: flex;
  flex-direction: row;
  justify-content: left;
  align-items: center;
  flex-wrap: wrap;
  height: auto;
  max-height: 320px;
  overflow-y: scroll;
  .item {
    $height: 100px;
    $width: 100px;
    position: relative;
    width: $height;
    height: $width;
    margin-right: 8px;
    margin-bottom: 8px;
    border-width: 2px;
    border-style: solid;
    border-color: #eee;
    border-radius: 5px;
    overflow: hidden;

    &.hidden {
      display: none;
    }

    &.active {
      border-color: var(--el-color-primary);
    }

    .preview {
      width: $height;
      height: $width;
    }
    .name {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 20px;
      width: $width;
      background-color: rgba(0, 0, 0, 0.5);
      color: white;
      font-size: 10px;
      text-align: center;
    }
  }
}
</style>
