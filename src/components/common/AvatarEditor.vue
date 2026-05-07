<template>
  <div>
    <canvas
      id="avatarEditorCanvas"
      ref="avatarEditorCanvas"
      :width="canvasWidth"
      :height="canvasHeight"
      class="cursorPointer"
      @dragover.prevent
      @drop="onDrop"
      @mousedown="onDragStart"
      @touchstart="onDragStart"
      @click="clicked"
    >
    </canvas>
    <input ref="input" type="file" :accept="accept" style="display: none" @change="fileSelected" />
  </div>
</template>

<script>
export default {
  props: {
    image: {
      type: String,
      default: ''
    },
    accept: {
      type: String,
      default: 'image/*'
    },
    placeholderSvg: {
      type: String,
      default:
        '<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 65 65"><defs><style>.cls-1{fill:#000;}</style></defs><title>Upload_Upload</title><path class="cls-1" d="M32.5,1A31.5,31.5,0,1,1,1,32.5,31.54,31.54,0,0,1,32.5,1m0-1A32.5,32.5,0,1,0,65,32.5,32.5,32.5,0,0,0,32.5,0h0Z"/><polygon class="cls-1" points="41.91 28.2 32.59 18.65 23.09 28.39 24.17 29.44 31.87 21.54 31.87 40.05 33.37 40.05 33.37 21.59 40.83 29.25 41.91 28.2"/><polygon class="cls-1" points="40.66 40.35 40.66 44.35 24.34 44.35 24.34 40.35 22.34 40.35 22.34 44.35 22.34 46.35 24.34 46.35 40.66 46.35 42.66 46.35 42.66 44.35 42.66 40.35 40.66 40.35"/></svg>'
    },
    border: {
      type: Number,
      default: 25
    },
    borderRadius: {
      type: Number,
      default: 0
    },
    width: {
      type: Number,
      default: 200
    },
    height: {
      type: Number,
      default: 200
    },
    color: {
      type: Array,
      default: () => [0, 0, 0, 0.5]
    },
    scale: {
      type: Number,
      default: 1
    },
    rotation: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      cursor: 'cursorPointer',
      canvas: null,
      context: null,
      dragged: false,
      imageLoaded: false,
      changed: false,
      state: {
        drag: false,
        my: null,
        mx: null,
        xxx: 'ab',
        image: {
          x: 0,
          y: 0,
          resource: null
        }
      }
    };
  },
  computed: {
    canvasWidth() {
      return this.getDimensions().canvas.width;
    },
    canvasHeight() {
      return this.getDimensions().canvas.height;
    },
    rotationRadian() {
      return (this.rotation * Math.PI) / 180;
    }
  },
  watch: {
    state: {
      handler(val, oldval) {
        if (this.imageLoaded) {
          this.redraw();
        }
      },
      deep: true
    },
    scale() {
      if (this.imageLoaded) {
        this.replaceImageInBounds();
        this.redraw();
      }
    },
    rotation() {
      if (this.imageLoaded) {
        this.replaceImageInBounds();
        this.redraw();
      }
    },
    borderRadius() {
      this.redraw();
    }
  },
  mounted() {
    let self = this;
    this.canvas = this.$refs.avatarEditorCanvas;
    this.context = this.canvas.getContext('2d');
    this.paint();

    if (!this.image) {
      var placeHolder = this.svgToImage(this.placeholderSvg);

      placeHolder.onload = function () {
        var x = self.canvasWidth / 2 - this.width / 2;
        var y = self.canvasHeight / 2 - this.height / 2;
        self.context.drawImage(placeHolder, x, y, this.width, this.height);
      };
    } else {
      this.loadImage(this.image);
    }
  },
  methods: {
    drawRoundedRect(context, x, y, width, height, borderRadius) {
      if (borderRadius === 0) {
        context.rect(x, y, width, height);
      } else {
        const widthMinusRad = width - borderRadius;
        const heightMinusRad = height - borderRadius;
        context.translate(x, y);
        context.arc(borderRadius, borderRadius, borderRadius, Math.PI, Math.PI * 1.5);
        context.lineTo(widthMinusRad, 0);
        context.arc(widthMinusRad, borderRadius, borderRadius, Math.PI * 1.5, Math.PI * 2);
        context.lineTo(width, heightMinusRad);
        context.arc(widthMinusRad, heightMinusRad, borderRadius, Math.PI * 2, Math.PI * 0.5);
        context.lineTo(borderRadius, height);
        context.arc(borderRadius, heightMinusRad, borderRadius, Math.PI * 0.5, Math.PI);
        context.translate(-x, -y);
      }
    },
    svgToImage(rawSVG) {
      let svg = new Blob([rawSVG], { type: 'image/svg+xml;charset=utf-8' });
      let domURL = self.URL || self.webkitURL || self;
      let url = domURL.createObjectURL(svg);
      let img = new Image();
      img.src = url;
      return img;
    },
    setState(state1) {
      var min = Math.ceil(1);
      var max = Math.floor(10000);

      this.state = state1;
      this.state.cnt = 'HELLO' + Math.floor(Math.random() * (max - min)) + min;
    },
    paint() {
      this.context.save();
      this.context.translate(0, 0);
      this.context.fillStyle = 'rgba(' + this.color.slice(0, 4).join(',') + ')';

      let borderRadius = this.borderRadius;
      const dimensions = this.getDimensions();
      const borderSize = dimensions.border;
      const height = dimensions.canvas.height;
      const width = dimensions.canvas.width;

      // clamp border radius between zero (perfect rectangle) and half the size without borders (perfect circle or "pill")
      borderRadius = Math.max(borderRadius, 0);
      borderRadius = Math.min(borderRadius, width / 2 - borderSize, height / 2 - borderSize);

      this.context.beginPath();

      // inner rect, possibly rounded
      this.drawRoundedRect(
        this.context,
        borderSize,
        borderSize,
        width - borderSize * 2,
        height - borderSize * 2,
        borderRadius
      );

      this.context.rect(width, 0, -width, height); // outer rect, drawn "counterclockwise"
      this.context.fill('evenodd');
      this.context.restore();
    },
    getDimensions() {
      return {
        width: this.width,
        height: this.height,
        border: this.border,
        canvas: {
          width: this.width + this.border * 2,
          height: this.height + this.border * 2
        }
      };
    },
    onDrop(e) {
      e = e || window.event;
      e.stopPropagation();
      e.preventDefault();

      if (e.dataTransfer && e.dataTransfer.files.length) {
        // this.props.onDropFile(e)
        const reader = new FileReader();
        const file = e.dataTransfer.files[0];
        this.changed = true;
        reader.onload = (e) => this.loadImage(e.target.result);
        reader.readAsDataURL(file);
      }
    },
    onDragStart(e) {
      e = e || window.event;
      e.preventDefault();
      this.state.drag = true;
      this.state.mx = null;
      this.state.my = null;
      this.cursor = 'cursorGrabbing';
      let eventSubject = document;
      let hasMoved = false;
      let handleMouseUp = (event) => {
        this.onDragEnd(event);
        if (!hasMoved && event.targetTouches) {
          e.target.click();
        }
        eventSubject.removeEventListener('mouseup', handleMouseUp);
        eventSubject.removeEventListener('mousemove', handleMouseMove);
        eventSubject.removeEventListener('touchend', handleMouseUp);
        eventSubject.removeEventListener('touchmove', handleMouseMove);
      };
      let handleMouseMove = (event) => {
        hasMoved = true;
        this.onMouseMove(event);
      };
      eventSubject.addEventListener('mouseup', handleMouseUp);
      eventSubject.addEventListener('mousemove', handleMouseMove);
      eventSubject.addEventListener('touchend', handleMouseUp);
      eventSubject.addEventListener('touchmove', handleMouseMove);
    },
    onDragEnd(e) {
      if (this.state.drag) {
        this.state.drag = false;
        this.cursor = 'cursorPointer';
      }
    },
    onMouseMove(e) {
      e = e || window.event;
      if (this.state.drag === false) {
        return;
      }

      this.dragged = true;
      this.changed = true;

      let imageState = this.state.image;
      const lastX = imageState.x;
      const lastY = imageState.y;

      const mousePositionX = e.targetTouches ? e.targetTouches[0].pageX : e.clientX;
      const mousePositionY = e.targetTouches ? e.targetTouches[0].pageY : e.clientY;

      const newState = {
        mx: mousePositionX,
        my: mousePositionY,
        image: imageState
      };

      if (this.state.mx && this.state.my) {
        const xDiff = (this.state.mx - mousePositionX) / this.scale;
        const yDiff = (this.state.my - mousePositionY) / this.scale;

        imageState.y = this.getBoundedY(lastY - yDiff, this.scale);
        imageState.x = this.getBoundedX(lastX - xDiff, this.scale);
      }

      this.state.mx = newState.mx;
      this.state.my = newState.my;
      this.state.image = imageState;
      // this.setState(newState)
    },
    replaceImageInBounds() {
      let imageState = this.state.image;
      imageState.y = this.getBoundedY(imageState.y, this.scale);
      imageState.x = this.getBoundedX(imageState.x, this.scale);
    },
    loadImage(imageURL) {
      let imageObj = new Image();
      let self = this;

      // imageObj.onload = () => this.handleImageReady(imageObj);
      imageObj.onload = () => {
        let imageState = self.getInitialSize(imageObj.width, imageObj.height);
        self.state.image.x = 0;
        self.state.image.y = 0;
        self.state.image.resource = imageObj;
        self.state.image.width = imageState.width;
        self.state.image.height = imageState.height;
        self.state.drag = false;
        self.$emit('vue-avatar-editor:image-ready', self.scale);
        self.imageLoaded = true;
        this.$emit('imageLoaded', self.imageLoaded);
        self.cursor = 'cursorGrab';
      };
      imageObj.onerror = (err) => console.log('error loading image: ', err);

      // imageObj.onerror = this.props.onLoadFailure
      if (!this.isDataURL(imageURL)) {
        imageObj.crossOrigin = 'anonymous';
      }

      imageObj.src = imageURL;
    },
    getInitialSize(width, height) {
      let newHeight;
      let newWidth;

      const dimensions = this.getDimensions();
      const canvasRatio = dimensions.height / dimensions.width;
      const imageRatio = height / width;

      if (canvasRatio > imageRatio) {
        newHeight = this.getDimensions().height;
        newWidth = width * (newHeight / height);
      } else {
        newWidth = this.getDimensions().width;
        newHeight = height * (newWidth / width);
      }

      return {
        height: newHeight,
        width: newWidth
      };
    },
    isDataURL(str) {
      if (str === null) {
        return false;
      }
      return !!str.match(
        /^\s*data:([a-z]+\/[a-z]+(;[a-z\-]+=[a-z\-]+)?)?(;base64)?,[a-z0-9!$&',()*+;=\-._~:@\/?%\s]*\s*$/i
      ); // eslint-disable-line no-useless-escape
    },
    getBoundedX(x, scale) {
      var image = this.state.image;
      var dimensions = this.getDimensions();
      let width =
        Math.abs(image.width * Math.cos(this.rotationRadian)) + Math.abs(image.height * Math.sin(this.rotationRadian));
      let widthDiff = Math.floor((width - dimensions.width / scale) / 2);
      widthDiff = Math.max(0, widthDiff);
      return Math.max(-widthDiff, Math.min(x, widthDiff));
    },
    getBoundedY(y, scale) {
      var image = this.state.image;
      var dimensions = this.getDimensions();
      let height =
        Math.abs(image.width * Math.sin(this.rotationRadian)) + Math.abs(image.height * Math.cos(this.rotationRadian));
      let heightDiff = Math.floor((height - dimensions.height / scale) / 2);
      heightDiff = Math.max(0, heightDiff);
      return Math.max(-heightDiff, Math.min(y, heightDiff));
    },
    paintImage(context, image, border) {
      if (image.resource) {
        var position = this.calculatePosition(image, border);
        context.save();
        context.globalCompositeOperation = 'destination-over';
        let dimensions = this.getDimensions();
        context.translate(dimensions.canvas.width / 2, dimensions.canvas.height / 2);
        context.rotate(this.rotationRadian);
        context.translate(-dimensions.canvas.width / 2, -dimensions.canvas.height / 2);
        context.drawImage(image.resource, position.x, position.y, position.width, position.height);
        context.restore();
      }
    },
    transformDataWithRotation(x, y) {
      let radian = -this.rotationRadian;
      let rx = x * Math.cos(radian) - y * Math.sin(radian);
      let ry = x * Math.sin(radian) + y * Math.cos(radian);
      return [rx, ry];
    },
    calculatePosition(image, border) {
      image = image || this.state.image;
      var dimensions = this.getDimensions();
      let width = image.width * this.scale;
      let height = image.height * this.scale;
      var widthDiff = (width - dimensions.width) / 2;
      var heightDiff = (height - dimensions.height) / 2;
      var x = image.x * this.scale; // - widthDiff;
      var y = image.y * this.scale; // - heightDiff;
      [x, y] = this.transformDataWithRotation(x, y);
      x += border - widthDiff;
      y += border - heightDiff;
      return {
        x,
        y,
        height,
        width
      };
    },
    redraw() {
      this.context.clearRect(0, 0, this.getDimensions().canvas.width, this.getDimensions().canvas.height);
      this.paint();
      this.paintImage(this.context, this.state.image, this.border);
    },
    getImage() {
      const cropRect = this.getCroppingRect();
      const image = this.state.image;

      // get actual pixel coordinates
      cropRect.x *= image.resource.width;
      cropRect.y *= image.resource.height;
      cropRect.width *= image.resource.width;
      cropRect.height *= image.resource.height;

      // create a canvas with the correct dimensions
      const canvas = document.createElement('canvas');
      canvas.width = cropRect.width;
      canvas.height = cropRect.height;

      // draw the full-size image at the correct position,
      // the image gets truncated to the size of the canvas.
      canvas.getContext('2d').drawImage(image.resource, -cropRect.x, -cropRect.y);

      return canvas;
    },
    getImageScaled() {
      const { width, height } = this.getDimensions();

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      // don't paint a border here, as it is the resulting image
      this.paintImage(canvas.getContext('2d'), this.state.image, 0);

      return canvas;
    },
    imageChanged() {
      return this.changed;
    },
    getCroppingRect() {
      const dim = this.getDimensions();
      const frameRect = {
        x: dim.border,
        y: dim.border,
        width: dim.width,
        height: dim.height
      };
      const imageRect = this.calculatePosition(this.state.image, dim.border);

      return {
        x: (frameRect.x - imageRect.x) / imageRect.width,
        y: (frameRect.y - imageRect.y) / imageRect.height,
        width: frameRect.width / imageRect.width,
        height: frameRect.height / imageRect.height
      };
    },
    clicked(e) {
      if (this.dragged === true) {
        this.dragged = false;
      } else {
        this.$refs.input.click();
      }
    },
    fileSelected(e) {
      var files = e.target.files || e.dataTransfer.files;
      this.$emit('select-file', files);

      if (!files.length) {
        return;
      }

      // var image = new Image();
      var reader = new FileReader();

      this.changed = true;
      reader.onload = (e) => this.loadImage(e.target.result);
      reader.readAsDataURL(files[0]);
    },
    resetImage() {
      let self = this;
      this.canvas = this.$refs.avatarEditorCanvas;
      this.context = this.canvas.getContext('2d');
      self.imageLoaded = false;
      this.$emit('imageLoaded', self.imageLoaded);
      self.state = {
        drag: false,
        my: null,
        mx: null,
        xxx: 'ab',
        image: {
          x: 0,
          y: 0,
          resource: null
        }
      };
      this.context.clearRect(0, 0, this.getDimensions().canvas.width, this.getDimensions().canvas.height);
      this.paint();

      var placeHolder = this.svgToImage(this.placeholderSvg);

      placeHolder.onload = function () {
        var x = self.canvasWidth / 2 - this.width / 2;
        var y = self.canvasHeight / 2 - this.height / 2;
        self.context.drawImage(placeHolder, x, y, this.width, this.height);
      };
    }
  }
};
</script>

<style type="text/css">
.cursorPointer {
  cursor: pointer;
}

.cursorGrab {
  cursor: grab;
  cursor: -webkit-grab;
  cursor: -moz-grab;
}

.cursorGrabbing {
  cursor: grabbing;
  cursor: -webkit-grabbing;
  cursor: -moz-grabbing;
}
</style>
