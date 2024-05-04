import {ViewportSVGAdapter} from './viewport.js'

export class SvelteViewportSVGAdapter {
    #svgAdapter = $state()
    
    constructor(plainAdapter) {
        this.#svgAdapter = plainAdapter
    }

    viewBox = $derived(this.#svgAdapter.viewBox)

    set viewBox(string) {
        this.#svgAdapter.viewBox = string
    }

    preserveAspectRatio = $derived(this.#svgAdapter.preserveAspectRatio)
    

    set preserveAspectRatio(string) {
        this.#svgAdapter.preserveAspectRatio = string
    }

    set width(w) {
        this.#svgAdapter.width = w
        this.#svgAdapter = this.#svgAdapter.clone()
    }

    width = $derived(this.#svgAdapter.width)
    

    set height(h) {
        this.#svgAdapter.height = h
        this.#svgAdapter = this.#svgAdapter.clone()
    }

    height = $derived(this.#svgAdapter.height)
    
    aperture = $derived(this.#svgAdapter.aperture)
    
    viewBoxMinX = $derived(this.#svgAdapter.viewBoxMinX)
    
    viewBoxMinY = $derived(this.#svgAdapter.viewBoxMinY)
    
    viewBoxWidth = $derived(this.#svgAdapter.viewBoxWidth)

    viewBoxHeight = $derived(this.#svgAdapter.viewBoxHeight)

    screenToWorld(x, y, targetLeft, targetTop, targetWidth, targetHeight) {
        return this.#svgAdapter.screenToWorld(x, y, targetLeft, targetTop, targetWidth, targetHeight)
    }

    eventToWorld(evt, target) {
        return this.#svgAdapter.eventToWorld(evt, target)
    }

    delegate(fn) {
        return (evt) => fn(this.eventToWorld(evt, evt.currentTarget.ownerSVGElement), evt, this)
    }
    
    visibleMin = $derived(this.#svgAdapter.visibleMin)

    visibleMax = $derived(this.#svgAdapter.visibleMax)    

    visibleWidth = $derived(this.#svgAdapter.visibleWidth)
    
    visibleHeight = $derived(this.#svgAdapter.visibleHeight)

    clampVisible(xy) {
        return this.#svgAdapter.clampVisible(xy)
    }

    clampViewbox(xy) {
        return this.#svgAdapter.clampViewbox(xy)
    }

    clampVisibleX(v) {
        return this.#svgAdapter.clampVisibleX(v)
    }

    clampVisibleY(v) {
        return this.#svgAdapter.clampVisibleY(v)
    }

    *linspaceX(padding) {
        yield* this.#svgAdapter.linspaceX(padding)
    }

    *linspaceY(padding) {
        yield* this.#svgAdapter.linspaceY(padding)
    }
}