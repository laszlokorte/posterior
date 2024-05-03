import {Vec2, AABB2} from './vec2.js';

export class Aperture {
    #rect = new AABB2()
    #fit = 'meet'
    #alignX = 'Mid'
    #alignY = 'Mid'
}

export class Focus {
    #worldPosition = new Vec2()
    #worldRotation = 0
    #worldZoom = 1
}

export class Screen {
    #size = new Vec2()
}

export class Camera {
    #aparture = new Aparture()
    #focus = new Focus()
}

export class Viewport {
    #camera = new Camera()
    #screen = new Screen()
}

export class ViewportUtility {
    #viewort = new Viewport()
}

export class ViewportSVGAdapter {
    #viewort = new Viewport()

    get viewBox() {
        
    }

    set viewBox(string) {
        
    }

    get preserveAspectRatio() {
        
    }

    set preserveAspectRatio(string) {
        
    }

    set width(w) {
        
    }

    get width() {
        
    }

    set height(w) {
        
    }

    get height() {
        
    }
}

export class ViewportCanvasAdapter {
    #viewort = new Viewport()

    set width(w) {
        
    }

    get width() {
        
    }

    set height(w) {
        
    }

    get height() {
        
    }

    prerender(ctx) {

    }
}