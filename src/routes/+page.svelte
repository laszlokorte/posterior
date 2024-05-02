
<title>Posterior</title>

<script>
  import Canvas from '../lib/Canvas.svelte'
  import { Viewport } from '../lib/viewport.svelte';

    let vp = $state(new Viewport())
    //const vp2 = $state(new Viewport())

    let debug = $state(false)
    let pressedMean = $state(false)
    let pressedStdDev = $state(false)
    let mean = $state(20)
    let stdDev = $state(20)
    let pressOffset = $state(0)

    let samples = $state([])

    function addSample({x}) {
        samples.push(x)
    }

    function clearSamples() {
        samples.length = 0
    }

    function pressMean(local, evt, vp) {
        pressedMean = true
        pressOffset = local.x - mean

        evt.currentTarget.setPointerCapture(evt.pointerId);
    }

    function pressStdDev(local, evt, vp) {
        pressedStdDev = true
        pressOffset = local.x - stdDev

        evt.currentTarget.setPointerCapture(evt.pointerId);
    }

    function move(local, evt, vp) {
        if(pressedMean) {
            mean = vp.clampVisibleX(local.x - pressOffset)
        } else if(pressedStdDev) {
            stdDev = Math.max(0, vp.clampVisibleX(local.x - pressOffset))
        }
    }

    function release(local, evt, vp) {
        pressedMean = false
        pressedStdDev = false
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

    .hidden {
        display: none
    }

    polyline {
        shape-rendering: geometricPrecision;
    }

    path, line {
        shape-rendering: geometricPrecision;
    }

    .axis-line {
        stroke-width: 1px;
    }

    .plot-line {
        stroke-width: 1px;
    }
    
    .axis-arrowhead {
        shape-rendering: optimizeSpeed;
    }

    .plot-area {
        shape-rendering: optimizeSpeed;
    }

    .label-text {
        pointer-events: none;
        user-select: none;
    }
</style>

<div class="grid">
    <Canvas preserveAspectRatio="xMidYMid meet" let:ready bind:viewport={vp}>
        {#snippet children(v, ready)}
            {#if ready}
                {@const yScale = -v.visibleHeight*30}
                {@const axisPadding = 5}
                {@const std = Math.max(1, stdDev)}
        
                <g pointer-events="all">
                    <rect x={v.visibleMin.x} y={v.visibleMin.y} width={v.visibleWidth} height={v.visibleHeight}  fill="white"></rect>
                </g>
                <g class:hidden={!debug} pointer-events="none">
                    <line stroke-width="1px" stroke="black" stroke-opacity="0.1" 
                    x1={v.visibleMin.x} x2={v.visibleMax.x} 
                    y1={v.visibleMin.y} y2={v.visibleMax.y}></line>
                    <line stroke-width="1px" stroke="black" stroke-opacity="0.1" 
                    x1={v.visibleMax.x} x2={v.visibleMin.x} 
                    y1={v.visibleMin.y} y2={v.visibleMax.y}></line>
                    <line stroke-width="1px" stroke="black" stroke-opacity="0.1" 
                    x1={0} x2={0} 
                    y1={v.visibleMin.y} y2={v.visibleMax.y}></line>
                    <line stroke-width="1px" stroke="black" stroke-opacity="0.1" 
                    y1={0} y2={0} 
                    x1={v.visibleMin.x} x2={v.visibleMax.x}></line>
                </g>
                <g>
                    <line class="axis-line" stroke="black" 
                    x1={0} x2={0} 
                    y1={v.visibleMin.y+axisPadding} y2={v.visibleMax.y-axisPadding}></line>
                    <line class="axis-line" stroke="black" 
                    y1={0} y2={0} 
                    x1={v.visibleMin.x+axisPadding} x2={v.visibleMax.x-axisPadding}></line>
                </g>
                <g>
                    <path class="axis-arrowhead" d="M{v.visibleMax.x},0l-10,-5v10z" fill="black" />
                    <path class="axis-arrowhead" d="M0,{v.visibleMin.y}l-5,10h10z" fill="black" />
                </g>
                <g>
                    <polyline class="plot-area" fill-opacity="0.1" fill="darkgreen" stroke="none" stroke-width="2" points={`${v.visibleMin.x+axisPadding},0,`+join(",", map(v.linspaceX(axisPadding), x => `${x},${yScale*pdfGauss(x,mean,std)}`))+`,${v.visibleMax.x-axisPadding},0`} />
                    <polyline class="plot-area" fill-opacity="0.1" fill="darkred" stroke="none" stroke-width="2" points={`${v.visibleMin.x+axisPadding},0,`+join(",", map(v.linspaceX(axisPadding), x => `${x},${yScale*pdfLaplace(x,mean,std)}`))+`,${v.visibleMax.x-axisPadding},0`} />
                    <polyline class="plot-area" fill-opacity="0.1" fill="darkblue" stroke="none" stroke-width="2" points={`${v.visibleMin.x+axisPadding},0,`+join(",", map(v.linspaceX(axisPadding), x => `${x},${yScale*pdfUniform(x,mean,std)}`))+`,${v.visibleMax.x-axisPadding},0`} />
                    <polyline class="plot-line" fill="none" stroke="darkgreen" stroke-width="2" points={join(",", map(v.linspaceX(axisPadding), x => `${x},${yScale*pdfGauss(x,mean,std)}`))} />
                    <polyline class="plot-line" fill="none" stroke="darkred" stroke-width="2" points={join(",", map(v.linspaceX(axisPadding), x => `${x},${yScale*pdfLaplace(x,mean,std)}`))} />
                    <polyline class="plot-line" fill="none" stroke="darkblue" stroke-width="2" points={join(",", map(v.linspaceX(axisPadding), x => `${x},${yScale*pdfUniform(x,mean,std)}`))} />
                </g>
                <rect fill-opacity="0.2" fill="#ffff33" x={v.visibleMin.x} y={0}  width={v.visibleWidth} height={40} onpointerdown={v.delegate(addSample)} />
                <g pointer-events="none">
                    {#each samples as x}
                    <circle cx={x} cy={5} r="5" fill="darkred"></circle>
                    <line x1={x+1} y1={0} x2={x+1} y2={yScale*pdfGauss(x, mean, std)} stroke="darkgreen"></line>
                    <line x1={x} y1={0} x2={x} y2={yScale*pdfLaplace(x, mean, std)} stroke="darkred"></line>
                    <line x1={x-1} y1={0} x2={x-1} y2={yScale*pdfUniform(x, mean, std)} stroke="darkblue"></line>
                    {/each}
                </g>
                <circle onpointermove={v.delegate(move)} onpointerup={v.delegate(release)} onpointerdown={v.delegate(pressMean)} fill={pressedMean?'rebeccapurple':'purple'} cursor="move" cx={mean} cy={v.visibleMin.y/2} r="20"></circle>
                <circle onpointermove={v.delegate(move)} onpointerup={v.delegate(release)} onpointerdown={v.delegate(pressStdDev)} fill={pressedStdDev?'lightblue':'darkblue'} cursor="move" cx={mean+ stdDev} cy={v.visibleMin.y/2} r="15"></circle>
                <text class="label-text" x={mean} y={v.visibleMin.y/2-30} text-anchor="middle">Mean</text>  
                <text class="label-text" x={mean+stdDev} y={v.visibleMin.y/2+30} text-anchor="middle">StdDev</text>    
            {/if}
        {/snippet}
    </Canvas>

    <div>
        <label><input type="checkbox" bind:checked={debug}> Debug</label>
        <button onclick={clearSamples}>Clear</button>
        <p>
            {vp.targetWidth}&times;{vp.targetHeight}
        </p>
    
    </div>
    
    <Canvas preserveAspectRatio="xMidYMid slice">
        {#snippet children(v, ready)}
        <circle  fill="purple" cursor="move" cx={mean} cy={stdDev} r="20"></circle>
        {/snippet}
    </Canvas>
</div>

