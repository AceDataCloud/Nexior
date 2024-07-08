<!-- eslint-disable vue/no-use-v-if-with-v-for -->
<template>
  <div class="field">
    <h2 class="title">{{ $t('midjourney.field.elements') }}</h2>
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
          displayName: this.$t('midjourney.styleCategory.styles'),
          items: [
            {
              image: 'https://cdn.acedata.cloud/94ab394d-2fa3-4fe8-b3b3-41be85720fdb.png',
              label: this.$t('midjourney.styleTag.watercolour'),
              value: 'Watercolour'
            },
            {
              image: 'https://cdn.acedata.cloud/c3904cc5-3184-4639-be76-46f4860c1277.png',
              label: this.$t('midjourney.styleTag.oilPainting'),
              value: 'Oil painting'
            },
            {
              image: 'https://cdn.acedata.cloud/a0b764bb-13b1-419b-a8e8-855ee7ffc28a.png',
              label: this.$t('midjourney.styleTag.oldPhotograph'),
              value: 'Old Photograph'
            },
            {
              image: 'https://cdn.acedata.cloud/04f17d89-d913-4700-a422-99fa97fa79c9.png',
              label: this.$t('midjourney.styleTag.oneLineDrawing'),
              value: 'One-line drawing'
            },
            {
              image: 'https://cdn.acedata.cloud/281cfaac-ec59-4f5c-ab2b-f15d7481d752.png',
              label: this.$t('midjourney.styleTag.sketchDrawing'),
              value: 'Sketch Drawing'
            },
            {
              image: 'https://cdn.acedata.cloud/091d68cf-533c-4b76-90be-d5983b9ba80b.png',
              label: this.$t('midjourney.styleTag.gouache'),
              value: 'Gouache'
            },
            {
              image: 'https://cdn.acedata.cloud/a652c6b2-f0f6-4ef4-bf1b-9053e1daf85b.png',
              label: this.$t('midjourney.styleTag.filmStyle'),
              value: 'Film style'
            },
            {
              image: 'https://cdn.acedata.cloud/0aaafc79-9094-4a97-a07d-a01f88d276b1.png',
              label: this.$t('midjourney.styleTag.photorealistic'),
              value: 'Photorealistic'
            },
            {
              image: 'https://cdn.acedata.cloud/aa6489ad-8b40-46ae-83a6-f636772084e9.png',
              label: this.$t('midjourney.styleTag.logo'),
              value: 'Logo'
            },
            {
              image: 'https://cdn.acedata.cloud/e3e96805-6bcd-4608-b012-a8931e75662a.png',
              label: this.$t('midjourney.styleTag.cartoon'),
              value: 'Cartoon'
            },
            {
              image: 'https://cdn.acedata.cloud/11d53af4-ec2d-4256-8ddc-18105df57047.png',
              label: this.$t('midjourney.styleTag.marbleStatue'),
              value: 'Marble Statue'
            },
            {
              image: 'https://cdn.acedata.cloud/d0109889-d2a6-49ee-9f5c-49f2033966d8.png',
              label: this.$t('midjourney.styleTag.1800S'),
              value: '1800s'
            },
            {
              image: 'https://cdn.acedata.cloud/86a3fb48-1ef0-422a-809a-580892aa0b9d.png',
              label: this.$t('midjourney.styleTag.1980S'),
              value: '1980s'
            },
            {
              image: 'https://cdn.acedata.cloud/8b07aae4-b6f6-45ad-a556-7206b2945025.png',
              label: this.$t('midjourney.styleTag.isometricAnime'),
              value: 'Isometric anime',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/3be49d3c-e431-4bce-b2bb-fc53f763b348.png',
              label: this.$t('midjourney.styleTag.analyticDrawing'),
              value: 'Analytic drawing',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/4d31c2dc-2a0b-4465-b3e8-bffd7c5fed25.png',
              label: this.$t('midjourney.styleTag.coloringBook'),
              value: 'Coloring book',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/a19dde67-65b2-4923-8895-9e960cf050ee.png',
              label: this.$t('midjourney.styleTag.infographicDrawing'),
              value: 'Infographic drawing',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/f57db729-8692-4524-a373-b495d14ec77e.png',
              label: this.$t('midjourney.styleTag.doubleExposure'),
              value: 'Double exposure',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/f8ff8db0-62dc-4414-b309-7fdf2021e45c.png',
              label: this.$t('midjourney.styleTag.diagrammaticDrawing'),
              value: 'Diagrammatic drawing',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/426447cf-dd10-4c91-b928-e7a3aa4c253a.png',
              label: this.$t('midjourney.styleTag.2DIllustration'),
              value: '2D illustration',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/25e0edfe-776f-4be0-9791-bb729cca81b3.png',
              label: this.$t('midjourney.styleTag.diagrammaticPortrait'),
              value: 'Diagrammatic portrait',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/819c367c-ad03-4bf8-87a9-38ba53aa00f6.png',
              label: this.$t('midjourney.styleTag.pixelArt'),
              value: 'Pixel art',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/2c4bbd7b-fc59-4f38-b844-762bf2366042.png',
              label: this.$t('midjourney.styleTag.darkFantasy'),
              value: 'Dark fantasy',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/bd786eed-e3ee-4e3a-9473-acbd1ee4306c.png',
              label: this.$t('midjourney.styleTag.ukiyoEArt'),
              value: 'Ukiyo-e art',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/1951d276-5502-428a-8694-1b311d8a5540.png',
              label: this.$t('midjourney.styleTag.paperQuilling'),
              value: 'Paper quilling',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/4f9bcc9c-8b0e-47f4-87b9-4b4d78a8891a.png',
              label: this.$t('midjourney.styleTag.paperCutCraft'),
              value: 'Paper cut craft'
            },
            {
              image: 'https://cdn.acedata.cloud/4775f61f-446b-4312-b824-c91c6ecdb372.png',
              label: this.$t('midjourney.styleTag.iridescent'),
              value: 'Iridescent',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/29fbc528-56f0-4eb0-a5a2-2312d53d55b4.png',
              label: this.$t('midjourney.styleTag.patchworkCollage'),
              value: 'Patchwork collage',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/aa03b06a-fac8-45ec-830f-2a6e7ecab5c2.png',
              label: this.$t('midjourney.styleTag.opArt'),
              value: 'Op art',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/29015f2a-3c9c-43c5-808a-23fbbb7bcf2f.png',
              label: this.$t('midjourney.styleTag.japaneseInk'),
              value: 'Japanese ink',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/a65f8f7e-46a9-4ccf-8ee5-720d0c222471.png',
              label: this.$t('midjourney.styleTag.pastelDrawing'),
              value: 'Pastel drawing'
            },
            {
              image: 'https://cdn.acedata.cloud/a0cda2b1-b227-4230-8842-feab55edd6c7.png',
              label: this.$t('midjourney.styleTag.drippingArt'),
              value: 'Dripping art'
            },
            {
              image: 'https://cdn.acedata.cloud/c4aab372-ec55-4a7e-af94-4469f45c23c5.png',
              label: this.$t('midjourney.styleTag.tattooArt'),
              value: 'Tattoo art',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/5040fbb2-6fa7-4e8f-86ac-f23c1c3e291c.png',
              label: this.$t('midjourney.styleTag.16Bit'),
              value: '16-Bit',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/b67249a1-36fa-443a-8b41-c167a5002e10.png',
              label: this.$t('midjourney.styleTag.8Bit'),
              value: '8-Bit',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/1c9600b4-6995-4dcb-b363-40ee38049151.png',
              label: this.$t('midjourney.styleTag.amber'),
              value: 'Amber',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/e2d34946-3148-4f92-ad73-40f6f1208516.png',
              label: this.$t('midjourney.styleTag.anatomicalDrawing'),
              value: 'Anatomical Drawing',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/19940f31-037e-4a8f-a71c-605e16ac9631.png',
              label: this.$t('midjourney.styleTag.ancient'),
              value: 'Ancient'
            },
            {
              image: 'https://cdn.acedata.cloud/b714b3d9-2f97-49fb-bf85-99a716bf0c78.png',
              label: this.$t('midjourney.styleTag.anime'),
              value: 'Anime',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/d88c3080-cd54-4342-ac91-dac326ee1060.png',
              label: this.$t('midjourney.styleTag.arabic'),
              value: 'Arabic',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/dc54b749-8e69-4252-9b90-fc1448fa9397.png',
              label: this.$t('midjourney.styleTag.blocky'),
              value: 'Blocky',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/d8009295-2f4b-48d8-896e-46d0f5939923.png',
              label: this.$t('midjourney.styleTag.blueprint'),
              value: 'Blueprint',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/5cc39277-16e0-46d6-9310-b0722479713b.png',
              label: this.$t('midjourney.styleTag.comicbook'),
              value: 'Comicbook',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/b9900d01-20bc-408b-9637-779cc22c493c.png',
              label: this.$t('midjourney.styleTag.caribbean'),
              value: 'Caribbean',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/fedabd4e-a9bb-4bb0-a4ec-8fc48bc74c78.png',
              label: this.$t('midjourney.styleTag.celestial'),
              value: 'Celestial',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/00f1f097-1d72-435f-b47d-656f8e194dc2.png',
              label: this.$t('midjourney.styleTag.cellulose'),
              value: 'Cellulose',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/a002bccf-6287-4b28-a5a7-c1cf5cb07734.png',
              label: this.$t('midjourney.styleTag.charcoalStyle'),
              value: 'Charcoal Style',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/e218ab68-e430-4541-9501-02ee2d7aeda9.png',
              label: this.$t('midjourney.styleTag.chromatic'),
              value: 'Chromatic',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/bd5a79d9-c73d-46c3-974f-932751ff8e46.png',
              label: this.$t('midjourney.styleTag.coral'),
              value: 'Coral',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/58dd439c-cae7-434f-9a83-ac6aefd6e417.png',
              label: this.$t('midjourney.styleTag.conceptArt'),
              value: 'Concept Art',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/767fe9f3-69d0-4e16-9060-41e6cf1b1fe1.png',
              label: this.$t('midjourney.styleTag.fibonacci'),
              value: 'Fibonacci',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/4b78ebb1-5091-43d8-a020-88ffb3719edd.png',
              label: this.$t('midjourney.styleTag.cyberpunk'),
              value: 'Cyberpunk',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/34d35d5c-a2e4-4e8e-aafd-3d3c08499389.png',
              label: this.$t('midjourney.styleTag.diabolic'),
              value: 'Diabolic',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/8e29e2b4-4899-491d-a5dc-5ebbb1ff2758.png',
              label: this.$t('midjourney.styleTag.diffractionGrading'),
              value: 'Diffraction Grading',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/996c6d93-94aa-438a-96d5-278e22e54f5f.png',
              label: this.$t('midjourney.styleTag.lightspeed'),
              value: 'Lightspeed',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/57f3ad49-0940-44e2-a31a-a4872497bae7.png',
              label: this.$t('midjourney.styleTag.liquid'),
              value: 'Liquid',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/a9ff43a9-dadf-4bbc-9a7a-72fd3908d39a.png',
              label: this.$t('midjourney.styleTag.dots'),
              value: 'Dots',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/acff2bf9-1907-4a0f-be23-897c71caf60e.png',
              label: this.$t('midjourney.styleTag.dune'),
              value: 'Dune',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/4a2abc45-ba65-4e2d-8399-8d44491c8a64.png',
              label: this.$t('midjourney.styleTag.drippingPaint'),
              value: 'Dripping Paint',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/7dc4e93f-07a8-45ec-9e8a-89c3f619fd40.png',
              label: this.$t('midjourney.styleTag.electronicCircuitry'),
              value: 'Electronic Circuitry',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/cf502cba-ee64-41fd-a388-93f6357fc7cc.png',
              label: this.$t('midjourney.styleTag.electrical'),
              value: 'Electrical',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/fd6a696b-3102-4301-8fce-5a7fd401231a.png',
              label: this.$t('midjourney.styleTag.futuristic'),
              value: 'Futuristic',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/0fe8fca5-b3d9-4fab-b390-fff7c0f4f594.png',
              label: this.$t('midjourney.styleTag.etching'),
              value: 'Etching',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/46577726-f0ab-4750-81c6-0d4d865ba4bd.png',
              label: this.$t('midjourney.styleTag.extraterrestrial'),
              value: 'Extraterrestrial',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/faa06af4-9988-4e39-9f13-ecdd29e1e20a.png',
              label: this.$t('midjourney.styleTag.glitchart'),
              value: 'Glitchart',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/4380f6af-aaeb-41fd-bcaf-2efadcc3e08f.png',
              label: this.$t('midjourney.styleTag.floral'),
              value: 'Floral',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/096683c4-8e91-4ef0-8211-8a6dcef5298d.png',
              label: this.$t('midjourney.styleTag.fractal'),
              value: 'Fractal',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/10ce713b-a5bc-400b-a0c8-bcec4f7e6548.png',
              label: this.$t('midjourney.styleTag.preHistoric'),
              value: 'Pre Historic',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/6382ad4e-1818-4ab1-b493-10afdb43c196.png',
              label: this.$t('midjourney.styleTag.prokaryotic'),
              value: 'Prokaryotic',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/48205fb3-e48b-4219-ad53-d307e1e686a7.png',
              label: this.$t('midjourney.styleTag.horror'),
              value: 'Horror',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/d0567b20-8f93-4b16-a775-8ca0708a7a50.png',
              label: this.$t('midjourney.styleTag.iceAge'),
              value: 'Ice Age',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/cc1455a5-c139-400d-8a54-121176f196e1.png',
              label: this.$t('midjourney.styleTag.jurassic'),
              value: 'Jurassic',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/84e2bfe2-60bb-4323-936b-18dbb1c8cfa1.png',
              label: this.$t('midjourney.styleTag.knitted'),
              value: 'Knitted',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/2e1ffddf-daa1-4e57-bc92-d16484ef8e34.png',
              label: this.$t('midjourney.styleTag.polka'),
              value: 'Polka',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/9c2670df-3e39-45a7-ad76-ae17502d018f.png',
              label: this.$t('midjourney.styleTag.latex'),
              value: 'Latex',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/d4de1735-235d-461d-b93f-2bf3c280ccfe.png',
              label: this.$t('midjourney.styleTag.pastel'),
              value: 'Pastel',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/37f26555-f634-4964-8bac-ec8a955273d4.png',
              label: this.$t('midjourney.styleTag.mandala'),
              value: 'Mandala',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/f62aa376-1378-45a6-abd0-71bc7bbe49c7.png',
              label: this.$t('midjourney.styleTag.molecular'),
              value: 'Molecular',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/fc135428-1835-453d-afef-aaf72a7cfcbc.png',
              label: this.$t('midjourney.styleTag.merkaba'),
              value: 'Merkaba',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/5caf594b-0f0c-455f-b8a8-8c15a189d0dc.png',
              label: this.$t('midjourney.styleTag.mitochondria'),
              value: 'Mitochondria',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/088e3067-0abe-4f3d-bcb8-f6937e860d1e.png',
              label: this.$t('midjourney.styleTag.graffiti'),
              value: 'Graffiti',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/06230561-916a-4bc5-ad85-9386cf27bf1c.png',
              label: this.$t('midjourney.styleTag.graphicNovel'),
              value: 'Graphic Novel',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/e47f7931-d588-4c4a-87c8-3f7137e7f727.png',
              label: this.$t('midjourney.styleTag.multidimensional'),
              value: 'Multidimensional',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/d2443c93-3227-4216-afd1-b86287ac5140.png',
              label: this.$t('midjourney.styleTag.nasa'),
              value: 'NASA',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/a86a2f67-273c-4edf-9be9-ceecc983c93d.png',
              label: this.$t('midjourney.styleTag.nebula'),
              value: 'Nebula',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/ad1e588c-5892-48ee-a7c2-103c2b4868fc.png',
              label: this.$t('midjourney.styleTag.neon'),
              value: 'Neon'
            },
            {
              image: 'https://cdn.acedata.cloud/5a133976-208e-460f-8296-a4ad19809490.png',
              label: this.$t('midjourney.styleTag.nuclear'),
              value: 'Nuclear',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/c99f5082-314b-49e9-8875-b40319ed3cfc.png',
              label: this.$t('midjourney.styleTag.orbital'),
              value: 'Orbital',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/63809059-6ae6-49ff-ad96-ed4ae45a2464.png',
              label: this.$t('midjourney.styleTag.rayTracing'),
              value: 'Ray Tracing',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/cdcf0c05-e7ad-421e-b513-640bcc3d04cc.png',
              label: this.$t('midjourney.styleTag.realistic'),
              value: 'Realistic'
            },
            {
              image: 'https://cdn.acedata.cloud/019dc7be-b0e2-4da2-94d4-191226d58dbf.png',
              label: this.$t('midjourney.styleTag.renaissance'),
              value: 'Renaissance',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/d46d3c03-a924-4a0f-b032-e8dbca6ad37e.png',
              label: this.$t('midjourney.styleTag.retro'),
              value: 'Retro'
            },
            {
              image: 'https://cdn.acedata.cloud/bc13e200-6865-474b-8fe4-cf0725cf3caf.png',
              label: this.$t('midjourney.styleTag.risograph'),
              value: 'Risograph',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/f8533acc-807b-4f03-8f39-338ee6ff5d53.png',
              label: this.$t('midjourney.styleTag.origami'),
              value: 'Origami',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/b0ff3593-aef3-4dd2-a5f4-548c6febb2e2.png',
              label: this.$t('midjourney.styleTag.ornamental'),
              value: 'Ornamental',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/002c6a5d-b251-43bb-b713-d133f828c0a4.png',
              label: this.$t('midjourney.styleTag.space'),
              value: 'Space',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/641327df-93cc-4746-a55e-667dbb8c1563.png',
              label: this.$t('midjourney.styleTag.splatterPaint'),
              value: 'Splatter Paint',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/42527f9e-6cf0-40a6-bc9b-361d2baf9bf9.png',
              label: this.$t('midjourney.styleTag.sprayPaint'),
              value: 'Spray Paint',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/98bf8e01-9dd8-434b-81df-77cfd3627243.png',
              label: this.$t('midjourney.styleTag.squiggles'),
              value: 'Squiggles',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/26868352-5d9a-4bcc-9926-166927a2be35.png',
              label: this.$t('midjourney.styleTag.stitching'),
              value: 'Stitching',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/23819218-bdbc-4746-a507-7664836a4f59.png',
              label: this.$t('midjourney.styleTag.veins'),
              value: 'Veins',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/2fd3de3d-7211-4cce-b63b-a857d7621c72.png',
              label: this.$t('midjourney.styleTag.streetArt'),
              value: 'Street Art',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/80422ede-79fb-4149-bd0a-85bf0ac75a3d.png',
              label: this.$t('midjourney.styleTag.surreal'),
              value: 'Surreal'
            },
            {
              image: 'https://cdn.acedata.cloud/94956306-55de-470b-8a2a-28354d0e556f.png',
              label: this.$t('midjourney.styleTag.symmetric'),
              value: 'Symmetric',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/0098f2a0-b089-4e64-8a86-ffa137605087.png',
              label: this.$t('midjourney.styleTag.synthWave'),
              value: 'Synth-wave',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/f50d33b2-9c91-4939-8f2d-7b5ce185d138.png',
              label: this.$t('midjourney.styleTag.technological'),
              value: 'Technological',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/a446a6eb-444c-4073-8a8e-6f43e65491c2.png',
              label: this.$t('midjourney.styleTag.tron'),
              value: 'Tron',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/8026ccad-aa11-4b0d-ad81-eb870a695a81.png',
              label: this.$t('midjourney.styleTag.tropical'),
              value: 'Tropical',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/22c16c64-068c-470e-9b80-2849297aad9a.png',
              label: this.$t('midjourney.styleTag.ultraModern'),
              value: 'Ultra Modern'
            },
            {
              image: 'https://cdn.acedata.cloud/f67bd4b6-3f43-4da8-bdcb-67cd39cb38f9.png',
              label: this.$t('midjourney.styleTag.wormhole'),
              value: 'Wormhole',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/2e2a1ca9-8791-41c6-9ff0-0ac21a13d1c5.png',
              label: this.$t('midjourney.styleTag.wrinkled'),
              value: 'Wrinkled',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/3507c78d-a065-462c-a17c-fd5ed4677644.png',
              label: this.$t('midjourney.styleTag.volcanic'),
              value: 'Volcanic',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/69263783-0610-45b0-9ec4-acac961da092.png',
              label: this.$t('midjourney.styleTag.wetPaint'),
              value: 'Wet Paint',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/9022fc82-d6f7-47e2-90b1-ad96fbba5257.png',
              label: this.$t('midjourney.styleTag.wildWest'),
              value: 'Wild West',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/23de882d-4e5d-40b5-9f00-d0573c443212.png',
              label: this.$t('midjourney.styleTag.wind'),
              value: 'Wind',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/e3a58af1-79bc-48f3-871c-36472da2584b.png',
              label: this.$t('midjourney.styleTag.miniatureFaking'),
              value: 'Miniature Faking',
              advanced: true
            }
          ]
        },
        lighting: {
          displayName: this.$t('midjourney.styleCategory.lighting'),
          items: [
            {
              image: 'https://cdn.acedata.cloud/a4b9110f-e838-4c52-8ab8-f2637ea753df.png',
              label: this.$t('midjourney.styleTag.accentLighting'),
              value: 'Accent Lighting'
            },
            {
              image: 'https://cdn.acedata.cloud/c4c16a69-28d7-4b38-8ea2-3ce49d5c6b07.png',
              label: this.$t('midjourney.styleTag.backlight'),
              value: 'Backlight'
            },
            {
              image: 'https://cdn.acedata.cloud/7fd2cd5c-7671-4b40-85a0-230de9c37234.png',
              label: this.$t('midjourney.styleTag.blacklight'),
              value: 'Blacklight',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/a08bff6e-8a0f-4d56-aa91-576f0a9921f2.png',
              label: this.$t('midjourney.styleTag.goldenHourLight'),
              value: 'Golden hour light',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/3cd28696-493f-4b3e-9187-9d1a4c17e95b.png',
              label: this.$t('midjourney.styleTag.candlelight'),
              value: 'Candlelight'
            },
            {
              image: 'https://cdn.acedata.cloud/58c9a17e-f7d5-4481-abc8-9e9b66609a4d.png',
              label: this.$t('midjourney.styleTag.concertLighting'),
              value: 'Concert Lighting',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/efb8893c-8bd6-4c7d-8e45-6e0626f69479.png',
              label: this.$t('midjourney.styleTag.crepuscularRays'),
              value: 'Crepuscular Rays',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/27b90e83-09b0-4339-9b2c-48fe6fe45bdd.png',
              label: this.$t('midjourney.styleTag.directSunlight'),
              value: 'Direct Sunlight'
            },
            {
              image: 'https://cdn.acedata.cloud/d33cb17d-e2a5-4ca3-b68a-93904d2618d7.png',
              label: this.$t('midjourney.styleTag.dust'),
              value: 'Dust',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/3af133d0-5a86-45a9-a16e-f23e6cc68b24.png',
              label: this.$t('midjourney.styleTag.studioLighting'),
              value: 'Studio lighting',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/6bc889b1-a563-4890-9117-7d3ded276caa.png',
              label: this.$t('midjourney.styleTag.rimLight'),
              value: 'Rim light',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/d770265a-066b-413f-a405-a52d68e2f1c7.png',
              label: this.$t('midjourney.styleTag.volumetricLighting'),
              value: 'Volumetric Lighting',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/7c83560a-6837-43b2-b296-f74db549accf.png',
              label: this.$t('midjourney.styleTag.fluorescent'),
              value: 'Fluorescent'
            },
            {
              image: 'https://cdn.acedata.cloud/6ffc8688-dfd0-4ede-a6bc-91bf8679adc9.png',
              label: this.$t('midjourney.styleTag.glowing'),
              value: 'Glowing',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/63bc0645-ab94-4327-84b8-e226020c6c0f.png',
              label: this.$t('midjourney.styleTag.glowStick'),
              value: 'Glow-stick',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/824111e9-7ebf-47ec-80ef-a6ad0a1d949b.png',
              label: this.$t('midjourney.styleTag.glowRadioactive'),
              value: 'Glow Radioactive',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/9d23de16-57b3-42be-89d2-478de2666483.png',
              label: this.$t('midjourney.styleTag.lavaGlow'),
              value: 'Lava Glow',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/d801ee47-02a0-455d-b333-76ad73a4fdcd.png',
              label: this.$t('midjourney.styleTag.moonlight'),
              value: 'Moonlight'
            },
            {
              image: 'https://cdn.acedata.cloud/6d1400a8-e168-46c9-89e8-5e701f8824b2.png',
              label: this.$t('midjourney.styleTag.naturalLighting'),
              value: 'Natural Lighting'
            },
            {
              image: 'https://cdn.acedata.cloud/9bb6c4ce-9076-41eb-8ace-43a4fa7e0c03.png',
              label: this.$t('midjourney.styleTag.neonLamp'),
              value: 'Neon Lamp'
            },
            {
              image: 'https://cdn.acedata.cloud/ac3fe310-3639-4fc0-b56e-4d69278bc2ca.png',
              label: this.$t('midjourney.styleTag.nightclubLighting'),
              value: 'Nightclub Lighting',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/c9331a92-87d2-43b5-9319-24c8629bffd1.png',
              label: this.$t('midjourney.styleTag.nuclearWasteGlo'),
              value: 'Nuclear Waste Glo',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/40ccdbfb-84a7-49f7-9999-92db58802c65.png',
              label: this.$t('midjourney.styleTag.quantumDot'),
              value: 'Quantum Dot',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/d5411604-4e66-4187-9b37-48eb683be65e.png',
              label: this.$t('midjourney.styleTag.spotlight'),
              value: 'Spotlight'
            },
            {
              image: 'https://cdn.acedata.cloud/b1f16a4b-fb3d-4783-9c66-c3567e79baeb.png',
              label: this.$t('midjourney.styleTag.edgeLight'),
              value: 'Edge light',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/97fecbc1-a164-48e2-bdf0-c69975c16d63.png',
              label: this.$t('midjourney.styleTag.coldLight'),
              value: 'Cold light'
            },
            {
              image: 'https://cdn.acedata.cloud/7087f2fe-f48c-4b72-95bc-c697b56e8b0e.png',
              label: this.$t('midjourney.styleTag.keyLighting'),
              value: 'Key lighting',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/5ab92c7e-bca1-4fbc-8975-6d9fb3f15626.png',
              label: this.$t('midjourney.styleTag.ambientLight'),
              value: 'Ambient Light',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/ac80d283-5532-4664-bbe5-42fbb9582a63.png',
              label: this.$t('midjourney.styleTag.highKeyLighting'),
              value: 'High key lighting',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/add3524d-fc90-45a8-9edc-348bb1f79075.png',
              label: this.$t('midjourney.styleTag.lowKeyLighting'),
              value: 'Low key lighting',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/42174ff8-3080-4004-9ae2-c2ff919e1145.png',
              label: this.$t('midjourney.styleTag.motivatedLighting'),
              value: 'Motivated lighting',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/09f3d509-a366-44dc-be3b-b39712d0fac1.png',
              label: this.$t('midjourney.styleTag.3PointLighting'),
              value: '3 point lighting',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/794a114e-cd4d-4e83-a187-5e979296d125.png',
              label: this.$t('midjourney.styleTag.strobeLight'),
              value: 'Strobe light',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/9e6ec476-3ac8-4246-964f-a1d89a6d19e9.png',
              label: this.$t('midjourney.styleTag.sunLight'),
              value: 'Sun light'
            },
            {
              image: 'https://cdn.acedata.cloud/4360a40b-2126-43c2-be8e-e482978e1ea6.png',
              label: this.$t('midjourney.styleTag.ultraviolet'),
              value: 'Ultraviolet',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/8b6bea86-9ed1-4fc8-9040-8fc2b64abbff.png',
              label: this.$t('midjourney.styleTag.beautifulLighting'),
              value: 'Beautiful Lighting',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/a8d1f754-fb35-433d-8a36-e073b0fe6fa2.png',
              label: this.$t('midjourney.styleTag.moodyLighting'),
              value: 'Moody Lighting',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/77270807-ca3b-4d02-a9b4-badf8aa48c36.png',
              label: this.$t('midjourney.styleTag.softLighting'),
              value: 'Soft Lighting'
            }
          ]
        },
        artists: {
          displayName: this.$t('midjourney.styleCategory.artists'),
          items: [
            {
              image: 'https://cdn.acedata.cloud/160cfc29-f258-4795-b663-f687adba19bf.png',
              label: this.$t('midjourney.styleTag.michelangelo'),
              value: 'Michelangelo'
            },
            {
              image: 'https://cdn.acedata.cloud/ed0bf2ad-138d-4c8d-bce9-a98299b1ee83.png',
              label: this.$t('midjourney.styleTag.monet'),
              value: 'Monet'
            },
            {
              image: 'https://cdn.acedata.cloud/58d9b130-e7b2-4eb8-a71e-7108b3bd4c26.png',
              label: this.$t('midjourney.styleTag.paulCezanne'),
              value: 'Paul Cezanne',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/1247615a-6e75-49e6-842a-b0fb84016d3d.png',
              label: this.$t('midjourney.styleTag.markRothko'),
              value: 'Mark Rothko',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/a7d9d9dd-8add-43d3-942e-8d1199fe277f.png',
              label: this.$t('midjourney.styleTag.paulKlee'),
              value: 'Paul Klee',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/caf5701a-b652-4fab-8467-0c00303d01f3.png',
              label: this.$t('midjourney.styleTag.picasso'),
              value: 'Picasso'
            },
            {
              image: 'https://cdn.acedata.cloud/fbb63634-659a-4d2d-bc7b-0fb3399f7061.png',
              label: this.$t('midjourney.styleTag.pietMondrian'),
              value: 'Piet Mondrian',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/29fb173b-17b4-4b05-a63c-e31ce161fe8c.png',
              label: this.$t('midjourney.styleTag.pierreAugusteRer'),
              value: 'Pierre Auguste Rer',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/556f8a48-0b12-49a7-b150-aed40278d3f6.png',
              label: this.$t('midjourney.styleTag.rembrandt'),
              value: 'Rembrandt'
            },
            {
              image: 'https://cdn.acedata.cloud/b44d947e-2a14-4db2-880d-332c1aeeb303.png',
              label: this.$t('midjourney.styleTag.reneMagritte'),
              value: 'Rene Magritte',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/0cfcda4a-7e7f-4ec4-ad4f-b4877a900a50.png',
              label: this.$t('midjourney.styleTag.royLichtenstein'),
              value: 'Roy Lichtenstein',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/e592bf88-d9b8-4787-88dd-9ff8e7e9268c.png',
              label: this.$t('midjourney.styleTag.salvadorDali'),
              value: 'Salvador Dali',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/3bbde342-565b-4ea0-8a4c-42b3c109c205.png',
              label: this.$t('midjourney.styleTag.sandroBotticelli'),
              value: 'Sandro Botticelli',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/bfdf6d50-24ab-4b5c-a3de-c8d77d858b04.png',
              label: this.$t('midjourney.styleTag.takashiMurakami'),
              value: 'Takashi Murakami',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/bc67c0ba-614f-46f0-a6ec-047fa561fc01.png',
              label: this.$t('midjourney.styleTag.vanGogh'),
              value: 'Van Gogh'
            },
            {
              image: 'https://cdn.acedata.cloud/984a18fa-8050-4084-95d5-732b7ede8e37.png',
              label: this.$t('midjourney.styleTag.wassilyKandinsky'),
              value: 'Wassily Kandinsky',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/48bce45c-6b25-4678-9be8-40707c8e5f43.png',
              label: this.$t('midjourney.styleTag.matCollishaw'),
              value: 'Mat Collishaw',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/6b2851d0-ec8d-4c07-86ed-1eafdd70e1fe.png',
              label: this.$t('midjourney.styleTag.yayoiKusama'),
              value: 'Yayoi Kusama',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/9d691d5c-5560-409b-b998-c979b29902e6.png',
              label: this.$t('midjourney.styleTag.igorMorski'),
              value: 'Igor Morski',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/950cb143-ab40-4bee-80f7-092d0c2a7bc4.png',
              label: this.$t('midjourney.styleTag.shinkaiMakoto'),
              value: 'Shinkai Makoto'
            },
            {
              image: 'https://cdn.acedata.cloud/94adf414-a1cc-4b84-b52d-18cd2586df17.png',
              label: this.$t('midjourney.styleTag.pixar'),
              value: 'Pixar'
            },
            {
              image: 'https://cdn.acedata.cloud/ccd4d148-e332-4d7e-bbe6-9f1dd68082a8.png',
              label: this.$t('midjourney.styleTag.kyotoAnime'),
              value: 'Kyoto Anime'
            },
            {
              image: 'https://cdn.acedata.cloud/b5f5f99a-be40-4fa7-a86a-fd51578a4052.png',
              label: this.$t('midjourney.styleTag.jerryPinkney'),
              value: 'Jerry Pinkney',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/7a4dba74-21ad-4088-89da-6a48104d811d.png',
              label: this.$t('midjourney.styleTag.hayaoMiyazaki'),
              value: 'Hayao Miyazaki'
            },
            {
              image: 'https://cdn.acedata.cloud/28477b7e-85d4-4803-b525-938aa2ce3383.png',
              label: this.$t('midjourney.styleTag.beatrixPotter'),
              value: 'Beatrix Potter',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/13854cb8-c478-43c9-9f51-8ac1933b1498.png',
              label: this.$t('midjourney.styleTag.jonKlassen'),
              value: 'Jon Klassen',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/6685c7e0-ea11-488b-a8a0-610032020dfb.png',
              label: this.$t('midjourney.styleTag.kaySage'),
              value: 'Kay Sage',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/cb0c3490-dcd4-488f-96e0-45b9ee671182.png',
              label: this.$t('midjourney.styleTag.jeffreyCatherineJones'),
              value: 'Jeffrey Catherine Jones',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/72f000c5-d8d6-4015-acd4-79961e53ac50.png',
              label: this.$t('midjourney.styleTag.yaacovAgam'),
              value: 'Yaacov Agam',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/f1bd0c4d-af96-4785-99bb-3a70b7f80834.png',
              label: this.$t('midjourney.styleTag.davidHockney'),
              value: 'David Hockney',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/ad0e89d9-214a-4599-90f1-ee5dc0b5592d.png',
              label: this.$t('midjourney.styleTag.victorMoscoso'),
              value: 'Victor Moscoso',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/c3b004e0-f583-4a75-b6cf-0cc60c89b2cf.png',
              label: this.$t('midjourney.styleTag.raphaelite'),
              value: 'Raphaelite'
            },
            {
              image: 'https://cdn.acedata.cloud/9c59d174-1e1f-4ef9-b657-1beb57f58088.png',
              label: this.$t('midjourney.styleTag.stefanKoidl'),
              value: 'Stefan Koidl',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/09485865-35a8-4456-a34c-65a8a1c8d2c2.png',
              label: this.$t('midjourney.styleTag.suiIshida'),
              value: 'Sui Ishida',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/31442dfd-d6a8-4674-aade-8543190251b4.png',
              label: this.$t('midjourney.styleTag.swoon'),
              value: 'Swoon',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/842beff4-d333-4388-9880-eec6fd4baa6c.png',
              label: this.$t('midjourney.styleTag.tashaTudor'),
              value: 'Tasha Tudor',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/68c419f3-6f2c-4fbd-a251-ce289d4a9890.png',
              label: this.$t('midjourney.styleTag.tintoretto'),
              value: 'Tintoretto',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/9a3d95da-5019-4fdd-83b9-ec334e609c9d.png',
              label: this.$t('midjourney.styleTag.theodoreRobinsor'),
              value: 'Theodore Robinsor',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/e11cb0a6-2f0e-4d8d-aa0e-8b7378423790.png',
              label: this.$t('midjourney.styleTag.titian'),
              value: 'Titian',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/d3e59ba8-10e6-4d58-a732-e35d579cd3fc.png',
              label: this.$t('midjourney.styleTag.wlop'),
              value: 'WLOP',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/70f22f51-9328-4070-b9aa-578db7d4c502.png',
              label: this.$t('midjourney.styleTag.yanjunCheng'),
              value: 'Yanjun Cheng',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/e1203ff8-cb64-409e-8ba6-06f89645a843.png',
              label: this.$t('midjourney.styleTag.yojiShinkawa'),
              value: 'Yoji Shinkawa',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/6b6d7746-e38b-44db-98d8-51d59ed7531f.png',
              label: this.$t('midjourney.styleTag.zhelongXu'),
              value: 'Zhelong Xu',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/13b9621b-ff7e-4377-9550-0ca82d0f1afb.png',
              label: this.$t('midjourney.styleTag.alenaAenami'),
              value: 'Alena Aenami',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/26d30765-3201-49e9-a4a9-c7c3b8c071ef.png',
              label: this.$t('midjourney.styleTag.anntonFadeevi'),
              value: 'Annton Fadeevi',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/9b4c2bc7-16a8-4807-ad0e-ee9bdc80f1a0.png',
              label: this.$t('midjourney.styleTag.charlieBowater'),
              value: 'Charlie Bowater',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/2f50d67e-3d7e-4e06-a198-5926ce7f357d.png',
              label: this.$t('midjourney.styleTag.coryLoftis'),
              value: 'Cory Loftis',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/47823270-16a6-49cc-a11d-99122a037c68.png',
              label: this.$t('midjourney.styleTag.fenghuaZhong'),
              value: 'Fenghua Zhong',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/1a66b5fd-cbf9-4e09-b817-6effed77b5c2.png',
              label: this.$t('midjourney.styleTag.gregRutkowski'),
              value: 'Greg Rutkowski',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/d05a459a-132b-45a8-b2f3-a978eeeb44af.png',
              label: this.$t('midjourney.styleTag.hongSoonsang'),
              value: 'Hong SoonSang',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/020dbf7f-f026-47bd-90f1-4049407409a1.png',
              label: this.$t('midjourney.styleTag.dennisStock'),
              value: 'Dennis Stock',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/9c1ccc1d-121e-4182-aea0-04eac840869d.png',
              label: this.$t('midjourney.styleTag.michalLisowski'),
              value: 'Michal Lisowski',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/3292404b-e654-4c06-bcd6-5e47a2adf329.png',
              label: this.$t('midjourney.styleTag.paulLehr'),
              value: 'Paul Lehr',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/079c6053-23ad-4dc9-8166-64c5fe2f1e1a.png',
              label: this.$t('midjourney.styleTag.rossTran'),
              value: 'Ross Tran',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/0f267ba1-c031-4008-9ead-630a4bec886a.png',
              label: this.$t('midjourney.styleTag.antonPieck'),
              value: 'Anton Pieck',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/574dd25f-2116-4718-aed6-7d9be3636e22.png',
              label: this.$t('midjourney.styleTag.carlBarks'),
              value: 'Carl Barks',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/38dcdfb5-0003-46f4-8c9d-5857c95f9e59.png',
              label: this.$t('midjourney.styleTag.alphonseMucha'),
              value: 'Alphonse Mucha',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/65f2af96-e875-41f8-9797-3d34dbdf0ea4.png',
              label: this.$t('midjourney.styleTag.andyWarhol'),
              value: 'Andy Warhol',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/801224a0-da77-4095-8799-d288d1ec3c3d.png',
              label: this.$t('midjourney.styleTag.banksy'),
              value: 'Banksy',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/925c6c86-9b69-45ce-a10d-a2c64d4e0db2.png',
              label: this.$t('midjourney.styleTag.franciscoDeGoya'),
              value: 'Francisco De Goya',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/fbb81b10-c579-4dcc-a76a-c099dc0b6c20.png',
              label: this.$t('midjourney.styleTag.caravaggio'),
              value: 'Caravaggio',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/116efedd-42ea-404e-959e-607a9766001a.png',
              label: this.$t('midjourney.styleTag.diegoRivera'),
              value: 'Diego Rivera',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/6f2c1d37-f8ae-4d72-8db1-d9fb04df7114.png',
              label: this.$t('midjourney.styleTag.davidHockney'),
              value: 'David Hockney',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/b74b6b97-f6d7-4a34-840c-a81c69b9d941.png',
              label: this.$t('midjourney.styleTag.marcChagall'),
              value: 'Marc Chagall'
            },
            {
              image: 'https://cdn.acedata.cloud/f18ac9a3-a986-4670-813b-6fb81060ed48.png',
              label: this.$t('midjourney.styleTag.edgarDegas'),
              value: 'Edgar Degas',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/275b32e5-9995-46cc-babc-43a0d1aa5d19.png',
              label: this.$t('midjourney.styleTag.eugeneDelacroix'),
              value: 'Eugene Delacroix',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/500edde5-973c-4ba4-aae1-1a3d53a9b27f.png',
              label: this.$t('midjourney.styleTag.francisBacon'),
              value: 'Francis Bacon',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/f7b5cc34-a796-4f45-823c-07122ec46ef6.png',
              label: this.$t('midjourney.styleTag.fridaKahlo'),
              value: 'Frida Kahlo',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/7e41ead3-f54f-4d5f-8353-b2770d75c41b.png',
              label: this.$t('midjourney.styleTag.garaldBrom'),
              value: 'Garald Brom',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/4a46247a-cd9b-48fd-b247-8268d9a891bf.png',
              label: this.$t('midjourney.styleTag.gustavKlimt'),
              value: 'Gustav Klimt',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/3793eae9-61e9-4f16-9c0c-a77c194c45bc.png',
              label: this.$t('midjourney.styleTag.henriMatisse'),
              value: 'Henri Matisse',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/dffa261d-755b-483d-88b7-058c09efd6af.png',
              label: this.$t('midjourney.styleTag.jackKirby'),
              value: 'Jack Kirby',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/4cda1423-455b-463f-981d-b2af8ae1dd95.png',
              label: this.$t('midjourney.styleTag.jacksonPollock'),
              value: 'Jackson Pollock',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/d318e4bc-d69f-4e7a-b6ae-49557e3cd569.png',
              label: this.$t('midjourney.styleTag.johannesVermeer'),
              value: 'Johannes Vermeer',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/4ee7f9d2-01c0-4043-90f3-0174878a2ce7.png',
              label: this.$t('midjourney.styleTag.jeanMichelBasquiat'),
              value: 'Jean Michel Basquiat',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/f60eb307-78b3-4f5e-bfd9-07603bc383c9.png',
              label: this.$t('midjourney.styleTag.marcelDuchamp'),
              value: 'Marcel Duchamp',
              advanced: true
            }
          ]
        },
        material: {
          displayName: this.$t('midjourney.styleCategory.material'),
          items: [
            {
              image: 'https://cdn.acedata.cloud/f2ce056d-6a89-4b40-b026-5a60cbb1efda.png',
              label: this.$t('midjourney.styleTag.aluminum'),
              value: 'Aluminum'
            },
            {
              image: 'https://cdn.acedata.cloud/069c6b1f-0666-4df6-bde6-a1729b33ade1.png',
              label: this.$t('midjourney.styleTag.brick'),
              value: 'Brick'
            },
            {
              image: 'https://cdn.acedata.cloud/39f2cbb9-be6a-4669-a7c3-b01dfbb2b563.png',
              label: this.$t('midjourney.styleTag.bronze'),
              value: 'Bronze'
            },
            {
              image: 'https://cdn.acedata.cloud/42b30429-2733-41a5-aa4c-e3e0cd50528a.png',
              label: this.$t('midjourney.styleTag.carbonFiber'),
              value: 'Carbon Fiber'
            },
            {
              image: 'https://cdn.acedata.cloud/90eeef27-6bdb-4f36-8e17-f1bb49881258.png',
              label: this.$t('midjourney.styleTag.cardboard'),
              value: 'Cardboard'
            },
            {
              image: 'https://cdn.acedata.cloud/470235fb-19a8-4ba8-ac9b-236abecf0985.png',
              label: this.$t('midjourney.styleTag.cellulose'),
              value: 'Cellulose'
            },
            {
              image: 'https://cdn.acedata.cloud/a8621e16-b046-4300-ab24-09602f734cb9.png',
              label: this.$t('midjourney.styleTag.ceramic'),
              value: 'Ceramic'
            },
            {
              image: 'https://cdn.acedata.cloud/af14acf6-92ff-42f8-ae14-ce4b63237bd5.png',
              label: this.$t('midjourney.styleTag.cotton'),
              value: 'Cotton'
            },
            {
              image: 'https://cdn.acedata.cloud/d93e6f18-3729-46cc-aa96-9662f2abae3d.png',
              label: this.$t('midjourney.styleTag.fabric'),
              value: 'Fabric'
            },
            {
              image: 'https://cdn.acedata.cloud/660533aa-dac7-4968-b27e-0f085b9a67a5.png',
              label: this.$t('midjourney.styleTag.fiberOptic'),
              value: 'Fiber Optic'
            },
            {
              image: 'https://cdn.acedata.cloud/94be6d51-5cb3-4362-8274-7d833a88bb79.png',
              label: this.$t('midjourney.styleTag.foil'),
              value: 'Foil'
            },
            {
              image: 'https://cdn.acedata.cloud/b89e102d-2fef-4619-8427-94c6bfbeb832.png',
              label: this.$t('midjourney.styleTag.yarn'),
              value: 'Yarn',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/b72ef152-11a7-4c51-b6b4-dc4308995f9e.png',
              label: this.$t('midjourney.styleTag.glass'),
              value: 'Glass'
            },
            {
              image: 'https://cdn.acedata.cloud/bca80e91-46ba-4793-b29c-1b5c47b201d7.png',
              label: this.$t('midjourney.styleTag.gold'),
              value: 'Gold',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/3d1e4da5-404b-4f89-8e06-988de47208bd.png',
              label: this.$t('midjourney.styleTag.gummies'),
              value: 'Gummies',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/8afba6b0-a8a5-49c9-bfc5-ebd7b0e12443.png',
              label: this.$t('midjourney.styleTag.latex'),
              value: 'Latex'
            },
            {
              image: 'https://cdn.acedata.cloud/d5c39f1c-1be0-4065-80af-e1cb4e627cf2.png',
              label: this.$t('midjourney.styleTag.leather'),
              value: 'Leather'
            },
            {
              image: 'https://cdn.acedata.cloud/6e41e8bd-cb0b-4504-8655-a3b1b32ac11c.png',
              label: this.$t('midjourney.styleTag.magma'),
              value: 'Magma'
            },
            {
              image: 'https://cdn.acedata.cloud/f816fffa-4a7f-4d60-afcb-e19b0c36d176.png',
              label: this.$t('midjourney.styleTag.metallic'),
              value: 'Metallic'
            },
            {
              image: 'https://cdn.acedata.cloud/74c9fe01-37e6-4d05-831a-5778eb34c521.png',
              label: this.$t('midjourney.styleTag.nickel'),
              value: 'Nickel',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/85186eac-1806-4739-9289-8d76aac359b3.png',
              label: this.$t('midjourney.styleTag.nylon'),
              value: 'Nylon'
            },
            {
              image: 'https://cdn.acedata.cloud/355d9507-62fa-4c69-986f-def2f2f930c5.png',
              label: this.$t('midjourney.styleTag.paper'),
              value: 'Paper'
            },
            {
              image: 'https://cdn.acedata.cloud/6c2626b2-191e-4b85-a97d-e561a2b5c79b.png',
              label: this.$t('midjourney.styleTag.plastic'),
              value: 'Plastic',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/ff0d301d-8181-463c-a276-9b4805321afd.png',
              label: this.$t('midjourney.styleTag.quartz'),
              value: 'Quartz'
            },
            {
              image: 'https://cdn.acedata.cloud/7b90754d-2fa5-490e-a73b-d2887525d2e6.png',
              label: this.$t('midjourney.styleTag.wrap'),
              value: 'Wrap',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/7411e62a-546e-4cd2-8446-73c4fb8f103b.png',
              label: this.$t('midjourney.styleTag.wooden'),
              value: 'Wooden'
            },
            {
              image: 'https://cdn.acedata.cloud/44e8830f-4be2-471d-a9d4-aaf4913e7451.png',
              label: this.$t('midjourney.styleTag.slime'),
              value: 'Slime',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/16b10e75-a7e7-4b87-804a-2bfc9c18096f.png',
              label: this.$t('midjourney.styleTag.engraving'),
              value: 'Engraving'
            },
            {
              image: 'https://cdn.acedata.cloud/b66ec7e2-fd82-4edd-a523-34b87872f544.png',
              label: this.$t('midjourney.styleTag.ivory'),
              value: 'Ivory'
            },
            {
              image: 'https://cdn.acedata.cloud/098b954d-1197-414e-b4bd-68e3928b9eb3.png',
              label: this.$t('midjourney.styleTag.basalt'),
              value: 'Basalt',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/b948dd7d-939b-48b5-b37c-09e0ebd6ede6.png',
              label: this.$t('midjourney.styleTag.pine'),
              value: 'Pine',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/4c56fc7d-94c8-4055-9d6e-3bc6662c92d7.png',
              label: this.$t('midjourney.styleTag.diamond'),
              value: 'Diamond'
            },
            {
              image: 'https://cdn.acedata.cloud/70de6b75-bb29-4b2a-ae8a-016db33c8184.png',
              label: this.$t('midjourney.styleTag.amethyst'),
              value: 'Amethyst',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/8d2b60e1-c98c-4de2-8a67-4b10c0d2482a.png',
              label: this.$t('midjourney.styleTag.ruby'),
              value: 'Ruby',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/c0f01b99-32a6-4c34-a2d8-448fab08f126.png',
              label: this.$t('midjourney.styleTag.highPolished'),
              value: 'High polished',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/5091142a-3959-40f3-9ea5-f41a29584735.png',
              label: this.$t('midjourney.styleTag.brushed'),
              value: 'Brushed',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/3f84ddc5-5afe-41d1-85cc-2ded7a44d859.png',
              label: this.$t('midjourney.styleTag.matte'),
              value: 'Matte',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/655f5114-b3dd-4b9a-a3cb-94a1a814fb11.png',
              label: this.$t('midjourney.styleTag.satin'),
              value: 'Satin',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/6ec4178e-86e6-4026-aa86-e14eb4e92097.png',
              label: this.$t('midjourney.styleTag.sandblasted'),
              value: 'Sandblasted',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/1c9a4277-5550-4cd4-852a-c785d8505a0f.png',
              label: this.$t('midjourney.styleTag.ebony'),
              value: 'Ebony',
              advanced: true
            }
          ]
        },
        camera: {
          displayName: this.$t('midjourney.styleCategory.camera'),
          items: [
            {
              image: 'https://cdn.acedata.cloud/9bcf851a-7b94-4554-864b-edcbe0f67017.png',
              label: this.$t('midjourney.styleTag.bokeh'),
              value: 'Bokeh'
            },
            {
              image: 'https://cdn.acedata.cloud/f4599568-5889-4da9-8852-8b5361c54412.png',
              label: this.$t('midjourney.styleTag.aerialView'),
              value: 'Aerial view'
            },
            {
              image: 'https://cdn.acedata.cloud/bea180e2-9078-42bd-9392-b0ee2b372430.png',
              label: this.$t('midjourney.styleTag.shotByDslr'),
              value: 'Shot by DSLR',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/42444cbd-5442-4093-8911-645272c08863.png',
              label: this.$t('midjourney.styleTag.360Panorama'),
              value: '360Panorama'
            },
            {
              image: 'https://cdn.acedata.cloud/99875464-0be7-44da-adf5-958d2c73eb31.png',
              label: this.$t('midjourney.styleTag.panorama'),
              value: 'Panorama'
            },
            {
              image: 'https://cdn.acedata.cloud/e3c3a204-9210-44da-b6fc-5f9a1fea52e0.png',
              label: this.$t('midjourney.styleTag.telephotoLens'),
              value: 'Telephoto Lens'
            },
            {
              image: 'https://cdn.acedata.cloud/7bd1f91d-cd6d-48d1-9f07-68382a54a552.png',
              label: this.$t('midjourney.styleTag.macroShot'),
              value: 'Macro shot'
            },
            {
              image: 'https://cdn.acedata.cloud/09aca457-2d96-4f60-b5ec-9fedf7a3fcb9.png',
              label: this.$t('midjourney.styleTag.microscopy'),
              value: 'Microscopy'
            },
            {
              image: 'https://cdn.acedata.cloud/fb39b4ab-d728-456b-8905-b4c0302f4094.png',
              label: this.$t('midjourney.styleTag.magnification'),
              value: 'Magnification'
            },
            {
              image: 'https://cdn.acedata.cloud/b9956b79-70b1-44af-bca3-5eddd412615a.png',
              label: this.$t('midjourney.styleTag.closeUp'),
              value: 'Close up'
            },
            {
              image: 'https://cdn.acedata.cloud/2c6b2c92-f790-44e1-bc65-b3182aa484bd.png',
              label: this.$t('midjourney.styleTag.fullBody'),
              value: 'Full body'
            },
            {
              image: 'https://cdn.acedata.cloud/05c7f5a8-4a79-4a1c-a4a9-792862ad118c.png',
              label: this.$t('midjourney.styleTag.portrait'),
              value: 'Portrait'
            },
            {
              image: 'https://cdn.acedata.cloud/aeb48a08-f0b6-47db-8c5d-ae6f0f92b93d.png',
              label: this.$t('midjourney.styleTag.profile'),
              value: 'Profile'
            },
            {
              image: 'https://cdn.acedata.cloud/dd655235-8f80-43b2-823f-bdb44864bee1.png',
              label: this.$t('midjourney.styleTag.pinholeLens'),
              value: 'Pinhole Lens',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/7ad3f221-96f6-4014-953e-853c429d5d57.png',
              label: this.$t('midjourney.styleTag.wideView'),
              value: 'Wide view'
            },
            {
              image: 'https://cdn.acedata.cloud/698fbcc7-5ad1-40cb-a926-95189dc9e59b.png',
              label: this.$t('midjourney.styleTag.telescopeLens'),
              value: 'Telescope Lens',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/2e41309b-f006-483f-9843-e15f4ced6be7.png',
              label: this.$t('midjourney.styleTag.satelliteImagery'),
              value: 'Satellite Imagery'
            },
            {
              image: 'https://cdn.acedata.cloud/79ad137d-3015-4335-a4e3-2ed29f9b850b.png',
              label: this.$t('midjourney.styleTag.headshot'),
              value: 'Headshot'
            },
            {
              image: 'https://cdn.acedata.cloud/d06164a9-ba01-457f-b8cc-f0b38a87b4d5.png',
              label: this.$t('midjourney.styleTag.extremeCloseup'),
              value: 'Extreme closeup',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/b8e10ef3-b37c-45f0-b930-be729c8d17a1.png',
              label: this.$t('midjourney.styleTag.ultrawideShot'),
              value: 'Ultrawide shot'
            },
            {
              image: 'https://cdn.acedata.cloud/21eaa8a4-a8f1-448d-9f00-ff8fb0213046.png',
              label: this.$t('midjourney.styleTag.birdView'),
              value: 'Bird view',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/43fadf68-dad1-45d2-bc22-54b1b2792a00.png',
              label: this.$t('midjourney.styleTag.topView'),
              value: 'Top view',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/f8953e9e-6daf-4a70-a691-6f89e91f0b97.png',
              label: this.$t('midjourney.styleTag.frontView'),
              value: 'Front view',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/f2228145-dc8f-4e06-be21-5d18bf50f7cf.png',
              label: this.$t('midjourney.styleTag.sideView'),
              value: 'Side view',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/b218d1cc-60a7-4f62-a719-b852cd6ebf03.png',
              label: this.$t('midjourney.styleTag.backView'),
              value: 'Back view',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/186522ef-7b09-40d8-a712-43dde1266bbf.png',
              label: this.$t('midjourney.styleTag.faceShot'),
              value: 'Face shot'
            },
            {
              image: 'https://cdn.acedata.cloud/6a0c1136-2817-42bb-b1e3-c65a130e70cf.png',
              label: this.$t('midjourney.styleTag.chestShot'),
              value: 'Chest shot'
            },
            {
              image: 'https://cdn.acedata.cloud/8ac3bf91-2066-420d-8da1-5d6214ad2668.png',
              label: this.$t('midjourney.styleTag.waistShot'),
              value: 'Waist shot'
            },
            {
              image: 'https://cdn.acedata.cloud/2558b92f-cb3b-410e-85cd-791eb7d29c60.png',
              label: this.$t('midjourney.styleTag.extraLongShot'),
              value: 'Extra long shot'
            },
            {
              image: 'https://cdn.acedata.cloud/0f5c9250-55a4-4eed-8ddf-af18cb52e243.png',
              label: this.$t('midjourney.styleTag.lookUp'),
              value: 'look up'
            },
            {
              image: 'https://cdn.acedata.cloud/5e0df52d-e986-4851-b6ae-dc0be744713d.png',
              label: this.$t('midjourney.styleTag.isometricview'),
              value: 'isometricview',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/0d6491dd-1f64-423c-b63b-0f2e96a258e5.png',
              label: this.$t('midjourney.styleTag.highAngleView'),
              value: 'High angle view',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/5b68beee-c079-4a8e-84c5-cb3cc0f6c77b.png',
              label: this.$t('midjourney.styleTag.lowAngleView'),
              value: 'Low angle view',
              advanced: true
            }
          ]
        },
        emotion: {
          displayName: this.$t('midjourney.styleCategory.emotion'),
          items: [
            {
              image: 'https://cdn.acedata.cloud/033c9cd1-f5cc-448f-8d0a-e6559bbd57e3.png',
              label: this.$t('midjourney.styleTag.happy'),
              value: 'Happy'
            },
            {
              image: 'https://cdn.acedata.cloud/d07fbadd-78e4-4a98-bcf8-45b4805c9239.png',
              label: this.$t('midjourney.styleTag.excited'),
              value: 'Excited'
            },
            {
              image: 'https://cdn.acedata.cloud/aa94049d-e8fc-4e0e-97b1-afa174d99b88.png',
              label: this.$t('midjourney.styleTag.angry'),
              value: 'Angry'
            },
            {
              image: 'https://cdn.acedata.cloud/ede7f1d3-5ce2-4b8f-9cb9-c4bd47b80cae.png',
              label: this.$t('midjourney.styleTag.ped'),
              value: 'ped'
            },
            {
              image: 'https://cdn.acedata.cloud/88f9e6ba-2961-497e-ae00-9af36fa2c2d4.png',
              label: this.$t('midjourney.styleTag.disgusted'),
              value: 'Disgusted'
            },
            {
              image: 'https://cdn.acedata.cloud/fe91b67b-2430-424a-bf72-1a299e61f049.png',
              label: this.$t('midjourney.styleTag.supnned'),
              value: 'supnned'
            },
            {
              image: 'https://cdn.acedata.cloud/24dcfb80-d987-48b0-9595-82276b2a1f94.png',
              label: this.$t('midjourney.styleTag.hopeful'),
              value: 'Hopeful'
            },
            {
              image: 'https://cdn.acedata.cloud/f2628539-bdf5-471d-9ceb-f0731c46b593.png',
              label: this.$t('midjourney.styleTag.anxious'),
              value: 'Anxious'
            },
            {
              image: 'https://cdn.acedata.cloud/f280d69a-eb1b-4259-b56d-66510f38ec82.png',
              label: this.$t('midjourney.styleTag.elated'),
              value: 'Elated'
            },
            {
              image: 'https://cdn.acedata.cloud/94b78236-ba14-4aab-8985-3921b2146fc9.png',
              label: this.$t('midjourney.styleTag.fearful'),
              value: 'Fearful'
            },
            {
              image: 'https://cdn.acedata.cloud/68576d87-224f-463f-85c9-5fbeb386a035.png',
              label: this.$t('midjourney.styleTag.hateful'),
              value: 'Hateful'
            },
            {
              image: 'https://cdn.acedata.cloud/e0413400-096f-4072-8faf-5ef82f8cc265.png',
              label: this.$t('midjourney.styleTag.apoow'),
              value: 'Apoow',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/c0f4b0f4-1399-468f-873a-a04f4b7929f8.png',
              label: this.$t('midjourney.styleTag.dark'),
              value: 'Dark',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/297d5f3f-ebc9-4c9f-b656-07359b313871.png',
              label: this.$t('midjourney.styleTag.brutal'),
              value: 'Brutal',
              advanced: true
            }
          ]
        },
        chinese: {
          displayName: this.$t('midjourney.styleCategory.chinese'),
          items: [
            {
              image: 'https://cdn.acedata.cloud/b29020e5-532d-4b30-94b0-cf5405242fc6.png',
              label: this.$t('midjourney.styleTag.hanfu'),
              value: 'Hanfu'
            },
            {
              image: 'https://cdn.acedata.cloud/e00eb48c-8240-4468-ac15-1a9d3349b636.png',
              label: this.$t('midjourney.styleTag.cheongsam'),
              value: 'Cheongsam'
            },
            {
              image: 'https://cdn.acedata.cloud/87d89bc5-cb61-4780-8894-c1564bdebd66.png',
              label: this.$t('midjourney.styleTag.chineseCostume'),
              value: 'Chinese costume'
            },
            {
              image: 'https://cdn.acedata.cloud/811453d2-2715-44fe-8609-b0d184486b19.png',
              label: this.$t('midjourney.styleTag.chineseDress'),
              value: 'Chinese dress'
            },
            {
              image: 'https://cdn.acedata.cloud/2463a720-b803-4d0d-9cac-6a7d5b61001d.png',
              label: this.$t('midjourney.styleTag.wuxia'),
              value: 'Wuxia'
            },
            {
              image: 'https://cdn.acedata.cloud/2fbee5a1-8a5c-4bfb-a52c-895ff3f53c3c.png',
              label: this.$t('midjourney.styleTag.chinesePhoenix'),
              value: 'Chinese phoenix'
            },
            {
              image: 'https://cdn.acedata.cloud/53fd3a51-7739-493f-aff0-daaea74b942c.png',
              label: this.$t('midjourney.styleTag.kungfu'),
              value: 'Kungfu'
            },
            {
              image: 'https://cdn.acedata.cloud/bc4c6bb0-82a5-4bbb-b4e3-96a14c52aed3.png',
              label: this.$t('midjourney.styleTag.kunquOpera'),
              value: 'Kunqu opera',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/291ca1c1-069e-4067-8b9d-1c5c11c2ff14.png',
              label: this.$t('midjourney.styleTag.cloisonne'),
              value: 'Cloisonne',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/17e87115-06ec-4f7b-9b8e-daf782cd4d59.png',
              label: this.$t('midjourney.styleTag.porcelain'),
              value: 'Porcelain'
            },
            {
              image: 'https://cdn.acedata.cloud/c9cc4712-24b9-4ff8-926b-02bd626df9a9.png',
              label: this.$t('midjourney.styleTag.embroidered'),
              value: 'Embroidered'
            },
            {
              image: 'https://cdn.acedata.cloud/7da286ae-d1e6-4a21-8ba5-10ff7bf9d379.png',
              label: this.$t('midjourney.styleTag.jade'),
              value: 'Jade'
            },
            {
              image: 'https://cdn.acedata.cloud/11a2d9f8-3c29-4b0b-ae10-525928f71bce.png',
              label: this.$t('midjourney.styleTag.chinesePavilion'),
              value: 'Chinese pavilion',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/639b5e99-8210-4525-b63f-8b89019d07f3.png',
              label: this.$t('midjourney.styleTag.plumFlower'),
              value: 'Plum flower'
            },
            {
              image: 'https://cdn.acedata.cloud/cc87764c-2754-4cb7-8bc3-1070b31ec62b.png',
              label: this.$t('midjourney.styleTag.forbiddenCity'),
              value: 'Forbidden city',
              advanced: true
            },
            {
              image: 'https://cdn.acedata.cloud/26d2f2aa-ca26-4c0e-a8c7-86a81aafc475.png',
              label: this.$t('midjourney.styleTag.peony'),
              value: 'Peony',
              advanced: true
            }
          ]
        },
        special: {
          displayName: this.$t('midjourney.styleCategory.special'),
          items: [
            {
              image: 'https://cdn.acedata.cloud/0ca0fd15-cc8d-420e-acf5-6c489e03c7ff.png',
              label: this.$t('midjourney.styleTag.unrealEngine'),
              value: 'Unreal engine'
            },
            {
              image: 'https://cdn.acedata.cloud/ead8ba11-6634-409e-8fea-7b31ca3974bc.png',
              label: this.$t('midjourney.styleTag.octaneRender'),
              value: 'Octane render'
            },
            {
              image: 'https://cdn.acedata.cloud/209f1bd9-5d44-4699-97ad-fdde73304efb.png',
              label: this.$t('midjourney.styleTag.maxonCinema4D'),
              value: 'Maxon cinema 4D'
            },
            {
              image: 'https://cdn.acedata.cloud/93c31b69-7af4-4d1f-99d6-114a34133613.png',
              label: this.$t('midjourney.styleTag.quixelMegascansRender'),
              value: 'Quixel megascans render'
            },
            {
              image: 'https://cdn.acedata.cloud/9883f161-5069-414b-9d23-bd63806c5205.png',
              label: this.$t('midjourney.styleTag.coronaRender'),
              value: 'Corona render'
            },
            {
              image: 'https://cdn.acedata.cloud/9c28e4af-28b2-4b97-abd4-e4f42d014f3a.png',
              label: this.$t('midjourney.styleTag.vRay'),
              value: 'V-ray'
            },
            {
              image: 'https://cdn.acedata.cloud/01d71ceb-7d17-4318-9914-a6a5fe0abc11.png',
              label: this.$t('midjourney.styleTag.architecturalVisualisation'),
              value: 'Architectural visualisation'
            },
            {
              image: 'https://cdn.acedata.cloud/e7f2cd21-2efc-4e18-b38d-3c2cbd95c5ec.png',
              label: this.$t('midjourney.styleTag.dramaticContrast'),
              value: 'Dramatic contrast'
            },
            {
              image: 'https://cdn.acedata.cloud/8f113377-ba6e-4fb0-bd56-df8635ab6345.png',
              label: this.$t('midjourney.styleTag.goldAndBlackTone'),
              value: 'Gold and black tone'
            },
            {
              image: 'https://cdn.acedata.cloud/6da8b72d-5a67-4c06-b915-8c0b5314d9c8.png',
              label: this.$t('midjourney.styleTag.whiteAndPinkTone'),
              value: 'White and pink tone'
            },
            {
              image: 'https://cdn.acedata.cloud/09abd535-8ab6-451f-8bce-29859429244b.png',
              label: this.$t('midjourney.styleTag.redAndBlackTone'),
              value: 'Red and black tone'
            },
            {
              image: 'https://cdn.acedata.cloud/81115846-7676-4edb-b7cf-df816c90de7f.png',
              label: this.$t('midjourney.styleTag.neonShades'),
              value: 'Neon shades'
            },
            {
              image: 'https://cdn.acedata.cloud/dfcc7a8a-e145-4824-b12b-bd29292daa5f.png',
              label: this.$t('midjourney.styleTag.richColor'),
              value: 'Rich color'
            },
            {
              image: 'https://cdn.acedata.cloud/38b05148-73c6-4db3-bddd-b972f27f4671.png',
              label: this.$t('midjourney.styleTag.monotone'),
              value: 'Monotone'
            },
            {
              image: 'https://cdn.acedata.cloud/6f6704da-1854-43d7-811f-3145fea96909.png',
              label: this.$t('midjourney.styleTag.theLowPurityTone'),
              value: 'The low-purity tone'
            },
            {
              image: 'https://cdn.acedata.cloud/3724b5ef-e7dd-4234-b2a2-f71c6b69b4ac.png',
              label: this.$t('midjourney.styleTag.theHighPurityTone'),
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
    $height: 100px;
    $width: 100px;
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
      width: $height;
      height: $width;
    }
    .name {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      width: $width;
      background-color: rgba(0, 0, 0, 0.5);
      color: white;
      font-size: 10px;
      text-align: center;
      padding: 0 5px;
    }
  }
}
</style>
