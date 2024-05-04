export function lerp(a,b,t) {
    return (1-t)*a + t*b
}

export function* linspace(a,b,c) {
    for(let i=0;i<=c;i++) {
        yield lerp(a,b,i/c)
    }
}

export function* map(gen, fn) {
    for(const v of gen) {
        yield fn(v)
    }
}

export function join(sep, gen) {
    let result = ''
    for(const v of gen) {
        if(result !== '') {
            result += sep
        }
        result += v
    }

    return result
}

export function clamp2D(min, max, xy) {
    return {
        x: clamp(min.x, max.x, xy.x),
        y: clamp(min.y, max.y, xy.y),
    }
}

export function clamp(min, max, v) {
    return Math.max(Math.min(v, max), min)
}