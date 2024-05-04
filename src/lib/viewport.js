import {Vec2, AABB2} from './vec2.js';
import {lerp,
    linspace,
    map,
    join,
    clamp2D,
    clamp} from './utils.js'


export class Aperture {
    #rect = new AABB2()
    #fit = 'meet'
    #alignX = 'Mid'
    #alignY = 'Mid'

    get rect() {
        return this.#rect
    }

    get fit() {
        return this.#fit
    }

    get alignX() {
        return this.#alignX
    }

    get alignY() {
        return this.#alignY
    }

    set fit(value) {
        this.#fit = value
    }

    set alignX(value) {
        this.#alignX = value
    }

    set alignY(value) {
        this.#alignY = value
    }

    selectScaling(relWidth, relHeight) {
        return {
            'meet': Math.max,
            'slice': Math.min
        }[this.#fit].call(Math, relWidth, relHeight)
    }

    static alignmentWeight(alignment) {
        return {
            'Min': 0,
            'Mid': 0.5,
            'Max': 1,
        }[alignment];
    }
}

export class Focus {
    #worldPosition = new Vec2()
    #worldRotation = 0
    #worldZoom = 1

    get worldPosition() {
        return this.#worldPosition
    }

    get worldRotation() {
        return this.#worldRotation
    }

    get worldZoom() {
        return this.#worldZoom
    }

    set worldZoom(value) {
        this.#worldZoom = value
    }
}

export class Screen {
    #size = new Vec2()

    get size() {
        return this.#size
    }
}

export class Camera {
    #aperture = new Aperture()
    #focus = new Focus()

    get focus() {
        return this.#focus
    }

    get aperture() {
        return this.#aperture
    }
}

export class Viewport {
    #camera = new Camera()
    #screen = new Screen()
    #scaled = new AABB2()

    get camera() {
        return this.#camera
    }

    get screen() {
        return this.#screen
    }

    get scaledViewBox() {
        const rect = this.#camera.aperture.rect;

        if(this.#camera.aperture.fit === 'none') {
			this.#scaled.setMinAndSize(rect.minX, rect.minY, rect.width, rect.height)
		} else {
			const relWidth = rect.width/this.#screen.size.x
			const relHeight = rect.height/this.#screen.size.y
			
			const factor = this.#camera.aperture.selectScaling(relWidth, relHeight)

			const actualWidth = this.#screen.size.x * factor
			const actualHeight = this.#screen.size.y * factor
			const extraWidth = actualWidth - rect.width
			const extraHeight = actualHeight - rect.height

			const extraWeightingX = Aperture.alignmentWeight(this.#camera.aperture.alignY);
			const extraWeightingY = Aperture.alignmentWeight(this.#camera.aperture.alignY);

            this.#scaled.setMinAndSize(
                rect.minX - extraWeightingX * extraWidth,
				rect.minY - extraWeightingY * extraHeight,
				actualWidth,
				actualHeight
            )
		}

        return this.#scaled
    }
}

export class ReactiveViewport {
    #viewport
    #svgAdapter
    #canvasAdapter
    #subscribers = new Set()

    constructor(vp = new Viewport()) {
        this.#viewport = vp
        this.#svgAdapter = new ViewportSVGAdapter(this)
        this.#canvasAdapter = new ViewportCanvasAdapter(this)
    }

    get svgAdapter() {
        return this.#svgAdapter
    }

    get canvasAdapter() {
        return this.#canvasAdapter
    }

    get camera() {
        return this.#viewport.camera
    }

    get screen() {
        return this.#viewport.screen
    }

    get scaledViewBox() {
        return this.#viewport.scaledViewBox
    }

    subscribe(fn) {
        this.#subscribers.add(fn)
        fn(this)
        
        return () => {
            this.#subscribers.delete(fn)
        }
    }

    notify(fn) {
        this.#svgAdapter = new ViewportSVGAdapter(this)
        this.#canvasAdapter = new ViewportCanvasAdapter(this)

        for(let sub of this.#subscribers) {
            sub(this)
        }
    }
}

export class ViewportSVGAdapter {
    static #aspectRegExp = new RegExp("^x(?<x>M(?:in|id|ax))Y(?<y>M(?:in|id|ax))(?:\\s+(?<fit>meet|slice|none))$")
    static #space = /\s+/
    
    #reactiveViewport

    constructor(vp) {
        this.#reactiveViewport = vp
    }

    get viewBox() {
        const aperture = this.#reactiveViewport.camera.aperture

        return `${aperture.rect.minX} ${aperture.rect.minY} ${aperture.rect.width} ${aperture.rect.height}`
    }

    set viewBox(string) {
        const aperture = this.#reactiveViewport.camera.aperture

        const [minX, minY, width, height] = string.split(ViewportSVGAdapter.#space, 4).map(parseFloat)

        aperture.rect.setMinAndSize(minX, minY, width, height)
        this.#reactiveViewport.notify()
    }

    get preserveAspectRatio() {
        const aperture = this.#reactiveViewport.camera.aperture
        
        return `x${aperture.alignX}Y${aperture.alignX} ${aperture.fit}`
    }

    set preserveAspectRatio(string) {
        const m = string.match(ViewportSVGAdapter.#aspectRegExp)
        if(!m) {
            throw "invalid viewBox value"
        }

        this.#reactiveViewport.camera.aperture.alignX = m.groups.x
        this.#reactiveViewport.camera.aperture.alignY = m.groups.y
        this.#reactiveViewport.camera.aperture.fit = m.groups.fit
        this.#reactiveViewport.notify()
    }

    set width(w) {
        this.#reactiveViewport.screen.size.x = w
        this.#reactiveViewport.notify()
    }

    get width() {
        return this.#reactiveViewport.screen.size.x
    }

    set height(h) {
        this.#reactiveViewport.screen.size.y = h
        this.#reactiveViewport.notify()
    }

    get height() {
        return this.#reactiveViewport.screen.size.y
    }

    get aperture() {
        return this.#reactiveViewport.camera.aperture
    }

    get viewBoxMinX() {
        return this.aperture.rect.minX
    }

    get viewBoxMinY() {
        return this.aperture.rect.minY
    }

    get viewBoxWidth() {
        return this.aperture.rect.width
    }

    get viewBoxHeight() {
        return this.aperture.rect.height
    }

    screenToWorld(x, y, targetLeft, targetTop, targetWidth, targetHeight) {
        const offsetX = x - targetLeft
        const offsetY = y - targetTop
        const relativeX = offsetX / targetWidth
        const relativeY = offsetY / targetHeight

        const scaledVB = this.#reactiveViewport.scaledViewBox

        return {
            x: scaledVB.minX + scaledVB.width * relativeX,
            y: scaledVB.minY + scaledVB.height * relativeY,
        }
    }

    eventToWorld(evt, target) {
        const targetRect = target.getBoundingClientRect();
		

		return this.screenToWorld(
			evt.clientX, evt.clientY,
			targetRect.left, targetRect.top, 
			targetRect.width, targetRect.height
		)
    }

    delegate(fn) {
        return (evt) => fn(this.eventToWorld(evt, evt.currentTarget.ownerSVGElement), evt, this)
    }
    
    get visibleMin() {
        return this.screenToWorld(
			0, 0,
			0, 0, 
			this.width, this.height
		)
    }

    get visibleMax() {
        return this.screenToWorld(
			this.width, this.height,
			0, 0, 
			this.width, this.height
		)
    }

    get visibleWidth() {
        return this.visibleMax.x - this.visibleMin.x
    }

    get visibleHeight() {
        return this.visibleMax.y - this.visibleMin.y
    }

    clampVisible(xy) {
        return clamp2D(this.visibleMin, this.visibleMax, xy)
    }

    clampViewbox(xy) {
        return clamp2D(this.min, this.max, xy)
    }

    clampVisibleX(v) {
        return clamp(this.visibleMin.x, this.visibleMax.x, v)
    }

    clampVisibleY(v) {
        return clamp(this.visibleMin.y, this.visibleMax.y, v)
    }

    *linspaceX(padding) {
        yield* linspace(this.visibleMin.x+padding, this.visibleMax.x-padding, this.visibleWidth)
    }

    *linspaceY(padding) {
        yield* linspace(this.visibleMin.y+padding, this.visibleMax.y-padding, this.visibleHeight)
    }
}


export class ViewportCanvasAdapter {
    #reactiveViewport

    constructor(vp) {
        this.#reactiveViewport = vp
    }

    set width(w) {
        this.#reactiveViewport.screen.size.x = w
    }

    get width() {
        return this.#reactiveViewport.screen.size.x
    }

    set height(h) {
        this.#reactiveViewport.screen.size.y = h
    }

    get height() {
        return this.#reactiveViewport.screen.size.y
    }

    prerender(ctx) {

    }
}