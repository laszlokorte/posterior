import {Vec2, AABB2} from './vec2.js';


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

    get camera() {
        return this.#camera
    }

    get screen() {
        return this.#screen
    }

    get utility() {
        return new ViewportUtility(this)
    }

    get scaledViewBox() {
        const rect = this.#camera.aperture.rect;

        if(this.#camera.aperture.fit === 'none') {
			return rect
		} else {
			const relWidth = rect.width/this.#screen.x
			const relHeight = rect.height/this.#screen.y
			
			const factor = this.#camera.aperture.selectScaling(relWidth, relHeight)

			const actualWidth = this.#screen.x * factor
			const actualHeight = this.#screen.y * factor
			const extraWidth = actualWidth - rect.width
			const extraHeight = actualHeight - rect.height

			const extraWeightingX = Aperture.alignmentWeight(this.#camera.aperture.alignY);
			const extraWeightingY = Aperture.alignmentWeight(this.#camera.aperture.alignY);

			return new AABB2(
                rect.minX - extraWeightingX * extraWidth,
				rect.minY - extraWeightingY * extraHeight,
				actualWidth,
				actualHeight,
            )
		}
    }
}

export class ViewportUtility {
    #viewport = new Viewport()

    constructor(vp) {
        this.#viewport = vp
    }

    get svgAdapter() {
        return new ViewportSVGAdapter(this.#viewport)
    }

    get canvasAdapter() {
        return new ViewportCanvasAdapter(this.#viewport)
    }
}

export class ViewportSVGAdapter {
    static #aspectRegExp = new RegExp("^x(?<x>M(?:in|id|ax))Y(?<y>M(?:in|id|ax))(?:\\s+(?<scale>meet|slice|none))$")
    static #space = /\s+/
    
    #viewport = new Viewport()

    constructor(vp) {
        this.#viewport = vp
    }

    get viewBox() {
        const aperture = this.#viewport.camera.aperture

        return `${aperture.rect.minX} ${aperture.rect.minY} ${aperture.rect.width} ${aperture.rect.height}`
    }

    set viewBox(string) {
        const aperture = this.#viewport.camera.aperture

        const [minX, minY, width, height] = string.split(ViewportSVGAdapter.#space, 4).map(parseFloat)

        aperture.rect.setMinAndSize(minX, minY, width, height)
    }

    get preserveAspectRatio() {
        const aperture = this.#viewport.camera.aperture
        
        `x${aperture.alignX}Y${aperture.alignX} ${aperture.scale}`
    }

    set preserveAspectRatio(string) {
        const m = string.match(ViewportSVGAdapter.#aspectRegExp)
        if(!m) {
            throw "invalid viewBox value"
        }

        this.#viewport.camera.aperture.alignX = m.groups.x
        this.#viewport.camera.aperture.alignY = m.groups.y
        this.#viewport.camera.aperture.scale = m.groups.scale
    }

    set width(w) {
        this.#viewport.screen.size.x = w
    }

    get width() {
        return this.#viewport.screen.size.x
    }

    set height(h) {
        this.#viewport.screen.size.y = h
    }

    get height() {
        return this.#viewport.screen.size.y
    }

    screenToWorld(x, y, targetLeft, targetTop, targetWidth, targetHeight) {
        const offsetX = x - targetLeft
        const offsetY = y - targetTop
        const relativeX = offsetX / targetWidth
        const relativeY = offsetY / targetHeight

        const scaledVB = this.#viewport.scaledViewBox

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
}

export class ViewportCanvasAdapter {
    #viewport = new Viewport()

    set width(w) {
        this.#viewport.screen.size.x = w
    }

    get width() {
        return this.#viewport.screen.size.x
    }

    set height(h) {
        this.#viewport.screen.size.y = h
    }

    get height() {
        return this.#viewport.screen.size.y
    }

    prerender(ctx) {

    }
}