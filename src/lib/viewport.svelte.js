const aspectRegExp = new RegExp("^x(?<x>M(?:in|id|ax))Y(?<y>M(?:in|id|ax))(?:\\s+(?<scale>meet|slice|none))$")

export class Viewport {
    #alignmentX = $state('Mid');
    #alignmentY = $state('Mid');
    #scaling = $state('meet');
    #minX = $state(-500);
    #minY = $state(-500);
    #maxX = $state(500);
    #maxY = $state(500);
    #targetWidth = $state(1000);
    #targetHeight = $state(1000);
    

    get aspectString() {
        if(this.#scaling === 'none') {
			return 'none'
		} else {
			return `x${this.#alignmentX}Y${this.#alignmentY} ${this.#scaling}`
		}
    }

    set aspectString(v) {
        const m = v.match(aspectRegExp)
        if(m) {
            this.#alignmentX = m.groups.x
            this.#alignmentY = m.groups.y
            this.#scaling = m.groups.scale
        }
    }

    get viewBoxString() {
        return `${this.#minX} ${this.#minY} ${this.width} ${this.height}`;
    }

    set viewBoxString(v) {
        [this.minX, this.#minY, this.width, this.height] = v.trim().split(/\s+/, 4).map(parseFloat)
    }
    
    get width() {
        return this.#maxX - this.#minX
    }
    
    get height() {
        return this.#maxY - this.#minY
    }
    
    set width(v) {
        this.#maxX = v + this.#minX
    }
    
    set height(v) {
        this.#maxY = v + this.#minY
    }
    
    get targetWidth() {
        return this.#targetWidth
    }
    
    get targetHeight() {
        return this.#targetHeight
    }
    
    set targetWidth(v) {
        this.#targetWidth = v
    }
    
    set targetHeight(v) {
        this.#targetHeight = v
    }
    
    get min() {
        return {
            x: this.#minX,
            y: this.#minY,
        }
    }

    get max() {
        return {
            x: this.#maxX,
            y: this.#maxY,
        }
    }
    
    get minX() {
        return this.#minX
    }

    set minX(v) {
        this.#minX = v
    }

    get maxX() {
        return this.#maxX
    }

    set maxX(v) {
        this.#maxX = v
    }

    get minY() {
        return this.#minY
    }

    set minY(v) {
        this.#minY = v
    }

    get maxY() {
        return this.#maxY
    }

    set maxY(v) {
        this.#maxY = v
    }
    
    get scaledViewBox() {
        if(this.#scaling === 'none') {
			return {
				minX: this.minX,
				minY: this.minY,
				width: this.width,
				height: this.height,
			}
		} else {
			const relWidth = this.width/this.targetWidth
			const relHeight = this.height/this.targetHeight
			
			const factor = {
				'meet': Math.max,
				'slice': Math.min
			}[this.#scaling].call(Math, relWidth, relHeight)

			const actualWidth = this.targetWidth * factor
			const actualHeight = this.targetHeight * factor
			const extraWidth = actualWidth - this.width
			const extraHeight = actualHeight - this.height

			const alignmentWeights = {
				'Min': 0,
				'Mid': 0.5,
				'Max': 1,
			};
			
			const extraWeightingX = alignmentWeights[this.#alignmentX];
			const extraWeightingY = alignmentWeights[this.#alignmentY];

			return {
				minX:  this.minX - extraWeightingX * extraWidth,
				minY: this.minY - extraWeightingY * extraHeight,
				width: actualWidth,
				height: actualHeight,
			}
		}
    }

    screenToSVG(x, y, targetLeft, targetTop, targetWidth, targetHeight) {
        const offsetX = x - targetLeft
        const offsetY = y - targetTop
        const relativeX = offsetX / targetWidth
        const relativeY = offsetY / targetHeight

        const scaledVB = this.scaledViewBox

        return {
            x: scaledVB.minX + scaledVB.width * relativeX,
            y: scaledVB.minY + scaledVB.height * relativeY,
        }
    }

    eventToSVG(evt, target) {
        const targetRect = target.getBoundingClientRect();
		
		return this.screenToSVG(
			evt.clientX, evt.clientY,
			targetRect.left, targetRect.top, 
			targetRect.width, targetRect.height
		)
    }

    delegate(fn) {
        return (evt) => fn(this.eventToSVG(evt, evt.currentTarget.ownerSVGElement), evt, this)
    }

    get visibleMin() {
        return this.screenToSVG(
			0, 0,
			0, 0, 
			this.#targetWidth, this.#targetHeight
		)
    }

    get visibleMax() {
        return this.screenToSVG(
			this.#targetWidth, this.#targetHeight,
			0, 0, 
			this.#targetWidth, this.#targetHeight
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

    *linspaceX() {
        yield* linspace(this.visibleMin.x, this.visibleMax.x, this.visibleWidth)
    }

    *linspaceY() {
        yield* linspace(this.visibleMin.y, this.visibleMax.y, this.visibleHeight)
    }
}



function lerp(a,b,t) {
    return (1-t)*a + t*b
}

function* linspace(a,b,c) {
    for(let i=0;i<=c;i++) {
        yield lerp(a,b,i/c)
    }
}

function* map(gen, fn) {
    for(const v of gen) {
        yield fn(v)
    }
}

function join(sep, gen) {
    let result = ''
    for(const v of gen) {
        if(result !== '') {
            result += sep
        }
        result += v
    }

    return result
}

function clamp2D(min, max, xy) {
    return {
        x: clamp(min.x, max.x, xy.x),
        y: clamp(min.y, max.y, xy.y),
    }
}

function clamp(min, max, v) {
    return Math.max(Math.min(v, max), min)
}