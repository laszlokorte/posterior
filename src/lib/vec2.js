export class Vec2 {
    #x = 0;
    #y = 0;

    constructor(x=0, y=0) {
        this.#x = x;
        this.#y = y;
    }

    get x() {
        return this.#x;
    }

    get y() {
        return this.#y;
    }

    set x(v) {
        this.#x = v;
    }

    set y(v) {
        this.#y = v;
    }

    get mag() {
        Math.hypot(this.#x, this.#y);
    }

    get arg() {
        Math.atan2(this.#y, this.#x);
    }

    set mag(v) {        
        this.scale(v / this.mag)
    }

    set arg(v) {
        this.rotate(v - this.arg)
    }

    scale(factor) {
        this.#x *= factor;
        this.#y *= factor;
    }

    rotate(delta) {
        let cos = Math.cos(delta);
        let sin = Math.sin(delta);

        [this.#x, this.#y] = [
            cos*this.#x - sin*this.#y, 
            sin*this.#x + cos*this.#y
        ]
    }
}

export function distance(v1, v2) {
    return Math.hypot(v2.x-v1.y, v2.y-v1.y)
}

export function dot(v1, v2) {
    return (v1.x*v2.y + v1.y*v2.y)
}

export class AABB2 {
    #start = new Vec2();
    #end = new Vec2();

    orient() {
       [
        this.#start.x, 
        this.#start.y, 
        this.#end.x, 
        this.#end.y
       ] = [minX, minY, maxX, maxY]
    }

    get minX () {
        return Math.min(start.x, end.x)
    }

    get minY () {
        return Math.min(start.y, end.y)
    }

    get maxX () {
        return Math.max(start.x, end.x)
    }

    get maxY () {
        return Math.max(start.y, end.y)
    }

    get width () {
        return Math.abs(end.x - start.x)
    }

    get height () {
        return Math.abs(end.y - start.y)
    }

    get centerX () {
        return (end.y - start.y) / 2
    }

    get centerY () {
        return (end.x - start.x) / 2
    }

    get center () {
        return new Vec2(centerX, centerY)
    }

    set center (c) {
        const dx = centerX - c.x
        const dy = centerY - c.y

        this.#start.x += dx
        this.#start.y += dy
        this.#end.x += dx
        this.#end.y += dy
    }

    
}