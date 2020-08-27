import resizeSensor from 'vue-resize-sensor'

export default function(pdfjsWrapper) {

	var createLoadingTask = pdfjsWrapper.createLoadingTask;
	var PDFJSWrapper = pdfjsWrapper.PDFJSWrapper;

	return {
		createLoadingTask: createLoadingTask,
		render: function(h) {
			return h('span', {
				attrs: {
					style: 'position: relative; display: inline-block'
				},
				ref:'span'
			}, [
				h('canvas', {
					attrs: {
						style: 'display: inline-block; width: 100%; vertical-align: top;z-index: 1000',
					},
					on: {
						click: (e) => {
							this.clickMehotd(e)
						},
						mousedown: (e) => {
							this.mouseDownMethod(e)
						},
						contextmenu: (e) => {
							this.contextMenuMethod(e)
						},
            touchstart: (e) => {
              this.touchstart(e);
            }

					},
					ref:'canvas'
				}),
				h('span', {
					style: 'display: inline-block; width: 100%;z-index:-1',
					class: 'annotationLayer',
					ref:'annotationLayer'
				}),
				h(resizeSensor, {
					props: {
						initial: true
					},
					on: {
						resize: this.resize
					},
				})
			])
		},
		props: {
			src: {
				type: [String, Object, Uint8Array],
				default: '',
			},
			originalSrc: {
				type: String,
				defalut: undefined
			},
			page: {
				type: Number,
				default: 1,
			},
			rotate: {
				type: Number,
			},
			pdfPageSource: {
				type: Object,
				defalut: {}
			}
		},
		watch: {
			originalSrc: function() {
				this.pdf.loadOriginalDocument(this.originalSrc)
			},
			src: function() {
				this.pdf.loadDocument(this.src);
			},
			page: function(newVal, oldVal) {
				console.log(this.pdfPageSource)
				if (this.pdfPageSource !== undefined && this.pdfPageSource[newVal]) {
					console.log('load for original')
					this.pdf.loadPageFromOriginal(newVal, this.rotate)
				} else {
					this.pdf.loadPage(this.page, this.rotate);
				}
			},
			rotate: function() {
				this.pdf.renderPage(this.rotate);
			},
		},
		methods: {
			restorePage: function() {
				this.pdf.loadPage(this.page, this.rotate);
			},
			resotreOriginalPage: function() {
				this.pdfPageSource[this.page] = true
				this.pdf.loadPageFromOriginal(this.page, this.rotate)
			},
		  mouseDownMethod: function(e) {
			this.$emit('mouseDownMethod', e)
		  },
		  contextMenuMethod: function (e) {
  			this.$emit('contextmenu', e)
		  },
      touchstart: function (e) {
        this.$emit('touchstart', e)
      },
      clickMehotd: function(e) {
			this.$emit('clickPDF', e)
		  },
			resize: function(size) {
				
				// check if the element is attached to the dom tree || resizeSensor being destroyed
				if ( this.$el.parentNode === null || (size.width === 0 && size.height === 0) )
					return;

				// on IE10- canvas height must be set
				this.$refs.canvas.style.height = this.$refs.canvas.offsetWidth * (this.$refs.canvas.height / this.$refs.canvas.width) + 'px';
				// update the page when the resolution is too poor
				var resolutionScale = this.pdf.getResolutionScale();

				if ( resolutionScale < 0.85 || resolutionScale > 1.15 )
					this.pdf.renderPage(this.rotate);

				this.$refs.annotationLayer.style.transform = 'scale('+resolutionScale+')';
				this.$emit('resize')
			},
			print: function(dpi, pageList) {

				this.pdf.printPage(dpi, pageList);
			},

		},

		// doc: mounted hook is not called during server-side rendering.
		 mounted: function() {
			 this.pdf = new PDFJSWrapper(this.$refs.canvas, this.$refs.annotationLayer, this.$emit.bind(this));

			this.$on('loaded', function() {

				this.pdf.loadPage(this.page, this.rotate);
			});

			this.$on('page-size', function(width, height) {

				this.$refs.canvas.style.height = this.$refs.canvas.offsetWidth * (height / width) + 'px';
			});

			this.pdf.loadDocument(this.src);
		},
    activated: function() {
			this.pdf = new PDFJSWrapper(this.$refs.canvas, this.$refs.annotationLayer, this.$emit.bind(this));

      this.$on('loaded', function() {

        this.pdf.loadPage(this.page, this.rotate);
      });

      this.$on('page-size', function(width, height) {

        this.$refs.canvas.style.height = this.$refs.canvas.offsetWidth * (height / width) + 'px';
      });

      this.pdf.loadDocument(this.src);
    },
		// doc: destroyed hook is not called during server-side rendering.
		destroyed: function() {

			this.pdf.destroy();
		}
	}

}
