
<title>Posterior</title>

<script>
  import Canvas from '../lib/Canvas.svelte'
  import { Viewport } from '../lib/viewport.svelte';

    let vp = $state(new Viewport())
    //const vp2 = $state(new Viewport())

    let pressed = $state(false)
    let click = $state({x:0,y:0})
    let click2 = $state({x:0,y:0})
    let offset = $state({x:0,y:0})

    function press(local, evt, vp) {
        pressed = true
        offset.x = local.x - click.x
        offset.y = local.y - click.y

        evt.currentTarget.setPointerCapture(evt.pointerId);
    }
    function move(local, evt, vp) {
        if(pressed) {
            click = vp.clampVisible({
                x: local.x - offset.x,
                y: local.y - offset.y
            })
            click2 = vp.clampViewbox({
                x: local.x - offset.x,
                y: local.y - offset.y
            })
        }
    }
    function release(local, evt, vp) {
        pressed = false
    }

    function pdfGauss(x, m, std) {
        return Math.exp(-0.5*Math.pow((x-m)/std,2))/std/Math.sqrt(2*Math.PI)
    }

    function pdfLaplace(x, m, std) {
        return Math.exp(-Math.abs((x-m)/std))/std/2
    }

    function pdfUniform(x, m, std) {
        return Math.abs(x-m) < std ? 0.5/std : 0
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
</script>

<style>
    .grid {
        display: grid;
        grid-template-rows: auto;
        place-content: stretch;
        place-items: stretch;
    }
</style>

<div class="grid">
    <Canvas preserveAspectRatio="xMidYMid meet" let:ready bind:viewport={vp}>
        {#snippet children(v, ready)}
            {#if ready}
                {@const yScale = -v.visibleHeight*10}
                {@const mean = click.x}
                {@const std = Math.max(1, v.visibleWidth*Math.abs(click.y-v.visibleMin.y)/v.visibleHeight/10)}
        
                <g pointer-events="all">
                    <rect x={v.visibleMin.x} y={v.visibleMin.y} width={v.visibleWidth} height={v.visibleHeight} fill-opacity="0.1" fill="red"></rect>
                </g>
                <g pointer-events="none">
                    <line stroke-width="2" stroke="black" stroke-opacity="0.1" 
                    x1={v.visibleMin.x} x2={v.visibleMax.x} 
                    y1={v.visibleMin.y} y2={v.visibleMax.y}></line>
                    <line stroke-width="2" stroke="black" stroke-opacity="0.1" 
                    x1={v.visibleMax.x} x2={v.visibleMin.x} 
                    y1={v.visibleMin.y} y2={v.visibleMax.y}></line>
                    <line stroke-width="2" stroke="black" stroke-opacity="0.1" 
                    x1={0} x2={0} 
                    y1={v.visibleMin.y} y2={v.visibleMax.y}></line>
                    <line stroke-width="2" stroke="black" stroke-opacity="0.1" 
                    y1={0} y2={0} 
                    x1={v.visibleMin.x} x2={v.visibleMax.x}></line>
                    <polyline fill-opacity="0.1" fill="darkgreen" stroke="darkgreen" stroke-width="2" points={`${v.visibleMin.x},0,`+join(",", map(v.linspaceX(), x => `${x},${yScale*pdfGauss(x,mean,std)}`))+`,${v.visibleMax.x},0`} />
                    <polyline fill-opacity="0.1" fill="darkred" stroke="darkred" stroke-width="2" points={`${v.visibleMin.x},0,`+join(",", map(v.linspaceX(), x => `${x},${yScale*pdfLaplace(x,mean,std)}`))+`,${v.visibleMax.x},0`} />
                    <polyline fill-opacity="0.1" fill="darkblue" stroke="darkblue" stroke-width="2" points={`${v.visibleMin.x},0,`+join(",", map(v.linspaceX(), x => `${x},${yScale*pdfUniform(x,mean,std)}`))+`,${v.visibleMax.x},0`} />
                </g>
                <circle onpointermove={v.delegate(move)} onpointerup={v.delegate(release)} onpointerdown={v.delegate(press)} fill={pressed?'rebeccapurple':'purple'} cursor="move" cx={click.x} cy={click.y} r="70"></circle>
                <circle onpointermove={v.delegate(move)} onpointerup={v.delegate(release)} onpointerdown={v.delegate(press)} fill={pressed?'lightblue':'darkblue'} cursor="move" cx={click2.x} cy={click2.y} r="10"></circle>
            {/if}
        {/snippet}
    </Canvas>

    <p>
        {vp.targetWidth}&times;{vp.targetHeight}
    </p>

    
    <Canvas preserveAspectRatio="xMidYMid slice">
        {#snippet children(v, ready)}
        <circle  onpointermove={v.delegate(move)} onpointerup={v.delegate(release)} onpointerdown={v.delegate(press)} fill="purple" cursor="move" cx={click.x} cy={click.y} r="20"></circle>
        {/snippet}
    </Canvas>
</div>

