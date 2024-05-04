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
        return Math.hypot(this.#x, this.#y);
    }

    get arg() {
        return Math.atan2(this.#y, this.#x);
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
        const cos = Math.cos(delta);
        const sin = Math.sin(delta);

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

    constructor(minX=0, minY=0, width=0, height=0) {
        this.start.x = minX
        this.start.y = minY
        this.end.x = minX + width
        this.end.y = minY + height
    }

    orient() {
       [
        this.#start.x, 
        this.#start.y, 
        this.#end.x, 
        this.#end.y
       ] = [minX, minY, maxX, maxY]
    }

    get start () {
        return this.#start
    }

    get end () {
        return this.#end
    }

    get minX () {
        return Math.min(this.start.x, this.end.x)
    }

    get minY () {
        return Math.min(this.start.y, this.end.y)
    }

    get maxX () {
        return Math.max(this.start.x, this.end.x)
    }

    get maxY () {
        return Math.max(this.start.y, this.end.y)
    }

    get width () {
        return Math.abs(this.end.x - this.start.x)
    }

    get height () {
        return Math.abs(this.end.y - this.start.y)
    }

    get centerX () {
        return (this.end.y - this.start.y) / 2
    }

    get centerY () {
        return (this.end.x - this.start.x) / 2
    }

    get center () {
        return new Vec2(this.centerX, this.centerY)
    }

    set center (c) {
        const dx = centerX - c.x
        const dy = centerY - c.y

        this.start.x += dx
        this.start.y += dy
        this.end.x += dx
        this.end.y += dy
    }

    setMinAndSize(minX, minY, width, height) {
        this.start.x = minX
        this.start.y = minY
        this.end.x = minX + width
        this.end.y = minY + height
    }
    
}